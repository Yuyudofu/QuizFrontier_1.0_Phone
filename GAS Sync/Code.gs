/**
 * Qu1zFr0ntier GAS sync backend.
 * Bind this script to a Google Spreadsheet, set SYNC_TOKEN in Script Properties,
 * and deploy as a Web app: Execute as Me / Who has access: Anyone.
 */
const SHEET_NAME = 'quiz_data';
const META_CELL = 'A1';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    checkToken(body.token);
    if (body.action === 'read') return json({ ok: true, data: readData(body.selectedDeckIds || []) });
    if (body.action === 'write') { writeData(body.data || {}); return json({ ok: true }); }
    throw new Error('unknown action');
  } catch (error) { return json({ ok: false, error: error.message }); }
}

function checkToken(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('SYNC_TOKEN');
  if (!expected || !token || token !== expected) throw new Error('同期トークンが正しくありません');
}

function sheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  return book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
}

function readData(selectedDeckIds) {
  const target = sheet();
  const values = target.getDataRange().getValues();
  if (values.length < 2) return null;
  const meta = JSON.parse(values[0][1] || '{}');
  const selected = new Set(selectedDeckIds.length ? selectedDeckIds : (meta.selectedDeckIds || []));
  const headers = values[1];
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));
  const questions = values.slice(2).filter((row) => {
    const deckIds = String(row[index.deckIds] || '').split('|').filter(Boolean);
    return !selected.size || deckIds.some((deckId) => selected.has(deckId));
  }).map((row) => ({
    id: String(row[index.id] || ''), q: String(row[index.q] || ''), a: String(row[index.a] || ''), decks: String(row[index.deckIds] || '').split('|').filter(Boolean),
    level: Number(row[index.level] || 0), attempts: Number(row[index.attempts] || 0), correct: Number(row[index.correct] || 0), wrong: Number(row[index.wrong] || 0), favorite: String(row[index.favorite]) === 'true', createdAt: Number(row[index.createdAt] || Date.now())
  }));
  return { decks: (meta.decks || []).filter((deck) => deck.system || !selected.size || selected.has(deck.id)), questions, history: [], historySummary: meta.historySummary || {}, selectedDeckIds: [...selected] };
}

function writeData(data) {
  const target = sheet();
  const existing = target.getDataRange().getValues();
  const oldMeta = existing.length ? JSON.parse(existing[0][1] || '{}') : {};
  const questions = Array.isArray(data.questions) ? data.questions : [];
  const decks = Array.isArray(data.decks) ? data.decks : [];
  const selected = new Set(data.selectedDeckIds || []);
  const headers = ['id', 'deckIds', 'q', 'a', 'level', 'attempts', 'correct', 'wrong', 'favorite', 'createdAt'];
  const existingHeaders = existing[1] || headers;
  const existingIndex = Object.fromEntries(existingHeaders.map((header, i) => [header, i]));
  const untouchedRows = existing.slice(2).filter((row) => {
    const ids = String(row[existingIndex.deckIds] || '').split('|').filter(Boolean);
    return !selected.size || !ids.some((id) => selected.has(id));
  });
  const rows = questions.map((question) => [question.id, (question.decks || []).join('|'), question.q, question.a, question.level || 0, question.attempts || 0, question.correct || 0, question.wrong || 0, Boolean(question.favorite), question.createdAt || Date.now()]);
  const preservedDecks = (oldMeta.decks || []).filter((deck) => deck.system || !selected.has(deck.id));
  const metaDecks = [...preservedDecks, ...decks.filter((deck) => !preservedDecks.some((old) => old.id === deck.id))];
  const meta = { decks: metaDecks, selectedDeckIds: [...selected], historySummary: data.historySummary || {}, updatedAt: new Date().toISOString() };
  const output = [[ 'META', JSON.stringify(meta) ], headers, ...untouchedRows, ...rows];
  target.clearContents();
  target.getRange(1, 1, output.length, headers.length).setValues(output.map((row) => row.concat(Array(Math.max(0, headers.length - row.length)).fill(''))));
}

function json(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
