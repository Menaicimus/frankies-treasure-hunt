export const allFound = points => points.length > 0 && points.every(p => p.encontrado === true);

export function createFinale({ db, firestore, beforeShow, restorePoints }) {
  const $ = id => document.getElementById(id);
  let complete = false, timer = null, finalData = null, loadError = false, loaded = false;
  const screen = $('final-screen'), celebration = $('final-celebration'), content = $('final-content');
  function renderContent() {
    $('final-text').textContent = loadError ? 'Não foi possível carregar a localização final. Tenta novamente.' : !loaded ? 'A carregar a localização final…' : finalData?.texto || 'A localização final ainda está a ser preparada.';
    $('final-retry').hidden = !loadError;
    const img = $('final-image');
    img.hidden = true; img.removeAttribute('src'); $('final-image-error').hidden = true;
    if (finalData?.imagem) {
      try {
        const url = new URL(finalData.imagem, location.href);
        if (url.protocol !== 'https:' && url.origin !== location.origin) throw new Error();
        img.src = url.href; img.hidden = false;
      } catch { $('final-image-error').hidden = false; }
    }
  }
  $('final-image').onerror = () => { $('final-image').hidden = true; $('final-image-error').hidden = false; };
  let unsubscribe;
  function listen() {
    unsubscribe?.(); loadError = false; loaded = false;
    if (!screen.hidden) renderContent();
    unsubscribe = firestore.onSnapshot(firestore.doc(db, 'configuracao', 'final'), snapshot => {
      loaded = true; loadError = false; finalData = snapshot.exists() ? snapshot.data() : null;
      if (!screen.hidden) renderContent();
    }, () => { loadError = true; loaded = true; finalData = null; if (!screen.hidden) renderContent(); });
  }
  function reveal() {
    clearTimeout(timer); timer = null;
    celebration.hidden = true; content.hidden = false;
    $('final-heading').focus();
  }
  function show(animate) {
    if (!complete) return;
    beforeShow();
    document.querySelector('.hunt').hidden = true;
    $('scan').hidden = true; $('open-map').hidden = true;
    $('show-final').hidden = true; screen.hidden = false;
    renderContent();
    clearTimeout(timer);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    celebration.hidden = !animate || reduced; content.hidden = animate && !reduced;
    if (animate && !reduced) {
      $('celebration-heading').focus(); timer = setTimeout(reveal, 3000);
    } else reveal();
    window.scrollTo({ top: 0 });
  }
  function back() {
    clearTimeout(timer); timer = null;
    screen.hidden = true; document.querySelector('.hunt').hidden = false;
    $('scan').hidden = false; $('show-final').hidden = !complete;
    restorePoints(); $('point-name').setAttribute('tabindex', '-1'); $('point-name').focus();
  }
  $('final-back').onclick = back;
  $('final-skip').onclick = reveal;
  $('show-final').onclick = () => show(false);
  $('final-retry').onclick = listen;
  return {
    sync(points, confirmed) {
      const next = allFound(points);
      // Do not unlock from optimistic/offline Firestore writes.
      if (next && !confirmed) return;
      if (next && !complete) { complete = true; listen(); show(true); }
      else if (!next && complete) {
        complete = false; unsubscribe?.(); unsubscribe = null; finalData = null;
        if (!screen.hidden) back();
        $('show-final').hidden = true;
      }
      if (complete && !screen.hidden) { $('open-map').hidden = true; $('scan').hidden = true; }
    },
    visible: () => !screen.hidden
  };
}
