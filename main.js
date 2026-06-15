(function () {
  'use strict';

  var T = window.__TRAVELS__;
  var map = null;
  var geoLayers = {};
  var currentISO = null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function safe(fn, name) { try { fn(); } catch (e) { console.warn('[Gardariam]', name, e); } }
  function fmt(d) { return d ? new Date(d).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' }) : '—'; }
  function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
  function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
  function getYouTubeId(url) {
    var m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return m ? m[1] : null;
  }
  function ytThumb(id) { return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg'; }

  // ── Color picker ──────────────────────────────────────────────────────────
  var DEFAULT_COLOR = '#8b1a2a';
  var COLOR_KEY = 'gardariam_conquest_color';

  function getConquestColor() { return localStorage.getItem(COLOR_KEY) || DEFAULT_COLOR; }
  function setConquestColor(c) { localStorage.setItem(COLOR_KEY, c); }

  function hexRgb(hex) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return { r:r, g:g, b:b };
  }
  function lighten(hex, amt) {
    var c = hexRgb(hex);
    return 'rgb('+Math.min(c.r+amt,255)+','+Math.min(c.g+amt,255)+','+Math.min(c.b+amt,255)+')';
  }
  function rgba(hex, a) {
    var c = hexRgb(hex); return 'rgba('+c.r+','+c.g+','+c.b+','+a+')';
  }

  function getStyles() {
    var col = getConquestColor();
    return {
      none:    { fillColor:'#b07010', fillOpacity:0.88, color:'#d4991a', weight:0.8 },
      partial: { fillColor:rgba(col,0.55), fillOpacity:1, color:col, weight:1.4 },
      full:    { fillColor:col, fillOpacity:1, color:lighten(col,55), weight:2 },
    };
  }
  function hoverStyles() {
    var col = getConquestColor();
    return {
      none:    { fillColor:'#c88a20', color:'#e0aa30' },
      partial: { fillColor:rgba(col,0.75), color:lighten(col,40) },
      full:    { fillColor:lighten(col,25), color:lighten(col,70) },
    };
  }

  function styleForISO(iso) { return Object.assign({}, getStyles()[getStatus(iso)]); }

  // ── Conquest state ────────────────────────────────────────────────────────
  var STORAGE_KEY = 'gardariam_conquest_v2';
  function loadState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) { return {}; } }
  function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e) {} }

  function computeStatus(regions) {
    if (!regions || regions.length === 0) return 'full';
    var c = regions.filter(function(r){ return r.conquered; }).length;
    if (c === 0) return 'none';
    return c === regions.length ? 'full' : 'partial';
  }

  function getRegions(iso) {
    var base = (T.countries[iso] && T.countries[iso].regions) ? T.countries[iso].regions : [];
    var saved = (loadState()[iso] && loadState()[iso].regions) ? loadState()[iso].regions : null;
    if (!saved) return base.map(function(r){ return Object.assign({},r); });
    return base.map(function(r){
      var s = saved.find(function(x){ return x.id === r.id; });
      return Object.assign({},r, s ? { conquered:s.conquered } : {});
    });
  }

  function getStatus(iso) {
    if (!T.countries[iso]) return 'none';
    var saved = loadState()[iso];
    if (saved && saved.status !== undefined) return saved.status;
    return computeStatus(T.countries[iso].regions);
  }

  function setStatus(iso, status, regions) {
    var s = loadState(); s[iso] = { status:status, regions:regions }; saveState(s);
  }

  // ── Splash ────────────────────────────────────────────────────────────────
  function initSplash() {
    var el = document.getElementById('splash'); if (!el) return;
    setTimeout(function(){ el.style.opacity='0'; el.style.pointerEvents='none'; }, 4200);
  }

  // ── Nav ───────────────────────────────────────────────────────────────────
  function initNav() {
    var tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        tabs.forEach(function(t){ t.classList.remove('active'); });
        tab.classList.add('active');
        var view = tab.dataset.view;
        document.querySelectorAll('.view').forEach(function(v){
          v.classList.toggle('active', v.id === view+'-view');
        });
        if (view==='map' && map) setTimeout(function(){ map.invalidateSize(); },50);
        if (view==='restaurants') renderRestaurants();
        if (view==='photos') renderPhotos();
        if (view==='videos') renderVideos();
      });
    });
    updateStats();
  }

  function updateStats() {
    var count = Object.keys(T.countries).filter(function(iso){ return getStatus(iso)!=='none'; }).length;
    var el = document.getElementById('stat-countries'); if (el) el.textContent = count;
  }

  // ── Color picker init ─────────────────────────────────────────────────────
  function initColorPicker() {
    var input = document.getElementById('conquest-color-input');
    var swatch = document.getElementById('color-swatch');
    if (!input) return;

    input.value = getConquestColor();
    if (swatch) swatch.style.background = getConquestColor();

    input.addEventListener('input', function(){
      setConquestColor(input.value);
      if (swatch) swatch.style.background = input.value;
      // Refresh all map layers
      Object.keys(geoLayers).forEach(function(iso){
        var st = getStatus(iso);
        if (st !== 'none') refreshMapStyle(iso);
      });
    });

    if (swatch) {
      swatch.addEventListener('click', function(){ input.click(); });
    }
  }

  // ── Map ───────────────────────────────────────────────────────────────────
  function initMap() {
    if (!window.L) return;

    map = L.map('map', {
      center: [20, 10], zoom: 2.5,
      minZoom: 2, maxZoom: 9,
      maxBounds: [[-80, -200], [80, 200]],
      maxBoundsViscosity: 0.85,
      bounceAtZoomLimits: false,
      zoomControl: true,
      worldCopyJump: false,
      attributionControl: false,
    });

    addGraticule();

    fetch('lib/countries.geojson')
      .then(function(r){ return r.json(); })
      .then(function(data){ buildGeoLayer(data); })
      .catch(function(e){ console.warn('[Gardariam] GeoJSON failed',e); });
  }

  function addGraticule() {
    var lines = [];
    var lngs = [-180,-150,-120,-90,-60,-30,0,30,60,90,120,150,180];
    var lats = [-60,-30,0,30,60];
    lngs.forEach(function(lng){ lines.push({ type:'Feature', geometry:{ type:'LineString', coordinates:[[lng,-85],[lng,85]] }, properties:{} }); });
    lats.forEach(function(lat){ lines.push({ type:'Feature', geometry:{ type:'LineString', coordinates:[[-180,lat],[180,lat]] }, properties:{} }); });
    L.geoJSON({ type:'FeatureCollection', features:lines }, {
      style:{ color:'rgba(200,160,20,0.12)', weight:0.6, opacity:1, fill:false, interactive:false }
    }).addTo(map);
  }

  function buildGeoLayer(data) {
    L.geoJSON(data, {
      style: function(f){ return styleForISO(f.properties.ISO_A2); },
      onEachFeature: function(f, layer){
        var iso = f.properties.ISO_A2;
        var name = f.properties.ADMIN || f.properties.NAME || iso;
        geoLayers[iso] = layer;

        var status = getStatus(iso);
        var badge = status==='full' ? ' ⚜' : status==='partial' ? ' ⚔' : '';
        layer.bindTooltip(name+badge, { className:'country-tooltip', sticky:true, direction:'top', offset:[0,-4] });

        layer.on('mouseover', function(e){
          var st = getStatus(iso);
          e.target.setStyle(Object.assign({}, styleForISO(iso), hoverStyles()[st]));
        });
        layer.on('mouseout',  function(e){ e.target.setStyle(styleForISO(iso)); });
        layer.on('click', function(){ openPanel(iso, name); try { map.flyToBounds(layer.getBounds(),{padding:[60,60],duration:1,maxZoom:6}); }catch(_){} });
      },
    }).addTo(map);
    renderHUD();
  }

  function refreshMapStyle(iso) {
    var layer = geoLayers[iso]; if (!layer) return;
    layer.setStyle(styleForISO(iso));
    var name = layer.feature && (layer.feature.properties.ADMIN || layer.feature.properties.NAME || iso);
    var status = getStatus(iso);
    var badge = status==='full' ? ' ⚜' : status==='partial' ? ' ⚔' : '';
    if (layer.getTooltip()) layer.setTooltipContent(name+badge);
  }

  function refreshAllMapStyles() {
    Object.keys(geoLayers).forEach(function(iso){ refreshMapStyle(iso); });
  }

  function renderHUD() {
    var c = Object.keys(T.countries).filter(function(iso){ return getStatus(iso)!=='none'; }).length;
    var el = document.getElementById('hud-conquered'); if (el) el.textContent = c;
  }

  // ── Detail Panel ─────────────────────────────────────────────────────────
  function openPanel(iso, name) {
    currentISO = iso;
    var data = T.countries[iso];
    var panel = document.getElementById('detail-panel');

    var heroImg = panel.querySelector('.panel-hero img');
    heroImg.src = (data && data.coverPhoto) ? data.coverPhoto : 'https://images.unsplash.com/photo-1457449940276-e8deed18bfff?w=1200&q=80';
    heroImg.alt = name;

    var flagSrc = (data && data.flag) ? data.flag : ('https://flagcdn.com/w80/'+iso.toLowerCase()+'.png');
    panel.querySelector('.panel-flag-img').src = flagSrc;
    panel.querySelector('.panel-country-name').textContent = name;

    renderConquestControls(iso);
    renderRegions(iso);

    var sec = document.getElementById('panel-visits-section');
    if (data && data.visits && data.visits.length > 0) {
      sec.style.display = ''; renderVisitDetails(data, 0);
    } else { sec.style.display = 'none'; }

    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
  }

  function closePanel() {
    var p = document.getElementById('detail-panel');
    p.classList.remove('open'); p.setAttribute('aria-hidden','true'); currentISO = null;
  }

  function renderConquestControls(iso) {
    var st = getStatus(iso);
    document.querySelectorAll('.conquest-btn').forEach(function(btn){
      btn.classList.toggle('active', btn.dataset.status === st);
    });
  }

  function renderRegions(iso) {
    var container = document.getElementById('panel-regions');
    var regions = getRegions(iso);
    if (!regions || regions.length === 0) { container.style.display='none'; return; }
    container.style.display = '';
    container.innerHTML = '<div class="section-label">Territorios</div><div class="regions-grid">' +
      regions.map(function(r){
        return '<div class="region-chip'+(r.conquered?' conquered':'')+'" data-id="'+r.id+'">' +
          '<span class="chip-dot"></span>'+r.name+(r.date?'<span class="region-date">'+r.date+'</span>':'')+
        '</div>';
      }).join('') + '</div>';
    container.querySelectorAll('.region-chip').forEach(function(chip){
      chip.addEventListener('click', function(){ toggleRegion(iso, chip.dataset.id); });
    });
  }

  function toggleRegion(iso, regionId) {
    var regions = getRegions(iso).map(function(r){
      return r.id===regionId ? Object.assign({},r,{conquered:!r.conquered}) : r;
    });
    var newStatus = computeStatus(regions);
    setStatus(iso, newStatus, regions);
    renderConquestControls(iso); renderRegions(iso);
    refreshMapStyle(iso); renderHUD(); updateStats();
    renderFlagsStrip();
  }

  function renderVisitDetails(data, idx) {
    var visit = data.visits[idx]; if (!visit) return;
    document.getElementById('panel-visit-meta').innerHTML =
      '<div class="meta-chip gold">📅 '+fmt(visit.dateFrom)+'</div>'+
      '<div class="meta-chip">⏱ '+daysBetween(visit.dateFrom, visit.dateTo)+' días</div>'+
      '<div class="meta-chip">📍 '+visit.region+'</div>';

    var ph = document.getElementById('panel-photos');
    if (visit.photos && visit.photos.length > 0) {
      ph.className = 'panel-photos';
      ph.innerHTML = visit.photos.map(function(s){ return '<img src="'+s+'" alt="" loading="lazy">'; }).join('');
      ph.querySelectorAll('img').forEach(function(img){ img.addEventListener('click', function(){ openLightbox(img.src); }); });
    } else { ph.className=''; ph.innerHTML='<div class="no-photos">Próximamente · Subiendo fotos</div>'; }

    var re = document.getElementById('panel-restaurants');
    re.innerHTML = '';
    if (visit.restaurants && visit.restaurants.length > 0) {
      re.className = 'panel-restaurant-list';
      visit.restaurants.forEach(function(r){
        var d = document.createElement('div'); d.className = 'panel-restaurant';
        d.innerHTML = '<div class="pr-header"><div><div class="pr-name">'+r.name+'</div><div class="pr-city">'+r.city+'</div></div><span class="pr-cuisine">'+r.cuisine+'</span></div><div class="pr-stars">'+stars(r.rating)+'</div><div class="pr-note">'+r.note+'</div>';
        re.appendChild(d);
      });
    } else { re.innerHTML = '<p style="color:var(--text-3);font-size:.75rem">Sin restaurantes registrados.</p>'; }

    var hl = document.getElementById('panel-highlights');
    hl.innerHTML = '';
    if (visit.highlights && visit.highlights.length > 0) {
      hl.className = 'highlights-list';
      visit.highlights.forEach(function(h){ var d=document.createElement('div'); d.className='highlight-item'; d.textContent=h; hl.appendChild(d); });
    }
  }

  function initConquestBtns() {
    document.querySelectorAll('.conquest-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        if (!currentISO) return;
        var st = btn.dataset.status;
        var regions = getRegions(currentISO).map(function(r){ return Object.assign({},r,{conquered: st==='full'}); });
        if (st==='none') regions = regions.map(function(r){ return Object.assign({},r,{conquered:false}); });
        setStatus(currentISO, st, regions);
        renderConquestControls(currentISO); renderRegions(currentISO);
        refreshMapStyle(currentISO); renderHUD(); updateStats();
        renderFlagsStrip();
      });
    });
  }

  // ── Flags Strip ───────────────────────────────────────────────────────────
  function renderFlagsStrip() {
    var grid = document.getElementById('flags-strip-grid'); if (!grid) return;
    var all = T.allCountries || [];
    var visitedSet = {};
    Object.keys(T.countries).forEach(function(iso){ if (getStatus(iso)!=='none') visitedSet[iso]=true; });
    var visitedCount = all.filter(function(c){ return visitedSet[c.code]; }).length;
    var ctr = document.getElementById('fs-counter');
    if (ctr) ctr.textContent = visitedCount + ' / ' + all.length + ' conquistados';

    grid.innerHTML = all.map(function(c){
      var vis = visitedSet[c.code];
      return '<div class="fs-item'+(vis?' visited':'')+(vis?'" title="'+c.name+' — Ver en el mapa"':'"')+' data-iso="'+c.code+'">'+
        '<img src="https://flagcdn.com/w40/'+c.code.toLowerCase()+'.png" alt="'+c.name+'" loading="lazy">'+
        (vis ? '<div class="fs-dot"></div>' : '')+
      '</div>';
    }).join('');

    grid.querySelectorAll('.fs-item.visited').forEach(function(item){
      item.addEventListener('click', function(){
        var iso = item.dataset.iso;
        var mapTab = document.querySelector('[data-view="map"]'); if (mapTab) mapTab.click();
        setTimeout(function(){
          var layer = geoLayers[iso];
          if (layer) { try { map.flyToBounds(layer.getBounds(),{padding:[60,60],duration:1.2,maxZoom:6}); }catch(_){} }
          openPanel(iso, (T.countries[iso]&&T.countries[iso].name)||iso);
        }, 300);
      });
    });
  }

  // ── Restaurants view ──────────────────────────────────────────────────────
  function getAllRestaurants() {
    var all = [];
    Object.keys(T.countries).forEach(function(iso){
      var c = T.countries[iso]; if (!c.visits) return;
      c.visits.forEach(function(v){ if (!v.restaurants) return; v.restaurants.forEach(function(r){ all.push(Object.assign({},r,{isoCode:iso,countryName:c.name,flag:c.flag,region:v.region,visitDate:v.dateFrom})); }); });
    });
    return all.sort(function(a,b){ return b.rating-a.rating; });
  }

  function renderRestaurants() {
    var grid = document.getElementById('restaurants-grid'); if (!grid) return;
    var fi = document.getElementById('filter-country'), fr = document.getElementById('filter-rating');
    var data = getAllRestaurants().filter(function(r){
      if (fi && fi.value!=='all' && r.isoCode!==fi.value) return false;
      if (fr && r.rating<parseInt(fr.value)) return false;
      return true;
    });
    if (data.length===0){ grid.innerHTML='<p style="color:var(--text-3);font-size:.8rem;padding:24px">Sin resultados.</p>'; return; }
    grid.innerHTML = data.map(function(r){
      return '<div class="restaurant-card"><div class="rc-header"><img class="rc-flag" src="'+r.flag+'" alt="'+r.countryName+'"><div><div class="rc-country">'+r.countryName+' · '+r.region+'</div><div class="rc-name">'+r.name+'</div><div class="rc-city">'+r.city+'</div></div><div class="rc-badges"><span class="rc-cuisine">'+r.cuisine+'</span></div></div><div class="rc-stars">'+stars(r.rating)+'</div><div class="rc-note">'+r.note+'</div></div>';
    }).join('');
    populateCountryFilter();
  }

  var filtersPopulated = false;
  function populateCountryFilter() {
    if (filtersPopulated) return; filtersPopulated = true;
    var sel = document.getElementById('filter-country'); if (!sel) return;
    Object.keys(T.countries).sort(function(a,b){ return T.countries[a].name.localeCompare(T.countries[b].name,'es'); }).forEach(function(iso){
      var o=document.createElement('option'); o.value=iso; o.textContent=T.countries[iso].name; sel.appendChild(o);
    });
    sel.addEventListener('change', renderRestaurants);
    var rs = document.getElementById('filter-rating'); if (rs) rs.addEventListener('change', renderRestaurants);
  }

  // ── Photos view ───────────────────────────────────────────────────────────
  function renderPhotos() {
    var grid = document.getElementById('photos-grid'); if (!grid) return;
    var fi = document.getElementById('filter-photo-country');
    var items = [];
    Object.keys(T.countries).forEach(function(iso){ var c=T.countries[iso]; if (!c.visits) return; c.visits.forEach(function(v){ if (!v.photos) return; v.photos.forEach(function(s){ items.push({src:s,iso:iso,country:c.name,flag:c.flag}); }); }); });
    if (fi && fi.value!=='all') items = items.filter(function(i){ return i.iso===fi.value; });
    if (items.length===0){ grid.innerHTML='<p style="color:var(--text-3);font-size:.8rem;padding:24px">Sin fotos disponibles aún.</p>'; return; }
    grid.innerHTML = items.map(function(i){ return '<div class="photo-item"><img src="'+i.src+'" alt="'+i.country+'" loading="lazy"><div class="photo-overlay"><img src="'+i.flag+'" alt="'+i.country+'"><span>'+i.country+'</span></div></div>'; }).join('');
    grid.querySelectorAll('.photo-item').forEach(function(item){ item.addEventListener('click', function(){ openLightbox(item.querySelector('img').src); }); });
    populatePhotoFilter();
  }

  function populatePhotoFilter() {
    var sel = document.getElementById('filter-photo-country'); if (!sel || sel.dataset.populated) return; sel.dataset.populated='1';
    Object.keys(T.countries).sort(function(a,b){ return T.countries[a].name.localeCompare(T.countries[b].name,'es'); }).forEach(function(iso){ var o=document.createElement('option'); o.value=iso; o.textContent=T.countries[iso].name; sel.appendChild(o); });
    sel.addEventListener('change', renderPhotos);
  }

  // ── Videos view ───────────────────────────────────────────────────────────
  var VIDEO_KEY = 'gardariam_videos_v2';
  function loadVideos() { try { return JSON.parse(localStorage.getItem(VIDEO_KEY))||[]; }catch(e){ return []; } }
  function saveVideos(v) { try { localStorage.setItem(VIDEO_KEY, JSON.stringify(v)); }catch(e){} }

  function getAllVideos() {
    var base=[], user=loadVideos();
    Object.keys(T.countries).forEach(function(iso){ var c=T.countries[iso]; if (!c.visits) return; c.visits.forEach(function(v){ if (!v.videos) return; v.videos.forEach(function(vi){ base.push(Object.assign({},vi,{iso:iso,countryName:c.name,flag:c.flag,source:'base'})); }); }); });
    return base.concat(user.map(function(v){ var c=T.countries[v.iso]; return Object.assign({},v,{countryName:c?c.name:v.iso,flag:c?c.flag:('https://flagcdn.com/w80/'+v.iso.toLowerCase()+'.png'),source:'user'}); }));
  }

  function renderVideos() {
    var grid = document.getElementById('videos-grid'); if (!grid) return;
    var vids = getAllVideos();
    if (vids.length===0){ grid.innerHTML='<div class="videos-empty">⚜ Sin vídeos aún<p>Pega un enlace de YouTube arriba para añadir el primero</p></div>'; populateVideoFilter(); return; }
    var baseCount = vids.filter(function(v){ return v.source==='base'; }).length;
    grid.innerHTML = vids.map(function(v,i){
      var id = getYouTubeId(v.youtubeUrl||v.url||''); if (!id) return '';
      var del = v.source==='user'?'<button class="video-delete" data-idx="'+(i-baseCount)+'" title="Eliminar">✕</button>':'';
      return '<div class="video-card" data-yt="'+id+'"><div class="video-thumb"><img src="'+ytThumb(id)+'" alt="'+v.title+'" loading="lazy"><div class="video-play"><div class="play-icon">▶</div></div></div><div class="video-info"><img class="video-flag" src="'+v.flag+'" alt="'+v.countryName+'"><div class="video-meta"><div class="video-title">'+(v.title||'Vídeo')+'</div><div class="video-country">'+v.countryName+'</div></div>'+del+'</div></div>';
    }).filter(Boolean).join('');
    grid.querySelectorAll('.video-card').forEach(function(c){ c.addEventListener('click', function(e){ if (e.target.classList.contains('video-delete')) return; openVideoModal(c.dataset.yt); }); });
    grid.querySelectorAll('.video-delete').forEach(function(btn){ btn.addEventListener('click', function(e){ e.stopPropagation(); var u=loadVideos(); u.splice(parseInt(btn.dataset.idx),1); saveVideos(u); renderVideos(); }); });
    populateVideoFilter();
  }

  function populateVideoFilter() {
    var sel = document.getElementById('video-country-select'); if (!sel||sel.dataset.populated) return; sel.dataset.populated='1';
    Object.keys(T.countries).sort(function(a,b){ return T.countries[a].name.localeCompare(T.countries[b].name,'es'); }).forEach(function(iso){ var o=document.createElement('option'); o.value=iso; o.textContent=T.countries[iso].name; sel.appendChild(o); });
  }

  function initAddVideoForm() {
    var btn = document.getElementById('add-video-btn'); if (!btn) return;
    btn.addEventListener('click', function(){
      var u=document.getElementById('video-url-input'), ti=document.getElementById('video-title-input'), c=document.getElementById('video-country-select');
      if (!u||!c) return;
      var url=u.value.trim(), iso=c.value, title=(ti&&ti.value.trim())||null;
      if (!url||!iso){ u.focus(); return; }
      var id=getYouTubeId(url); if (!id){ u.style.borderColor='var(--danger)'; setTimeout(function(){ u.style.borderColor=''; },1500); return; }
      var vids=loadVideos(); vids.push({youtubeUrl:url,title:title||'Vídeo '+(vids.length+1),iso:iso,addedAt:new Date().toISOString()}); saveVideos(vids);
      u.value=''; if (ti) ti.value=''; renderVideos();
    });
    var u=document.getElementById('video-url-input'); if (u) u.addEventListener('keydown', function(e){ if (e.key==='Enter') btn.click(); });
  }

  // ── Video modal ───────────────────────────────────────────────────────────
  function openVideoModal(ytId) { var m=document.getElementById('video-modal'); document.getElementById('yt-embed').src='https://www.youtube-nocookie.com/embed/'+ytId+'?autoplay=1&rel=0'; m.classList.add('open'); }
  function closeVideoModal() { var m=document.getElementById('video-modal'); m.classList.remove('open'); setTimeout(function(){ document.getElementById('yt-embed').src=''; },300); }
  function initVideoModal() { var m=document.getElementById('video-modal'); if (!m) return; m.addEventListener('click',function(e){ if (e.target===m) closeVideoModal(); }); var b=m.querySelector('.video-modal-close'); if (b) b.addEventListener('click',closeVideoModal); }

  // ── Lightbox ──────────────────────────────────────────────────────────────
  function openLightbox(src) { var lb=document.getElementById('lightbox'); lb.querySelector('img').src=src; lb.classList.add('open'); }
  function closeLightbox() { var lb=document.getElementById('lightbox'); lb.classList.remove('open'); setTimeout(function(){ lb.querySelector('img').src=''; },300); }
  function initLightbox() { var lb=document.getElementById('lightbox'); if (!lb) return; lb.addEventListener('click',function(e){ if (e.target===lb) closeLightbox(); }); var b=lb.querySelector('.lightbox-close'); if (b) b.addEventListener('click',closeLightbox); }

  function initPanelClose() {
    var btn=document.querySelector('.panel-close'); if (btn) btn.addEventListener('click',closePanel);
    document.addEventListener('keydown',function(e){ if (e.key==='Escape'){ closeLightbox(); closeVideoModal(); closePanel(); } });
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function(){
    safe(initSplash,       'splash');
    safe(initNav,          'nav');
    safe(initColorPicker,  'color-picker');
    safe(initMap,          'map');
    safe(initConquestBtns, 'conquest-btns');
    safe(initPanelClose,   'panel-close');
    safe(initLightbox,     'lightbox');
    safe(initVideoModal,   'video-modal');
    safe(initAddVideoForm, 'add-video-form');
    safe(renderFlagsStrip, 'flags-strip');
  });

})();
