import { distance } from './geo.mjs';
import { clipLine, validLocation, validDrawing, changeDrawings } from './map-geometry.mjs';

export function createHuntMap({ db, firestore, getPosition, navigate, beforeOpen }) {
  const $ = id => document.getElementById(id), dialog = $('map-dialog');
  let point = null, map, layers, marker, unsubscribe, rows = [], loaded = false, busy = false, count = 0;
  let centered = false, generation = 0;
  const say = text => { $('map-message').textContent = text; };
  function controls() {
    $('map-add').textContent = point?.modo === 'distancia' ? '＋ Adicionar circunferência' : '＋ Adicionar linha';
    $('map-add').disabled = !loaded || busy || rows.length >= 100;
    $('map-undo').disabled = !loaded || busy || !rows.length;
    $('map-locate').disabled = busy;
    $('map-previous').disabled = $('map-next').disabled = busy || count < 2;
    $('map-count').textContent = `${rows.length} ${rows.length === 1 ? 'desenho guardado' : 'desenhos guardados'} neste ponto`;
  }
  function initMap() {
    if (map) return;
    if (!window.L) throw new Error('O mapa não carregou. Atualiza a página e verifica a ligação.');
    const L = window.L;
    map = L.map('map-canvas', { zoomControl: true, minZoom: 3, maxZoom: 19 }).setView([39.5, -8], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, noWrap: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).on('tileerror', () => { $('map-tile-status').textContent = 'Algumas partes do mapa não carregaram. Verifica a ligação.'; }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    layers = L.layerGroup().addTo(map);
    map.on('move zoom resize', draw);
  }
  function showPosition(p) {
    if (!map || !validLocation(p)) return;
    if (!marker) marker = L.circleMarker([p.lat, p.lng], { radius: 6, color: '#fff', weight: 2, fillColor: '#2075df', fillOpacity: 1 }).addTo(map).bindTooltip('A tua última posição GPS');
    else marker.setLatLng([p.lat, p.lng]);
  }
  function draw() {
    if (!map || !layers) return;
    layers.clearLayers();
    rows.forEach((row, i) => {
      const style = { color: i === rows.length - 1 ? '#b34220' : '#175b50', weight: 3, opacity: .85, interactive: false };
      if (row.type === 'circle') L.circle([row.origin.lat, row.origin.lng], { ...style, radius: row.radius, fill: false }).addTo(layers);
      else {
        const a = map.latLngToContainerPoint([row.origin.lat, row.origin.lng]);
        const b = map.latLngToContainerPoint([row.target.lat, row.target.lng]);
        const size = map.getSize(), ends = clipLine(a, b, size.x, size.y);
        if (ends) L.polyline(ends.map(p => map.containerPointToLatLng([p.x, p.y])), style).addTo(layers);
      }
    });
  }
  function listen() {
    unsubscribe?.(); rows = []; loaded = false; generation++;
    const token = generation;
    draw(); controls(); say('A carregar os desenhos deste ponto…');
    unsubscribe = firestore.onSnapshot(firestore.doc(db, 'mapas', point.id), snapshot => {
      if (token !== generation) return;
      const data = snapshot.exists() ? snapshot.data().desenhos : [];
      rows = Array.isArray(data) ? data.filter(validDrawing) : [];
      loaded = true; draw(); controls();
      if (!busy) say(rows.length ? 'Os desenhos deste ponto estão sincronizados.' : 'Ainda não há desenhos. Adiciona uma pista a partir da tua posição.');
      if (!centered && rows.length) {
        const origin = rows[rows.length - 1].origin;
        map.setView([origin.lat, origin.lng], 16); centered = true;
      }
    }, error => {
      if (token !== generation) return;
      loaded = false; controls();
      say(error.code === 'permission-denied' ? 'Falta publicar as regras atualizadas do mapa no Firebase. Fecha e volta a abrir o mapa depois de as publicares.' : 'Não foi possível carregar os desenhos. Verifica a internet e volta a abrir o mapa.');
    });
  }
  function setPoint(next, total) {
    const changed = point?.id !== next?.id;
    point = next; count = total;
    $('open-map').hidden = !point || point.modo === 'imagem';
    if (!point || point.modo === 'imagem') { if (dialog.open) dialog.close(); return; }
    $('map-title').textContent = point.nome;
    $('map-hint').textContent = point.modo === 'distancia'
      ? 'Circunferências centradas onde estás, com a distância ao destino como raio.'
      : 'Retas que passam pela tua posição e pelo destino, prolongadas nos dois sentidos.';
    if (dialog.open && changed) listen();
    controls();
  }
  function open() {
    if (!point || point.modo === 'imagem') return;
    beforeOpen(); dialog.showModal(); document.body.classList.add('map-open');
    try {
      initMap(); map.invalidateSize();
      const p = getPosition();
      if (validLocation(p)) {
        showPosition(p);
        if (!centered) { map.setView([p.lat, p.lng], 16); centered = true; }
      }
      listen();
    } catch (error) { say(error.message); }
  }
  dialog.addEventListener('close', () => {
    document.body.classList.remove('map-open'); unsubscribe?.(); unsubscribe = null; generation++;
    $('open-map').focus();
  });
  function freshLocation() {
    return new Promise((resolve, reject) => {
      if (!window.isSecureContext || !navigator.geolocation) { reject(new Error('A localização requer HTTPS e um navegador com GPS.')); return; }
      navigator.geolocation.getCurrentPosition(result => {
        const p = { lat: result.coords.latitude, lng: result.coords.longitude, accuracy: result.coords.accuracy };
        if (!validLocation(p)) { reject(new Error('Esta localização está fora da área suportada pelo mapa.')); return; }
        resolve(p);
      }, error => reject(new Error(error.code === 1 ? 'Permite a localização nas definições do navegador e tenta novamente.' : 'Não foi possível obter uma posição GPS atual. Tenta numa zona aberta.')), { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    });
  }
  async function operation(action) {
    if (busy || !point || (!loaded && action !== 'locate')) return;
    const selected = { ...point }, token = generation;
    busy = true; controls();
    try {
      let drawing, p;
      if (action !== 'undo') {
        say('A obter a tua posição GPS…'); p = await freshLocation();
        if (token !== generation || !dialog.open) return;
        showPosition(p); map.setView([p.lat, p.lng], Math.max(map.getZoom(), 16)); centered = true;
        if (action === 'locate') { say(`Posição atualizada. Precisão GPS: ±${Math.round(p.accuracy)} m.`); return; }
        if (!validLocation(selected)) throw new Error('O ponto precisa de coordenadas válidas na administração.');
        const radius = distance(p, selected);
        if (selected.modo === 'direcao' && radius < 1) throw new Error('Estás demasiado perto do destino para definir uma reta.');
        drawing = { id: crypto.randomUUID(), origin: { lat: p.lat, lng: p.lng }, type: selected.modo === 'distancia' ? 'circle' : 'line' };
        if (drawing.type === 'circle') drawing.radius = radius;
        else drawing.target = { lat: selected.lat, lng: selected.lng };
      }
      say('A guardar no servidor…');
      const ref = firestore.doc(db, 'mapas', selected.id);
      await firestore.runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        const existing = snapshot.exists() ? snapshot.data().desenhos : [];
        tx.set(ref, { desenhos: changeDrawings(existing, action, drawing) });
      });
      if (token !== generation) return;
      if (drawing?.type === 'circle') {
        const bounds = L.latLng(p.lat, p.lng).toBounds(Math.max(10, drawing.radius) * 2);
        map.fitBounds(bounds, { padding: [25, 25], maxZoom: 18 });
      }
      say(action === 'undo' ? 'Último desenho removido. Alteração guardada online.' : `Desenho guardado online. Precisão GPS: ±${Math.round(p.accuracy)} m.`);
    } catch (error) {
      if (token === generation) say(error.code === 'permission-denied' ? 'Sem permissão para guardar: publica as regras atualizadas do mapa no Firebase.' : error.code ? 'Não foi possível guardar online. Verifica a internet e tenta novamente.' : error.message);
    } finally { busy = false; controls(); }
  }
  $('open-map').onclick = open;
  $('map-close').onclick = () => dialog.close();
  $('map-add').onclick = () => operation('add');
  $('map-undo').onclick = () => operation('undo');
  $('map-locate').onclick = () => operation('locate');
  $('map-previous').onclick = () => navigate(-1);
  $('map-next').onclick = () => navigate(1);
  return { setPoint };
}
