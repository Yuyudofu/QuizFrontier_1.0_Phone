/* Google Apps Script sync. One read per explicit sync; detailed history stays local. */
(() => {
  const CONFIG_KEY = 'quiz-gas-sync-config';
  let config = readConfig();
  const snapshot = () => (typeof data !== 'undefined' ? data : JSON.parse(localStorage.getItem('quiz-forge-v1') || '{}'));
  const selectedDecks = () => { const local = snapshot(); const available = (local.decks || []).filter((deck) => !deck.system); const saved = Array.isArray(config.deckIds) ? config.deckIds : available.map((deck) => deck.id); return available.filter((deck) => saved.includes(deck.id)).map((deck) => deck.id); };
  function readConfig() { try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch { return {}; } }
  function saveConfig() { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); }
  function endpoint() { return String(config.url || '').trim(); }
  function busy(message) { const overlay = $('#syncBusy'); if (overlay) { $('#syncBusyText').textContent = message; overlay.hidden = false; } }
  function idle() { const overlay = $('#syncBusy'); if (overlay) overlay.hidden = true; }
  function payload() {
    const local = snapshot();
    const deckIds = selectedDecks();
    const questions = (local.questions || []).filter((question) => (question.decks || []).some((deckId) => deckIds.includes(deckId)));
    const history = Array.isArray(local.history) ? local.history : [];
    const correct = history.filter((item) => item.result === 'correct').length;
    return { decks: (local.decks || []).filter((deck) => deck.system || deckIds.includes(deck.id)), questions, historySummary: { total: history.length, correct, wrong: history.length - correct, accuracy: history.length ? Math.round(correct / history.length * 100) : 0, lastPlayedAt: history.length ? history[history.length - 1].at || null : null }, selectedDeckIds: deckIds };
  }
  async function request(action, body = {}) {
    if (!endpoint() || !config.token) throw Error('GAS WebアプリURLと同期トークンを入力してください');
    const response = await fetch(endpoint(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: config.token, ...body }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok === false) throw Error(result.error || 'GAS同期に失敗しました');
    return result;
  }
  function updateStatus() { const button = $('#syncOpen'); if (button) { button.dataset.on = String(Boolean(config.url && config.token)); button.textContent = config.url && config.token ? '☁ 同期設定済み' : '☁ 同期'; } }
  function renderDeckChoices() {
    const local = snapshot(); const decks = (local.decks || []).filter((deck) => !deck.system); const chosen = new Set(selectedDecks());
    const container = $('#syncDecks'); if (!container) return;
    container.innerHTML = decks.length ? decks.map((deck) => `<label><input type="checkbox" data-sync-deck="${deck.id}" ${chosen.has(deck.id) ? 'checked' : ''}>${String(deck.name).replace(/[&<>]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c]))}</label>`).join('') : '<small>同期できる問題セットがありません</small>';
  }
  function applyRemote(remote) {
    if (!remote || !Array.isArray(remote.questions) || !Array.isArray(remote.decks)) return;
    const local = snapshot();
    const decks = remote.decks.filter((deck) => deck.kind !== 'folder');
    const validDecks = new Set(decks.map((deck) => deck.id));
    const questions = remote.questions.map((question) => ({ ...question, decks: (question.decks || []).filter((deckId) => validDecks.has(deckId)).length ? (question.decks || []).filter((deckId) => validDecks.has(deckId)) : ['general'] }));
    window.dispatchEvent(new CustomEvent('quiz-remote-data', { detail: { ...remote, decks, questions, settings: local.settings || {}, history: Array.isArray(local.history) ? local.history : [] } }));
  }
  async function syncNow(initial = false) {
    config.deckIds = [...document.querySelectorAll('[data-sync-deck]:checked')].map((input) => input.dataset.syncDeck);
    saveConfig(); updateStatus();
    try {
      busy('クラウドから読み取り中…');
      $('#syncMessage').textContent = '読み込み中…';
      const result = await request('read', { selectedDeckIds: selectedDecks() });
      if (result.data && result.data.questions?.length) {
        applyRemote(result.data);
        $('#syncMessage').textContent = 'クラウドから読み込みました';
      } else if (initial && snapshot().questions?.length) {
        await request('write', { data: payload() });
        $('#syncMessage').textContent = '初回データをクラウドへ書き込みました';
      } else {
        $('#syncMessage').textContent = '同期しました（書き込むデータがありません）';
      }
      return true;
    } catch (error) { $('#syncMessage').textContent = `読み取り失敗: ${error.message}`; return false; }
    finally { idle(); }
  }
  async function writeNow(showMessage = false) {
    try {
      busy('クラウドへ書き込み中…');
      const result = await request('write', { data: payload() });
      if (showMessage) $('#syncMessage').textContent = `クラウドへ保存しました（${payload().questions.length}問）`;
      return result;
    } catch (error) {
      if (showMessage) $('#syncMessage').textContent = `書き込み失敗: ${error.message}`;
      console.warn('GAS sync failed', error);
      throw error;
    } finally { idle(); }
  }
  document.body.insertAdjacentHTML('beforeend', `<div id="syncBusy" class="sync-busy" hidden><div class="sync-spinner"></div><strong id="syncBusyText">同期中…</strong><small>しばらくお待ちください</small></div><button id="syncOpen" class="sync-open">☁ 同期</button><dialog id="syncDialog"><form method="dialog" id="syncForm"><button class="sync-close" type="button">×</button><h2>GASクラウド同期</h2><p class="sync-desc">読み取りと書き込みを分けています。必要な操作を選んでください。</p><label>GAS WebアプリURL<input id="gasUrl" type="url" required placeholder="https://script.google.com/macros/s/.../exec"></label><label>同期トークン<input id="gasToken" type="password" required placeholder="自分で決めた長い文字列"></label><div class="sync-deck-head"><b>対象の問題セット</b><button id="syncSelectAll" type="button">全選択</button></div><div id="syncDecks" class="sync-decks"></div><div class="sync-actions"><button id="syncRead" type="button">クラウドから読み取り</button><button id="syncWrite" type="button">クラウドへ書き込み</button><button class="sync-primary" type="submit">設定を保存</button></div><button id="syncDisconnect" type="button" class="sync-disconnect">同期設定を解除</button><p id="syncMessage" class="sync-message"></p></form></dialog>`);
  const style = document.createElement('style'); style.textContent = '.sync-open{position:fixed;right:14px;bottom:calc(94px + env(safe-area-inset-bottom));z-index:30;border:1px solid #ffcce0;border-radius:999px;padding:9px 13px;background:#fff;color:#7a5c58;font:700 12px system-ui;box-shadow:0 5px 18px #d58da655;cursor:pointer}.sync-open[data-on="true"]{background:#55efc4}.sync-close{position:absolute;right:12px;top:8px;border:0;background:transparent;font-size:24px;color:#b89893;cursor:pointer}.sync-disconnect{border:0;background:transparent;color:#c86c85;text-decoration:underline;cursor:pointer;font-size:12px}.sync-desc{color:#b89893;font-size:13px}.sync-deck-head{display:flex;justify-content:space-between;align-items:center;margin-top:5px}.sync-deck-head button{border:0;background:transparent;color:#b66fa0;text-decoration:underline;cursor:pointer}.sync-decks{display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:180px;overflow:auto;padding:8px;border:1px solid #f0c9de;border-radius:8px;background:#fff8fc}.sync-decks label{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sync-decks input{margin-right:5px}#syncDialog{width:min(460px,92vw);border:1px solid #ffcce0;border-radius:18px;background:#fff;color:#7a5c58;padding:25px;box-shadow:0 24px 60px #0005}#syncDialog::backdrop{background:#0008}#syncForm{display:grid;gap:10px}.sync-actions{display:flex;justify-content:end;gap:8px;flex-wrap:wrap}.sync-actions button{border:1px solid #ffcce0;border-radius:999px;padding:9px 13px;background:#fff;color:#7a5c58;font-weight:700;cursor:pointer}.sync-actions .sync-primary{background:#ff99cc}.sync-message{min-height:18px;color:#55a58c;font-size:12px}.sync-busy{position:fixed;inset:0;z-index:9999;display:grid;place-content:center;justify-items:center;gap:10px;background:#3b2734cc;color:#fff;backdrop-filter:blur(5px)}.sync-busy[hidden]{display:none}.sync-busy small{opacity:.85}.sync-spinner{width:34px;height:34px;border:4px solid #ffffff55;border-top-color:#fff;border-radius:50%;animation:sync-spin .8s linear infinite}@keyframes sync-spin{to{transform:rotate(360deg)}}'; document.head.appendChild(style);
  $('#syncOpen').onclick = () => { $('#gasUrl').value = config.url || ''; $('#gasToken').value = config.token || ''; renderDeckChoices(); $('#syncDialog').showModal(); };
  $('.sync-close').onclick = () => $('#syncDialog').close();
  $('#syncSelectAll').onclick = () => document.querySelectorAll('[data-sync-deck]').forEach((input) => { input.checked = true; });
  function readFormConfig() {
    config.url = $('#gasUrl').value.trim();
    config.token = $('#gasToken').value.trim();
    config.deckIds = [...document.querySelectorAll('[data-sync-deck]:checked')].map((input) => input.dataset.syncDeck);
    saveConfig();
  }
  $('#syncRead').onclick = () => { readFormConfig(); syncNow(false).then((success) => { if (success) { config.lastSyncAt = Date.now(); saveConfig(); } }); };
  $('#syncWrite').onclick = () => { config.url = $('#gasUrl').value.trim(); config.token = $('#gasToken').value.trim(); config.deckIds = [...document.querySelectorAll('[data-sync-deck]:checked')].map((input) => input.dataset.syncDeck); saveConfig(); writeNow(true).catch(() => {}); };
  $('#syncForm').onsubmit = (event) => { event.preventDefault(); config.url = $('#gasUrl').value.trim(); config.token = $('#gasToken').value.trim(); saveConfig(); updateStatus(); $('#syncMessage').textContent = '設定を保存しました'; };
  $('#syncDisconnect').onclick = () => { if (!confirm('同期設定を解除しますか？')) return; config = {}; localStorage.removeItem(CONFIG_KEY); updateStatus(); $('#syncMessage').textContent = '同期設定を解除しました'; };
  updateStatus();
})();
