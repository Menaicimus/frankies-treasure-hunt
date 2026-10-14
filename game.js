import { distance, bearing, distanceHue, arrowAngle } from './geo.mjs';
import { createHuntMap } from './hunt-map.js';
const $ = id => document.getElementById(id);
let points = [], index = 0, pos = null, compass = null, gpsHeading = null, watch = null;
let orientationStarted = false, orientationDenied = false, sensorError = '', scanController = null;
let db, updateDoc, doc, unsubscribe, saving = false;
let huntMap;
function navigate(step) {
  if (!points.length) return;
  index = (index + step + points.length) % points.length;
  if (!saving) $('message').textContent = '';
  render();
}
const current = () => points[index];
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
async function load() {
  $('retry').hidden = true;
  try {
    const [firebase, firestore, authentication] = await Promise.all([
      import('./firebase.js'), import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js')
    ]);
    db = firebase.db; ({ updateDoc, doc } = firestore);
    await firebase.auth.authStateReady();
    if (!firebase.auth.currentUser) await authentication.signInAnonymously(firebase.auth);
    if (!huntMap) huntMap = createHuntMap({ db, firestore, getPosition: () => pos, navigate, beforeOpen: stopScan });
    unsubscribe?.();
    unsubscribe = firestore.onSnapshot(firestore.query(firestore.collection(db, 'objetivos'), firestore.orderBy('ordem')), { includeMetadataChanges: true }, snapshot => {
      const selected = current()?.id;
      points = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      index = Math.max(0, points.findIndex(p => p.id === selected));
      $('scan').disabled = !points.length || saving;
      if (!points.length) {
        huntMap.setPoint(null, 0);
        $('progress').textContent = 'Ainda não há pontos.'; $('point-name').textContent = 'A aventura está a ser preparada';
        $('clue').textContent = 'Adiciona o primeiro ponto na administração.';
        $('previous').disabled = $('next').disabled = true; $('point-status').hidden = true;
        $('enable-location').hidden = true; $('sensor-status').textContent = ''; return;
      }
      render();
      if (snapshot.metadata.fromCache) $('message').textContent = 'Sem confirmação do servidor. Verifica a ligação para sincronizar o estado.';
      else if (!saving && $('message').textContent.startsWith('Sem confirmação')) $('message').textContent = '';
    }, fail);
  } catch (error) { fail(error); }
}
function fail(error) {
  $('progress').textContent = 'Não foi possível ligar ao jogo.';
  $('message').textContent = `Verifica a internet, a autenticação anónima e as regras do Firebase. (${error.code || 'erro de ligação'})`;
  $('retry').hidden = false;
}
function render() {
  const p = current();
  huntMap?.setPoint(p, points.length);
  $('progress').textContent = `${points.filter(p => p.encontrado === true).length} de ${points.length} pontos encontrados`;
  $('position').textContent = `PONTO ${String(index + 1).padStart(2, '0')} / ${String(points.length).padStart(2, '0')}`;
  $('point-name').textContent = p.nome;
  $('point-status').hidden = false;
  $('point-status').textContent = p.encontrado === true ? '✓ Encontrado' : '○ Não encontrado';
  $('point-status').classList.toggle('found', p.encontrado === true);
  $('previous').disabled = $('next').disabled = points.length < 2;
  $('clue').replaceChildren();
  $('clue-label').textContent = { distancia: 'PISTA · DISTÂNCIA', direcao: 'PISTA · DIREÇÃO', imagem: 'PISTA · IMAGEM' }[p.modo] || 'PISTA';
  if (p.modo === 'imagem') {
    const img = document.createElement('img'); img.className = 'image-clue'; img.alt = `Imagem pista: ${p.nome}`;
    img.onerror = () => { if (current()?.id === p.id) $('clue').textContent = 'Não foi possível carregar esta imagem. Verifica o endereço na administração.'; };
    try {
      const url = new URL(p.imagem || '', location.href);
      if (!p.imagem || (url.protocol !== 'https:' && url.origin !== location.origin)) throw new Error();
      img.src = url.href; $('clue').append(img);
    } catch { $('clue').textContent = 'Este ponto ainda não tem uma imagem válida.'; }
  } else if (p.modo === 'direcao') {
    $('clue').innerHTML = '<div class="compass"><span class="compass-top">SEGUE A SETA</span><div id="arrow" class="direction-arrow" hidden><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 5 83 88 50 70 17 88Z" fill="currentColor"/></svg></div><span id="waiting" class="peq">À espera da orientação</span><span class="compass-bottom">O TEU PRÓXIMO ACHADO</span></div>';
  } else {
    $('clue').innerHTML = '<div id="distance-ring" class="distance-ring"><div><strong id="distance-value">—</strong><span id="distance-unit">metros</span><small>ATÉ AO PONTO</small></div></div>';
  }
  update();
}
function update() {
  const p = current(); if (!p) return;
  $('enable-location').hidden = p.modo === 'imagem' || (watch !== null && !sensorError && !(p.modo === 'direcao' && orientationDenied));
  if (p.modo === 'imagem') { $('sensor-status').textContent = 'Observa os detalhes. Onde estará este lugar?'; return; }
  if (!pos) { $('sensor-status').textContent = sensorError || (watch === null ? 'Ativa a localização para revelar esta pista.' : 'A procurar sinal GPS…'); return; }
  if (typeof p.lat !== 'number' || typeof p.lng !== 'number') { $('sensor-status').textContent = 'Este ponto precisa de coordenadas. Corrige-o na administração.'; return; }
  const d = distance(pos, p), accuracy = `Precisão GPS: ±${Math.round(pos.accuracy)} m.`;
  if (p.modo === 'direcao') {
    const heading = compass ?? gpsHeading;
    $('arrow').hidden = heading === null; $('waiting').hidden = heading !== null;
    if (heading !== null) {
      const screenAngle = screen.orientation?.angle || 0;
      const adjusted = compass === null ? heading : (heading + screenAngle) % 360;
      $('arrow').style.transform = `rotate(${arrowAngle(bearing(pos,p), adjusted)}deg)`;
    }
    $('sensor-status').textContent = sensorError || (heading === null ? 'Sem orientação. Calibra a bússola em forma de 8 ou caminha para obter o rumo GPS.' : `${compass === null ? 'Seta relativa à direção em que caminhas. ' : 'Mantém o telemóvel plano, com o topo para a frente. '}${accuracy}`);
  } else {
    $('distance-ring').style.setProperty('--proximity', `hsl(${distanceHue(d)} 78% 58%)`);
    $('distance-value').textContent = d >= 1000 ? (d / 1000).toFixed(2) : Math.round(d);
    $('distance-unit').textContent = d >= 1000 ? 'quilómetros' : 'metros';
    $('sensor-status').textContent = sensorError || accuracy;
  }
}
function orient(event) {
  if (Number.isFinite(event.webkitCompassHeading) && event.webkitCompassHeading >= 0) compass = event.webkitCompassHeading;
  else if (event.absolute && Number.isFinite(event.alpha)) compass = (360 - event.alpha) % 360;
  else return;
  update();
}
$('enable-location').onclick = async () => {
  if (!window.isSecureContext) { $('sensor-status').textContent = 'Abre a página por HTTPS para usar os sensores.'; return; }
  if (!orientationStarted || orientationDenied) {
    try {
      const permission = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' ? await DeviceOrientationEvent.requestPermission() : 'granted';
      orientationDenied = permission !== 'granted';
      if (!orientationDenied && !orientationStarted) {
        addEventListener('deviceorientationabsolute', orient); addEventListener('deviceorientation', orient); orientationStarted = true;
      }
    } catch { orientationDenied = true; }
  }
  if (!navigator.geolocation) { sensorError = 'Este navegador não suporta localização.'; update(); return; }
  if (watch !== null) navigator.geolocation.clearWatch(watch);
  sensorError = '';
  watch = navigator.geolocation.watchPosition(p => {
    pos = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
    gpsHeading = Number.isFinite(p.coords.heading) && p.coords.speed > 0.5 ? p.coords.heading : null;
    sensorError = ''; update();
  }, e => { sensorError = e.code === 1 ? 'Permite o acesso à localização nas definições do navegador e tenta novamente.' : 'Sem sinal GPS. Aproxima-te de uma zona aberta e tenta novamente.'; update(); }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 });
  update();
};
for (const [id, step] of [['previous', -1], ['next', 1]]) $(id).onclick = () => navigate(step);
function stopScan() {
  scanController?.abort(); scanController = null;
  $('scan').classList.remove('scanning'); $('scan').querySelector('span').textContent = 'Ler NFC';
}
$('scan').onclick = async () => {
  if (saving) return;
  if (scanController) { stopScan(); $('message').textContent = 'Leitura cancelada.'; return; }
  if (!('NDEFReader' in window)) { $('message').textContent = 'A leitura NFC requer Chrome num Android com NFC. Não está disponível neste navegador.'; return; }
  const controller = new AbortController(); scanController = controller;
  try {
    const reader = new NDEFReader();
    reader.onreading = async event => {
      if (saving || scanController !== controller) return;
      const codes = Array.from(event.message.records).filter(r => r.recordType === 'text').map(r => new TextDecoder(r.encoding || 'utf-8').decode(r.data).trim());
      const point = points.find(p => codes.includes(p.codigo));
      if (!point) { $('message').textContent = 'Esta tag não pertence a nenhum ponto deste jogo. Tenta outra tag.'; return; }
      stopScan(); index = points.indexOf(point); render();
      if (point.encontrado === true) { $('message').textContent = `Já encontraste ${point.nome}.`; return; }
      saving = true; $('scan').disabled = true;
      $('message').textContent = 'A guardar no servidor… Mantém a ligação à internet.';
      try {
        await updateDoc(doc(db, 'objetivos', point.id), { encontrado: true });
        $('message').textContent = `✓ Encontraste ${point.nome}! Estado guardado online.`; navigator.vibrate?.(200);
      } catch (error) { $('message').textContent = `Não foi possível guardar. Tenta novamente. (${error.code || 'erro'})`; }
      finally { saving = false; $('scan').disabled = !points.length; }
    };
    reader.onreadingerror = () => { $('message').textContent = 'Não foi possível ler a tag. Aproxima novamente o telemóvel.'; };
    await reader.scan({ signal: controller.signal });
    if (scanController !== controller) return;
    $('scan').classList.add('scanning'); $('scan').querySelector('span').textContent = 'Cancelar';
    $('message').textContent = 'Aproxima a tag NFC da parte de trás do telemóvel.';
  } catch {
    if (scanController !== controller) return;
    stopScan(); $('message').textContent = 'Não foi possível iniciar a leitura. Ativa o NFC e permite o acesso no navegador.';
  }
};
document.addEventListener('visibilitychange', () => { if (document.hidden && scanController) { stopScan(); $('message').textContent = 'Leitura interrompida. Toca em Ler NFC para voltar a tentar.'; } });
$('retry').onclick = load;
load();
