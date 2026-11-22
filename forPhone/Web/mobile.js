/* Smartphone-only touch controls. The existing app.js remains the source of truth
   for grading, persistence, history, decks, and the keyboard/desktop controls. */
(function () {
  const card = document.querySelector('#flashcard');
  if (!card) return;

  const SWIPE_DISTANCE = 72;
  const REVEAL_DISTANCE = 48;
  const SWIPE_VERTICAL_LIMIT = 110;
  let startX = 0;
  let startY = 0;
  let moved = false;
  let revealTriggered = false;

  function resetCardPosition() {
    card.style.transform = '';
    card.classList.remove('swiping', 'swipe-ready');
  }

  function revealForSwipe() {
    if (revealTriggered || document.querySelector('#answerArea')?.hidden === false) return;
    revealTriggered = true;
    document.querySelector('#revealBtn')?.click();
    window.setTimeout(() => {
      if (document.querySelector('#answerArea')?.hidden) document.querySelector('#revealBtn')?.click();
    }, 60);
  }

  card.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    moved = false;
    revealTriggered = false;
    card.style.transition = 'none';
  }, { passive: true });

  card.addEventListener('touchmove', (event) => {
    if (event.touches.length !== 1) return;
    const dx = event.touches[0].clientX - startX;
    const dy = event.touches[0].clientY - startY;
    moved = Math.abs(dx) > 12 || Math.abs(dy) > 12;
    if (Math.abs(dx) <= Math.abs(dy)) return;
    event.preventDefault();
    const limited = Math.max(-180, Math.min(180, dx));
    card.style.transform = `translateX(${limited}px) rotate(${limited / 15}deg)`;
    card.classList.add('swiping');
    if (Math.abs(dx) >= REVEAL_DISTANCE) {
      card.classList.add('swipe-ready');
      revealForSwipe();
    } else card.classList.remove('swipe-ready');
  }, { passive: false });

  card.addEventListener('touchend', (event) => {
    if (!moved || document.querySelector('#studyPlayer')?.hidden) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    card.style.transition = '';
    if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dy) <= SWIPE_VERTICAL_LIMIT && Math.abs(dx) > Math.abs(dy)) {
      event.preventDefault();
      if (dx < 0) document.querySelector('#wrongBtn')?.click();
      else document.querySelector('#rightBtn')?.click();
    } else {
      resetCardPosition();
    }
    window.setTimeout(resetCardPosition, 280);
  }, { passive: false });

  // A short tap on the card opens the answer, while buttons keep their normal actions.
  card.addEventListener('click', (event) => {
    if (moved || event.target.closest('button, a, [role="button"]')) return;
    document.querySelector('#revealBtn')?.click();
  });
})();
