(() => {
  let questionMode = 'list';
  const byId = (id) => document.getElementById(id);
  const escapeText = (value) => String(value || '').replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

  function decorateDeckTree() {
    const root = byId('deckLibrary');
    if (!root || !Array.isArray(data?.decks)) return;
    root.querySelectorAll('.deck-card').forEach((card) => {
      const id = card.dataset.deckOpen || card.dataset.folderOpen;
      const deck = data.decks.find((item) => item.id === id);
      if (!deck) return;
      let depth = 0, parent = deck.parentId;
      while (parent && depth < 12) { depth += 1; parent = data.decks.find((item) => item.id === parent)?.parentId; }
      card.style.marginLeft = `${Math.min(depth, 5) * 14}px`;
      if (deck.kind !== 'folder') return;
      card.removeAttribute('data-deck-open');
      card.dataset.folderOpen = deck.id;
      card.classList.add('folder-card');
      const top = card.querySelector('.deck-top span');
      if (top) top.textContent = '📁 FOLDER';
      const actions = card.querySelector('.deck-actions');
      if (actions) {
        actions.querySelector('[data-study-deck]')?.remove();
        actions.querySelector('[data-export-deck]')?.remove();
        if (!actions.querySelector('[data-new-child-folder]')) actions.insertAdjacentHTML('beforeend', '<button class="mini-btn" data-new-child-folder="' + deck.id + '">＋ 子フォルダ</button><button class="mini-btn" data-new-child-deck="' + deck.id + '">＋ 子セット</button>');
      }
    });
    const cards = new Map([...root.querySelectorAll('.deck-card')].map((card) => [card.dataset.deckOpen || card.dataset.folderOpen, card]));
    const ordered = [];
    const walk = (parent) => data.decks.filter((item) => (item.parentId || null) === parent).forEach((item) => { if (cards.has(item.id)) ordered.push(cards.get(item.id)); if (item.kind === 'folder') walk(item.id); });
    walk(null);
    const currentOrder = [...root.querySelectorAll('.deck-card')].map((card) => card.dataset.deckOpen || card.dataset.folderOpen).join('|');
    const nextOrder = ordered.map((card) => card.dataset.deckOpen || card.dataset.folderOpen).join('|');
    if (currentOrder !== nextOrder) ordered.forEach((card) => root.appendChild(card));
  }

  function renderQuestionCards() {
    if (questionMode !== 'cards') return;
    const list = byId('questionList');
    if (!list || list.querySelector('.flip-card') || !list.querySelector('.question-item')) return;
    list.dataset.cardsReady = 'true';
    list.classList.add('question-cards-mode');
    list.querySelectorAll('.question-item').forEach((item) => {
      const question = item.querySelector('b')?.textContent || '';
      const answer = item.querySelector('p')?.textContent || '';
      const level = item.querySelector('.q-level')?.textContent || '';
      const actions = item.querySelector('.deck-pills')?.innerHTML || '';
      item.className = 'question-card flip-card';
      item.innerHTML = '<div class="flip-card-inner"><div class="flip-card-face flip-card-front"><span class="q-level">' + escapeText(level) + '</span><b>' + escapeText(question) + '</b><small>タップして答えを見る</small></div><div class="flip-card-face flip-card-back"><span>ANSWER</span><p>' + escapeText(answer) + '</p><div class="deck-pills">' + actions + '</div></div></div>';
    });
  }

  function setQuestionMode(mode) {
    questionMode = mode;
    document.querySelectorAll('[data-question-mode]').forEach((button) => button.classList.toggle('selected', button.dataset.questionMode === mode));
    const list = byId('questionList');
    if (list) { list.dataset.cardsReady = 'false'; list.classList.toggle('question-cards-mode', mode === 'cards'); }
    if (mode === 'cards') renderQuestionCards(); else if (typeof renderQuestions === 'function') renderQuestions();
  }

  function updateMotivation() {
    const banner = byId('motivationBanner'), goal = byId('weeklyGoal'), text = byId('motivationText'), percent = byId('questPercent');
    if (!banner || !Array.isArray(data?.history)) return;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = data.history.filter((item) => item.date === today).length;
    const accuracy = data.history.length ? Math.round(data.history.filter((item) => item.result === 'correct').length / data.history.length * 100) : 0;
    const progress = Math.min(100, todayCount * 10);
    percent.textContent = progress + '%';
    goal.textContent = todayCount >= 10 ? '今日の目標クリア！' : 'あと ' + (10 - todayCount) + ' 問で今日の目標';
    text.textContent = accuracy >= 85 ? '高い正答率です。この調子で定着を伸ばしましょう。' : todayCount ? '続けた分だけ、昨日の自分を超えています。' : 'まずは1問。小さなスタートが習慣を作ります。';
    banner.textContent = todayCount >= 10 ? '今日のクエスト達成！すばらしい！' : '今日の一歩が、明日の自信になる。';
  }

  function addThemes() {
    const picker = document.querySelector('.theme-picker');
    if (!picker || picker.querySelector('[value="cyber"]')) return;
    picker.insertAdjacentHTML('beforeend', '<label class="theme-choice"><input type="radio" name="theme" value="cyber" ' + (data.settings.theme === 'cyber' ? 'checked' : '') + '><span class="theme-swatch cyber"></span><b>CYBER DARK</b></label><label class="theme-choice"><input type="radio" name="theme" value="lollipop" ' + (data.settings.theme === 'lollipop' ? 'checked' : '') + '><span class="theme-swatch lollipop"></span><b>LOLLIPOP</b></label><label class="theme-choice"><input type="radio" name="theme" value="ocean" ' + (data.settings.theme === 'ocean' ? 'checked' : '') + '><span class="theme-swatch ocean"></span><b>OCEAN</b></label>');
  }

  function openFolderModal(parentId) {
    const modal = byId('modal'), content = byId('modalContent');
    content.innerHTML = '<div class="modal-body"><h2>フォルダを作成</h2><p>フォルダの中に、さらにフォルダや問題セットを作成できます。</p><label>フォルダ名<input name="folderName" required maxlength="40" placeholder="例：高校化学"></label><div class="modal-actions"><button class="ghost-btn" value="cancel">キャンセル</button><button class="primary-btn" value="default">作成する</button></div></div>';
    byId('modalForm').onsubmit = (event) => { event.preventDefault(); const name = new FormData(event.currentTarget).get('folderName')?.trim(); if (!name) return; data.decks.push({id: uid(), name, kind: 'folder', parentId: parentId || null, color: '#ff99cc', createdAt: Date.now()}); save(); modal.close(); renderAll(); toast('フォルダを作成しました'); };
    modal.showModal();
  }

  function openChildDeckModal(parentId) {
    openModal('deck', { parent: parentId });
    setTimeout(() => { const form = byId('modalForm'); if (!form || form.dataset.parentApplied) return; form.dataset.parentApplied = 'true'; const original = form.onsubmit; form.onsubmit = (event) => { const name = new FormData(form).get('name')?.trim(); if (name) { event.preventDefault(); data.decks.push({id: uid(), name, color: new FormData(form).get('color'), parentId, createdAt: Date.now()}); save(); byId('modal').close(); renderAll(); toast('問題セットを作成しました'); } else if (original) original(event); }; }, 0);
  }

  const libraryObserver = new MutationObserver(decorateDeckTree);
  const questionObserver = new MutationObserver(renderQuestionCards);
  const statsObserver = new MutationObserver(updateMotivation);
  const studyObserver = new MutationObserver(() => byId('studyDeck')?.querySelectorAll('option').forEach((option) => { if (data.decks.find((deck) => deck.id === option.value)?.kind === 'folder') option.remove(); }));
  window.addEventListener('load', () => { libraryObserver.observe(byId('deckLibrary'), {childList:true, subtree:true}); questionObserver.observe(byId('questionList'), {childList:true, subtree:true}); studyObserver.observe(byId('studyDeck'), {childList:true}); statsObserver.observe(byId('statCards'), {childList:true, subtree:true}); document.querySelector('.mobile-bottom-nav [data-view="home"]')?.classList.add('active'); decorateDeckTree(); updateMotivation(); });
  document.addEventListener('click', (event) => {
    if (event.target.closest('#mobileMenu')) return;
    if (!event.target.closest('.sidebar') && !event.target.closest('.mobile-bottom-nav')) document.querySelector('.sidebar')?.classList.remove('open');
    if (event.target.closest('.sync-close')) { event.preventDefault(); byId('syncDialog')?.close(); }
    if (event.target.closest('#mobileSettings')) { byId('openSettings')?.click(); return; }
    const viewButton = event.target.closest('[data-view]'); if (viewButton) document.querySelectorAll('.mobile-bottom-nav [data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === viewButton.dataset.view));
    if (event.target.closest('#newFolder')) { openFolderModal(null); return; }
    const childFolder = event.target.closest('[data-new-child-folder]'); if (childFolder) { event.preventDefault(); openFolderModal(childFolder.dataset.newChildFolder); return; }
    const childDeck = event.target.closest('[data-new-child-deck]'); if (childDeck) { event.preventDefault(); openChildDeckModal(childDeck.dataset.newChildDeck); return; }
    const mode = event.target.closest('[data-question-mode]'); if (mode) { setQuestionMode(mode.dataset.questionMode); return; }
    const flip = event.target.closest('.flip-card'); if (flip) flip.classList.toggle('flipped');
  }, true);
  document.addEventListener('click', (event) => { if (event.target.closest('#openSettings,#openSettingsTop,#mobileSettings')) setTimeout(addThemes, 0); }, true);
  byId('exitStudy').onclick = () => { session.active = false; stopTyping(false); showView('study'); };
  byId('mobileSettings').onclick = () => byId('openSettings')?.click();
  function updateStudyFullscreen() { document.body.classList.toggle('study-fullscreen', Boolean(byId('studyPlayer') && !byId('studyPlayer').hidden)); }
  const studyPlayer = byId('studyPlayer');
  if (studyPlayer) new MutationObserver(updateStudyFullscreen).observe(studyPlayer, { attributes: true, attributeFilter: ['hidden'] });
  updateStudyFullscreen();
  function ensureSyncDisconnect() { const actions = document.querySelector('.sync-actions'); if (actions && !byId('syncDisconnect')) actions.insertAdjacentHTML('beforeend', '<button id="syncDisconnect" type="button">同期解除</button>'); }
  ensureSyncDisconnect();
  byId('syncOpen')?.addEventListener('click', ensureSyncDisconnect);
  document.addEventListener('click', (event) => { if (event.target.closest('#syncDisconnect')) { event.preventDefault(); if (!confirm('同期を解除しますか？')) return; localStorage.removeItem('quiz-auth-token'); byId('syncOpen').textContent = '☁ 同期'; byId('syncOpen').dataset.on = 'false'; byId('syncDialog')?.close(); } });
  document.querySelector('#newFolder')?.remove();
  document.querySelectorAll('[data-new-child-folder]').forEach((button) => button.remove());
})();
