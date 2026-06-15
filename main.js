(function () {
  'use strict';

  var T = window.__TRAVELS__;
  var map = null;
  var geoLayers = {};         // ISO → country layer
  var geoRegionLayers = {};   // 'IT_sicilia' → [layer, ...]
  var currentISO = null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function safe(fn, name) { try { fn(); } catch (e) { console.warn('[Gardariam]', name, e); } }
  function fmt(d) { return d ? new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}) : '—'; }
  function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
  function stars(n) { return '★'.repeat(n) + '☆'.repeat(5-n); }
  function getYouTubeId(url) {
    var m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return m ? m[1] : null;
  }
  function ytThumb(id) { return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg'; }

  // ── Color ──────────────────────────────────────────────────────────────────
  var DEFAULT_COLOR = '#8b1a2a';
  var COLOR_KEY = 'gardariam_conquest_color';
  function getConquestColor() { return localStorage.getItem(COLOR_KEY) || DEFAULT_COLOR; }
  function setConquestColor(c) { localStorage.setItem(COLOR_KEY, c); }
  function hexRgb(hex) {
    var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return {r:r,g:g,b:b};
  }
  function lighten(hex, amt) {
    var c=hexRgb(hex);
    return 'rgb('+Math.min(c.r+amt,255)+','+Math.min(c.g+amt,255)+','+Math.min(c.b+amt,255)+')';
  }
  function rgba(hex, a) { var c=hexRgb(hex); return 'rgba('+c.r+','+c.g+','+c.b+','+a+')'; }

  // Countries that have sub-region GeoJSON data in regions.geojson
  var REGION_COUNTRIES = { IT:1, ES:1, FR:1, TR:1, JP:1, ID:1 };
  function hasGeoRegions(iso) { return !!REGION_COUNTRIES[iso]; }

  function getStyles() {
    var col = getConquestColor();
    return {
      none:    { fillColor:'#cf8d14', fillOpacity:0.92, color:'#e8aa20', weight:0.8 },
      partial: { fillColor:'url(#conquest-stripe)', fillOpacity:1, color:col, weight:1.4 },
      full:    { fillColor:col, fillOpacity:1, color:lighten(col,55), weight:2 },
    };
  }
  function hoverStyles() {
    var col = getConquestColor();
    return {
      none:    { fillColor:'#e09a28', color:'#f5bc30' },
      partial: { fillColor:'url(#conquest-stripe)', color:lighten(col,40) },
      full:    { fillColor:lighten(col,25), color:lighten(col,70) },
    };
  }

  // For countries with GeoJSON sub-regions: use a very subtle base so regions show through
  function styleForISO(iso) {
    var st = getStatus(iso);
    if (hasGeoRegions(iso) && st !== 'none') {
      return { fillColor:'#cf8d14', fillOpacity:0.1, color:'#e8aa20', weight:0.8 };
    }
    return Object.assign({}, getStyles()[st]);
  }

  function styleForRegion(iso, regionId) {
    var conquered = isRegionConquered(iso, regionId);
    var col = getConquestColor();
    if (conquered) {
      return { fillColor:col, fillOpacity:0.96, color:lighten(col,55), weight:1.2 };
    }
    return { fillColor:'#cf8d14', fillOpacity:0.9, color:'rgba(200,144,40,0.35)', weight:0.5 };
  }

  function hoverStyleForRegion(iso, regionId) {
    var col = getConquestColor();
    return isRegionConquered(iso, regionId) ?
      { fillColor:lighten(col,28) } :
      { fillColor:'#e09a28' };
  }

  // ── Conquest state ─────────────────────────────────────────────────────────
  var STORAGE_KEY = 'gardariam_conquest_v2';
  function loadState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY))||{}; }catch(e){ return {}; } }
  function saveState(s) { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(s)); }catch(e){} }

  function computeStatus(regions) {
    if (!regions||regions.length===0) return 'full';
    var c = regions.filter(function(r){ return r.conquered; }).length;
    return c===0?'none':c===regions.length?'full':'partial';
  }

  function getRegions(iso) {
    var base = (T.countries[iso]&&T.countries[iso].regions) ? T.countries[iso].regions : [];
    var saved = (loadState()[iso]&&loadState()[iso].regions) ? loadState()[iso].regions : null;
    if (!saved) return base.map(function(r){ return Object.assign({},r); });
    return base.map(function(r){
      var s = saved.find(function(x){ return x.id===r.id; });
      return Object.assign({},r, s?{conquered:s.conquered}:{});
    });
  }

  function getStatus(iso) {
    var saved = loadState()[iso];
    if (saved&&saved.status!==undefined) return saved.status;
    if (!T.countries[iso]) return 'none';
    return computeStatus(T.countries[iso].regions);
  }

  function setStatus(iso, status, regions) {
    var s = loadState(); s[iso]={status:status,regions:regions}; saveState(s);
  }

  function isRegionConquered(iso, regionId) {
    var regs = getRegions(iso);
    var r = regs.find(function(r){ return r.id===regionId; });
    return r ? r.conquered : false;
  }

  function getRegionDisplayName(iso, regionId) {
    var regs = T.countries[iso]&&T.countries[iso].regions;
    if (!regs) return regionId;
    var r = regs.find(function(r){ return r.id===regionId; });
    return r ? r.name : regionId;
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
          v.classList.toggle('active', v.id===view+'-view');
        });
        if (view==='map'&&map) setTimeout(function(){ map.invalidateSize(); },50);
        if (view==='restaurants') renderRestaurants();
        if (view==='photos') renderPhotos();
        if (view==='videos') renderVideos();
      });
    });
    updateStats();
  }

  function updateStats() {
    var all = T.allCountries||[];
    var count = all.filter(function(c){ return getStatus(c.code)!=='none'; }).length;
    var el = document.getElementById('stat-countries'); if (el) el.textContent=count;
  }

  // ── Color picker ──────────────────────────────────────────────────────────
  function initColorPicker() {
    var input = document.getElementById('conquest-color-input');
    var swatch = document.getElementById('color-swatch');
    if (!input) return;
    input.value = getConquestColor();
    if (swatch) swatch.style.background = getConquestColor();
    input.addEventListener('input', function(){
      setConquestColor(input.value);
      if (swatch) swatch.style.background = input.value;
      updateStripePattern();
      // Refresh all non-none map layers
      Object.keys(geoLayers).forEach(function(iso){
        if (getStatus(iso)!=='none') refreshMapStyle(iso);
      });
      // Refresh all region layers
      Object.keys(geoRegionLayers).forEach(function(key){
        var parts = key.split('_'); var iso=parts[0], rid=parts.slice(1).join('_');
        refreshRegionStyle(iso, rid);
      });
    });
    if (swatch) swatch.addEventListener('click', function(){ input.click(); });
  }

  // ── SVG Stripe Pattern for "Invadiendo" ───────────────────────────────────
  function injectStripePattern() {
    var svg = document.querySelector('.leaflet-overlay-pane svg');
    if (!svg||svg.querySelector('#gardariam-defs')) return;
    var col = getConquestColor(); var c = hexRgb(col);
    var defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    defs.id = 'gardariam-defs';
    defs.innerHTML =
      '<pattern id="conquest-stripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45 0 0)">' +
      '<rect x="0" y="0" width="5" height="10" fill="rgba('+c.r+','+c.g+','+c.b+',0.65)"/>' +
      '</pattern>';
    svg.insertBefore(defs, svg.firstChild);
  }

  function updateStripePattern() {
    var defs = document.getElementById('gardariam-defs'); if (!defs) return;
    var col = getConquestColor(); var c = hexRgb(col);
    var rect = defs.querySelector('#conquest-stripe rect');
    if (rect) rect.setAttribute('fill','rgba('+c.r+','+c.g+','+c.b+',0.65)');
  }

  // ── Rich Tooltip ──────────────────────────────────────────────────────────
  function buildTooltipHtml(iso, name, countryStatus, regionId) {
    var flagUrl = 'https://flagcdn.com/w40/'+iso.toLowerCase()+'.png';
    var stClass = countryStatus==='full'?'ct-full':countryStatus==='partial'?'ct-partial':'ct-none';
    var stLabel = countryStatus==='full'
      ? '<span class="ct-badge ct-full">⚜ Conquistado</span>'
      : countryStatus==='partial'
      ? '<span class="ct-badge ct-partial">⚔ Invadiendo</span>'
      : '<span class="ct-badge ct-none">Sin conquistar</span>';
    var regionHtml = '';
    if (regionId) {
      var rName = getRegionDisplayName(iso, regionId);
      var rConq = isRegionConquered(iso, regionId);
      regionHtml = '<div class="ct-region">'+(rConq?'⚜ ':'◦ ')+rName+(rConq?' — <span class="ct-rconq">Conquistada</span>':'')+' </div>';
    }
    return '<div class="ct-header"><img class="ct-flag" src="'+flagUrl+'" alt="'+iso+'"><span class="ct-name">'+name+'</span></div>'+stLabel+regionHtml;
  }

  // ── Map ───────────────────────────────────────────────────────────────────
  function initMap() {
    if (!window.L) return;
    map = L.map('map', {
      center:[20,15], zoom:3,
      minZoom:1, maxZoom:9,
      maxBoundsViscosity:1.0,
      zoomSnap:0.25,
      bounceAtZoomLimits:false,
      zoomControl:true,
      worldCopyJump:false,
      attributionControl:false,
    });
    var worldB = L.latLngBounds([[-65,-168],[82,178]]);
    map.fitBounds(worldB,{animate:false,padding:[0,0]});
    map.setMinZoom(map.getZoom());
    map.setMaxBounds(L.latLngBounds([[-78,-182],[86,184]]));
    map.on('resize', function(){
      map.fitBounds(worldB,{animate:false,padding:[0,0]});
      map.setMinZoom(map.getZoom());
    });
    addGraticule();
    fetch('lib/countries.geojson?v=20260615')
      .then(function(r){ return r.json(); })
      .then(function(data){ buildGeoLayer(data); addDecorations(); loadRegions(); })
      .catch(function(e){ console.warn('[Gardariam] GeoJSON failed',e); });
  }

  function addGraticule() {
    var lines=[];
    [-180,-150,-120,-90,-60,-30,0,30,60,90,120,150,180].forEach(function(lng){
      lines.push({type:'Feature',geometry:{type:'LineString',coordinates:[[lng,-85],[lng,85]]},properties:{}});
    });
    [-60,-30,0,30,60].forEach(function(lat){
      lines.push({type:'Feature',geometry:{type:'LineString',coordinates:[[-180,lat],[180,lat]]},properties:{}});
    });
    L.geoJSON({type:'FeatureCollection',features:lines},{
      style:{color:'rgba(200,160,20,0.13)',weight:0.7,opacity:1,fill:false,interactive:false}
    }).addTo(map);
  }

  var SHIP_SVG = '<svg viewBox="0 0 48 42" xmlns="http://www.w3.org/2000/svg" width="48" height="42"><line x1="24" y1="3" x2="24" y2="28" stroke="rgba(210,148,24,0.4)" stroke-width="1.2"/><polygon points="24,5 38,22 10,22" fill="rgba(210,148,24,0.18)" stroke="rgba(210,148,24,0.3)" stroke-width="0.8"/><polygon points="24,10 33,22 15,22" fill="rgba(210,148,24,0.1)"/><path d="M8,28 Q24,36 40,28 L38,28 Q24,34 10,28 Z" fill="rgba(210,148,24,0.28)"/></svg>';
  var SERPENT_SVG = '<svg viewBox="0 0 70 30" xmlns="http://www.w3.org/2000/svg" width="70" height="30"><path d="M5,18 Q12,8 22,16 Q32,24 42,14 Q52,4 62,12" fill="none" stroke="rgba(210,148,24,0.25)" stroke-width="2.5" stroke-linecap="round"/><circle cx="63" cy="11" r="4" fill="rgba(210,148,24,0.2)" stroke="rgba(210,148,24,0.3)" stroke-width="0.8"/><line x1="65" y1="9" x2="68" y2="7" stroke="rgba(210,148,24,0.3)" stroke-width="1" stroke-linecap="round"/><line x1="65" y1="9" x2="69" y2="10" stroke="rgba(210,148,24,0.3)" stroke-width="1" stroke-linecap="round"/></svg>';
  var CROSS_SVG = '<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" width="22" height="22"><line x1="11" y1="2" x2="11" y2="20" stroke="rgba(210,148,24,0.22)" stroke-width="1.5"/><line x1="2" y1="11" x2="20" y2="11" stroke="rgba(210,148,24,0.22)" stroke-width="1.5"/><circle cx="11" cy="11" r="2.5" fill="rgba(210,148,24,0.28)"/></svg>';

  function addDecorations() {
    function mk(lat,lng,html,w,h){
      var icon=L.divIcon({className:'',html:html,iconSize:[w,h],iconAnchor:[w/2,h/2]});
      L.marker([lat,lng],{icon:icon,interactive:false,keyboard:false,zIndexOffset:-2000}).addTo(map);
    }
    mk(28,-38,SHIP_SVG,48,42);
    mk(8,168,SHIP_SVG,48,42);
    mk(-15,-25,SERPENT_SVG,70,30);
    mk(-40,80,SERPENT_SVG,70,30);
    mk(72,-18,CROSS_SVG,22,22);
    mk(72,90,CROSS_SVG,22,22);
    mk(-55,-80,CROSS_SVG,22,22);
  }

  function buildGeoLayer(data) {
    L.geoJSON(data, {
      style: function(f){ return styleForISO(f.properties.ISO_A2); },
      onEachFeature: function(f, layer){
        var iso = f.properties.ISO_A2;
        var name = f.properties.ADMIN||f.properties.NAME||iso;
        geoLayers[iso] = layer;
        layer.bindTooltip(buildTooltipHtml(iso,name,getStatus(iso),null), {
          className:'country-tooltip-rich', sticky:true, direction:'top', offset:[0,-8], opacity:1
        });
        layer.on('mouseover', function(e){
          layer.setTooltipContent(buildTooltipHtml(iso,name,getStatus(iso),null));
          e.target.setStyle(Object.assign({},styleForISO(iso),hoverStyles()[getStatus(iso)]));
        });
        layer.on('mouseout',  function(e){ e.target.setStyle(styleForISO(iso)); });
        layer.on('click', function(){
          openPanel(iso,name);
          try { map.flyToBounds(layer.getBounds(),{padding:[60,60],duration:1,maxZoom:6}); }catch(_){}
        });
      },
    }).addTo(map);
    injectStripePattern();
    renderHUD();
  }

  // ── Regions layer ─────────────────────────────────────────────────────────
  function loadRegions() {
    fetch('lib/regions.geojson?v=20260616')
      .then(function(r){ return r.json(); })
      .then(function(data){ buildRegionLayer(data); })
      .catch(function(e){ console.warn('[Gardariam] regions.geojson failed',e); });
  }

  function buildRegionLayer(data) {
    L.geoJSON(data, {
      style: function(f){ return styleForRegion(f.properties.iso, f.properties.regionId); },
      onEachFeature: function(f, layer){
        var iso = f.properties.iso;
        var rid = f.properties.regionId;
        var key = iso+'_'+rid;
        if (!geoRegionLayers[key]) geoRegionLayers[key]=[];
        geoRegionLayers[key].push(layer);
        var countryName = (T.countries[iso]&&T.countries[iso].name)||iso;
        layer.bindTooltip(buildTooltipHtml(iso,countryName,getStatus(iso),rid), {
          className:'country-tooltip-rich', sticky:true, direction:'top', offset:[0,-8], opacity:1
        });
        layer.on('mouseover', function(e){
          layer.setTooltipContent(buildTooltipHtml(iso,countryName,getStatus(iso),rid));
          e.target.setStyle(hoverStyleForRegion(iso,rid));
        });
        layer.on('mouseout', function(e){ e.target.setStyle(styleForRegion(iso,rid)); });
        layer.on('click', function(e){
          L.DomEvent.stopPropagation(e);
          openPanel(iso, countryName);
          var baseLayer = geoLayers[iso];
          if (baseLayer) { try { map.flyToBounds(baseLayer.getBounds(),{padding:[60,60],duration:1,maxZoom:6}); }catch(_){} }
        });
      },
    }).addTo(map);
  }

  function refreshMapStyle(iso) {
    var layer=geoLayers[iso]; if (!layer) return;
    layer.setStyle(styleForISO(iso));
    var name=layer.feature&&(layer.feature.properties.ADMIN||layer.feature.properties.NAME||iso);
    var status=getStatus(iso);
    layer.setTooltipContent(buildTooltipHtml(iso,name,status,null));
  }

  function refreshRegionStyle(iso, rid) {
    var key=iso+'_'+rid;
    var layers=geoRegionLayers[key]; if (!layers) return;
    layers.forEach(function(l){ l.setStyle(styleForRegion(iso,rid)); });
  }

  function refreshAllRegionStylesForCountry(iso) {
    var regions=getRegions(iso);
    regions.forEach(function(r){ refreshRegionStyle(iso,r.id); });
    // Also refresh any region keys that start with this iso
    Object.keys(geoRegionLayers).forEach(function(key){
      if (key.indexOf(iso+'_')===0){ var rid=key.slice(iso.length+1); refreshRegionStyle(iso,rid); }
    });
  }

  function renderHUD() {
    var all=T.allCountries||[];
    var c=all.filter(function(c){ return getStatus(c.code)!=='none'; }).length;
    var el=document.getElementById('hud-conquered'); if (el) el.textContent=c;
  }

  // ── Scroll to flags ───────────────────────────────────────────────────────
  function initScrollToFlags() {
    var btn=document.getElementById('scroll-to-flags-btn'); if (!btn) return;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var view=document.getElementById('map-view');
      var strip=document.getElementById('flags-strip');
      if (view&&strip){
        var sr=strip.getBoundingClientRect(), vr=view.getBoundingClientRect();
        view.scrollTo({top:view.scrollTop+(sr.top-vr.top),behavior:'smooth'});
      }
    });
  }

  // ── Country dropdown ──────────────────────────────────────────────────────
  function initCountryDropdown() {
    var sel=document.getElementById('country-map-select'); if (!sel) return;
    Object.keys(T.countries)
      .sort(function(a,b){ return T.countries[a].name.localeCompare(T.countries[b].name,'es'); })
      .forEach(function(iso){
        var o=document.createElement('option'); o.value=iso; o.textContent=T.countries[iso].name; sel.appendChild(o);
      });
    sel.addEventListener('change', function(){
      var iso=sel.value; if (!iso) return;
      openPanel(iso, T.countries[iso].name);
      var layer=geoLayers[iso];
      if (layer){ try { map.flyToBounds(layer.getBounds(),{padding:[80,80],duration:1.2,maxZoom:6}); }catch(_){} }
      setTimeout(function(){ sel.value=''; },400);
    });
  }

  // ── Detail Panel ──────────────────────────────────────────────────────────
  function openPanel(iso, name) {
    currentISO=iso;
    var data=T.countries[iso];
    var panel=document.getElementById('detail-panel');
    panel.querySelector('.panel-hero img').src=(data&&data.coverPhoto)?data.coverPhoto:'https://images.unsplash.com/photo-1457449940276-e8deed18bfff?w=1200&q=80';
    panel.querySelector('.panel-hero img').alt=name;
    panel.querySelector('.panel-flag-img').src=(data&&data.flag)?data.flag:('https://flagcdn.com/w80/'+iso.toLowerCase()+'.png');
    panel.querySelector('.panel-country-name').textContent=name;
    renderConquestControls(iso); renderRegions(iso);
    var sec=document.getElementById('panel-visits-section');
    if (data&&data.visits&&data.visits.length>0){ sec.style.display=''; renderVisitDetails(data,0); }
    else { sec.style.display='none'; }
    panel.classList.add('open'); panel.setAttribute('aria-hidden','false');
  }

  function closePanel() {
    var p=document.getElementById('detail-panel');
    p.classList.remove('open'); p.setAttribute('aria-hidden','true'); currentISO=null;
  }

  function renderConquestControls(iso) {
    var st=getStatus(iso);
    document.querySelectorAll('.conquest-btn').forEach(function(btn){
      btn.classList.toggle('active', btn.dataset.status===st);
    });
  }

  function renderRegions(iso) {
    var container=document.getElementById('panel-regions');
    var regions=getRegions(iso);
    if (!regions||regions.length===0){ container.style.display='none'; return; }
    container.style.display='';
    container.innerHTML='<div class="section-label">Territorios</div><div class="regions-grid">'+
      regions.map(function(r){
        return '<div class="region-chip'+(r.conquered?' conquered':'')+'" data-id="'+r.id+'">' +
          '<span class="chip-dot"></span>'+r.name+(r.date?'<span class="region-date">'+r.date+'</span>':'')+
        '</div>';
      }).join('')+'</div>';
    container.querySelectorAll('.region-chip').forEach(function(chip){
      chip.addEventListener('click', function(){ toggleRegion(iso, chip.dataset.id); });
    });
  }

  function toggleRegion(iso, regionId) {
    var regions=getRegions(iso).map(function(r){
      return r.id===regionId?Object.assign({},r,{conquered:!r.conquered}):r;
    });
    var newStatus=computeStatus(regions);
    setStatus(iso, newStatus, regions);
    renderConquestControls(iso); renderRegions(iso);
    refreshMapStyle(iso); refreshAllRegionStylesForCountry(iso);
    renderHUD(); updateStats(); renderFlagsStrip();
  }

  function renderVisitDetails(data, idx) {
    var visit=data.visits[idx]; if (!visit) return;
    document.getElementById('panel-visit-meta').innerHTML=
      '<div class="meta-chip gold">📅 '+fmt(visit.dateFrom)+'</div>'+
      '<div class="meta-chip">⏱ '+daysBetween(visit.dateFrom,visit.dateTo)+' días</div>'+
      '<div class="meta-chip">📍 '+visit.region+'</div>';
    var ph=document.getElementById('panel-photos');
    if (visit.photos&&visit.photos.length>0){
      ph.className='panel-photos';
      ph.innerHTML=visit.photos.map(function(s){ return '<img src="'+s+'" alt="" loading="lazy">'; }).join('');
      ph.querySelectorAll('img').forEach(function(img){ img.addEventListener('click',function(){ openLightbox(img.src); }); });
    } else { ph.className=''; ph.innerHTML='<div class="no-photos">Próximamente · Subiendo fotos</div>'; }
    var re=document.getElementById('panel-restaurants'); re.innerHTML='';
    if (visit.restaurants&&visit.restaurants.length>0){
      re.className='panel-restaurant-list';
      visit.restaurants.forEach(function(r){
        var d=document.createElement('div'); d.className='panel-restaurant';
        d.innerHTML='<div class="pr-header"><div><div class="pr-name">'+r.name+'</div><div class="pr-city">'+r.city+'</div></div><span class="pr-cuisine">'+r.cuisine+'</span></div><div class="pr-stars">'+stars(r.rating)+'</div><div class="pr-note">'+r.note+'</div>';
        re.appendChild(d);
      });
    } else { re.innerHTML='<p style="color:var(--text-3);font-size:.75rem">Sin restaurantes registrados.</p>'; }
    var hl=document.getElementById('panel-highlights'); hl.innerHTML='';
    if (visit.highlights&&visit.highlights.length>0){
      hl.className='highlights-list';
      visit.highlights.forEach(function(h){ var d=document.createElement('div'); d.className='highlight-item'; d.textContent=h; hl.appendChild(d); });
    }
  }

  function initConquestBtns() {
    document.querySelectorAll('.conquest-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        if (!currentISO) return;
        var st=btn.dataset.status;
        var regions=getRegions(currentISO).map(function(r){ return Object.assign({},r,{conquered:st==='full'}); });
        if (st==='none') regions=regions.map(function(r){ return Object.assign({},r,{conquered:false}); });
        setStatus(currentISO, st, regions);
        renderConquestControls(currentISO); renderRegions(currentISO);
        refreshMapStyle(currentISO); refreshAllRegionStylesForCountry(currentISO);
        renderHUD(); updateStats(); renderFlagsStrip();
      });
    });
  }

  // ── Flags Strip ───────────────────────────────────────────────────────────
  function renderFlagsStrip() {
    var grid=document.getElementById('flags-strip-grid'); if (!grid) return;
    var all=T.allCountries||[];
    var visitedSet={};
    all.forEach(function(c){ if (getStatus(c.code)!=='none') visitedSet[c.code]=true; });
    var count=Object.keys(visitedSet).length;
    var ctr=document.getElementById('fs-counter');
    if (ctr) ctr.textContent=count+' / '+all.length+' conquistados';
    var hudEl=document.getElementById('hud-conquered');
    if (hudEl) hudEl.textContent=count;
    grid.innerHTML=all.map(function(c){
      var vis=visitedSet[c.code];
      return '<div class="fs-item'+(vis?' visited':'')+'" title="'+(vis?'✓ ':'')+c.name+'" data-iso="'+c.code+'">'+
        '<img src="https://flagcdn.com/w40/'+c.code.toLowerCase()+'.png" alt="'+c.name+'" loading="lazy">'+
        (vis?'<div class="fs-dot"></div>':'')+
      '</div>';
    }).join('');
    grid.querySelectorAll('.fs-item').forEach(function(item){
      item.addEventListener('click', function(){
        var iso=item.dataset.iso;
        var cur=getStatus(iso);
        var newSt=cur==='none'?'full':'none';
        var regions=getRegions(iso).map(function(r){ return Object.assign({},r,{conquered:newSt==='full'}); });
        setStatus(iso,newSt,regions);
        refreshMapStyle(iso); refreshAllRegionStylesForCountry(iso);
        renderHUD(); updateStats(); renderFlagsStrip();
        if (currentISO===iso){ renderConquestControls(iso); renderRegions(iso); }
      });
    });
  }

  // ── Restaurants ───────────────────────────────────────────────────────────
  function getAllRestaurants() {
    var all=[];
    Object.keys(T.countries).forEach(function(iso){
      var c=T.countries[iso]; if (!c.visits) return;
      c.visits.forEach(function(v){ if (!v.restaurants) return; v.restaurants.forEach(function(r){ all.push(Object.assign({},r,{isoCode:iso,countryName:c.name,flag:c.flag,region:v.region})); }); });
    });
    return all.sort(function(a,b){ return b.rating-a.rating; });
  }
  function renderRestaurants() {
    var grid=document.getElementById('restaurants-grid'); if (!grid) return;
    var fi=document.getElementById('filter-country'),fr=document.getElementById('filter-rating');
    var data=getAllRestaurants().filter(function(r){
      if (fi&&fi.value!=='all'&&r.isoCode!==fi.value) return false;
      if (fr&&r.rating<parseInt(fr.value)) return false;
      return true;
    });
    if (!data.length){ grid.innerHTML='<p style="color:var(--text-3);font-size:.8rem;padding:24px">Sin resultados.</p>'; return; }
    grid.innerHTML=data.map(function(r){
      return '<div class="restaurant-card"><div class="rc-header"><img class="rc-flag" src="'+r.flag+'" alt="'+r.countryName+'"><div><div class="rc-country">'+r.countryName+' · '+r.region+'</div><div class="rc-name">'+r.name+'</div><div class="rc-city">'+r.city+'</div></div><div class="rc-badges"><span class="rc-cuisine">'+r.cuisine+'</span></div></div><div class="rc-stars">'+stars(r.rating)+'</div><div class="rc-note">'+r.note+'</div></div>';
    }).join('');
    populateCountryFilter();
  }
  var filtersPopulated=false;
  function populateCountryFilter() {
    if (filtersPopulated) return; filtersPopulated=true;
    var sel=document.getElementById('filter-country'); if (!sel) return;
    Object.keys(T.countries).sort(function(a,b){ return T.countries[a].name.localeCompare(T.countries[b].name,'es'); }).forEach(function(iso){ var o=document.createElement('option'); o.value=iso; o.textContent=T.countries[iso].name; sel.appendChild(o); });
    sel.addEventListener('change',renderRestaurants);
    var rs=document.getElementById('filter-rating'); if (rs) rs.addEventListener('change',renderRestaurants);
  }

  // ── Photos ────────────────────────────────────────────────────────────────
  function renderPhotos() {
    var grid=document.getElementById('photos-grid'); if (!grid) return;
    var fi=document.getElementById('filter-photo-country');
    var items=[];
    Object.keys(T.countries).forEach(function(iso){ var c=T.countries[iso]; if (!c.visits) return; c.visits.forEach(function(v){ if (!v.photos) return; v.photos.forEach(function(s){ items.push({src:s,iso:iso,country:c.name,flag:c.flag}); }); }); });
    if (fi&&fi.value!=='all') items=items.filter(function(i){ return i.iso===fi.value; });
    if (!items.length){ grid.innerHTML='<p style="color:var(--text-3);font-size:.8rem;padding:24px">Sin fotos disponibles aún.</p>'; return; }
    grid.innerHTML=items.map(function(i){ return '<div class="photo-item"><img src="'+i.src+'" alt="'+i.country+'" loading="lazy"><div class="photo-overlay"><img src="'+i.flag+'" alt="'+i.country+'"><span>'+i.country+'</span></div></div>'; }).join('');
    grid.querySelectorAll('.photo-item').forEach(function(item){ item.addEventListener('click',function(){ openLightbox(item.querySelector('img').src); }); });
    populatePhotoFilter();
  }
  function populatePhotoFilter() {
    var sel=document.getElementById('filter-photo-country'); if (!sel||sel.dataset.populated) return; sel.dataset.populated='1';
    Object.keys(T.countries).sort(function(a,b){ return T.countries[a].name.localeCompare(T.countries[b].name,'es'); }).forEach(function(iso){ var o=document.createElement('option'); o.value=iso; o.textContent=T.countries[iso].name; sel.appendChild(o); });
    sel.addEventListener('change',renderPhotos);
  }

  // ── Videos ────────────────────────────────────────────────────────────────
  var VIDEO_KEY='gardariam_videos_v2';
  function loadVideos(){ try { return JSON.parse(localStorage.getItem(VIDEO_KEY))||[]; }catch(e){ return []; } }
  function saveVideos(v){ try { localStorage.setItem(VIDEO_KEY,JSON.stringify(v)); }catch(e){} }
  function getAllVideos(){
    var base=[],user=loadVideos();
    Object.keys(T.countries).forEach(function(iso){ var c=T.countries[iso]; if (!c.visits) return; c.visits.forEach(function(v){ if (!v.videos) return; v.videos.forEach(function(vi){ base.push(Object.assign({},vi,{iso:iso,countryName:c.name,flag:c.flag,source:'base'})); }); }); });
    return base.concat(user.map(function(v){ var c=T.countries[v.iso]; return Object.assign({},v,{countryName:c?c.name:v.iso,flag:c?c.flag:('https://flagcdn.com/w80/'+v.iso.toLowerCase()+'.png'),source:'user'}); }));
  }
  function renderVideos(){
    var grid=document.getElementById('videos-grid'); if (!grid) return;
    var vids=getAllVideos();
    if (!vids.length){ grid.innerHTML='<div class="videos-empty">⚜ Sin vídeos aún<p>Pega un enlace de YouTube arriba para añadir el primero</p></div>'; populateVideoFilter(); return; }
    var baseCount=vids.filter(function(v){ return v.source==='base'; }).length;
    grid.innerHTML=vids.map(function(v,i){
      var id=getYouTubeId(v.youtubeUrl||v.url||''); if (!id) return '';
      var del=v.source==='user'?'<button class="video-delete" data-idx="'+(i-baseCount)+'" title="Eliminar">✕</button>':'';
      return '<div class="video-card" data-yt="'+id+'"><div class="video-thumb"><img src="'+ytThumb(id)+'" alt="'+v.title+'" loading="lazy"><div class="video-play"><div class="play-icon">▶</div></div></div><div class="video-info"><img class="video-flag" src="'+v.flag+'" alt="'+v.countryName+'"><div class="video-meta"><div class="video-title">'+(v.title||'Vídeo')+'</div><div class="video-country">'+v.countryName+'</div></div>'+del+'</div></div>';
    }).filter(Boolean).join('');
    grid.querySelectorAll('.video-card').forEach(function(c){ c.addEventListener('click',function(e){ if(e.target.classList.contains('video-delete')) return; openVideoModal(c.dataset.yt); }); });
    grid.querySelectorAll('.video-delete').forEach(function(btn){ btn.addEventListener('click',function(e){ e.stopPropagation(); var u=loadVideos(); u.splice(parseInt(btn.dataset.idx),1); saveVideos(u); renderVideos(); }); });
    populateVideoFilter();
  }
  function populateVideoFilter(){
    var sel=document.getElementById('video-country-select'); if (!sel||sel.dataset.populated) return; sel.dataset.populated='1';
    Object.keys(T.countries).sort(function(a,b){ return T.countries[a].name.localeCompare(T.countries[b].name,'es'); }).forEach(function(iso){ var o=document.createElement('option'); o.value=iso; o.textContent=T.countries[iso].name; sel.appendChild(o); });
  }
  function initAddVideoForm(){
    var btn=document.getElementById('add-video-btn'); if (!btn) return;
    btn.addEventListener('click',function(){
      var u=document.getElementById('video-url-input'),ti=document.getElementById('video-title-input'),c=document.getElementById('video-country-select');
      if (!u||!c) return;
      var url=u.value.trim(),iso=c.value,title=(ti&&ti.value.trim())||null;
      if (!url||!iso){ u.focus(); return; }
      var id=getYouTubeId(url); if (!id){ u.style.borderColor='var(--danger)'; setTimeout(function(){ u.style.borderColor=''; },1500); return; }
      var vids=loadVideos(); vids.push({youtubeUrl:url,title:title||'Vídeo '+(vids.length+1),iso:iso,addedAt:new Date().toISOString()}); saveVideos(vids);
      u.value=''; if (ti) ti.value=''; renderVideos();
    });
    var u=document.getElementById('video-url-input'); if (u) u.addEventListener('keydown',function(e){ if(e.key==='Enter') btn.click(); });
  }

  // ── Video modal ───────────────────────────────────────────────────────────
  function openVideoModal(ytId){ var m=document.getElementById('video-modal'); document.getElementById('yt-embed').src='https://www.youtube-nocookie.com/embed/'+ytId+'?autoplay=1&rel=0'; m.classList.add('open'); }
  function closeVideoModal(){ var m=document.getElementById('video-modal'); m.classList.remove('open'); setTimeout(function(){ document.getElementById('yt-embed').src=''; },300); }
  function initVideoModal(){ var m=document.getElementById('video-modal'); if (!m) return; m.addEventListener('click',function(e){ if(e.target===m) closeVideoModal(); }); var b=m.querySelector('.video-modal-close'); if (b) b.addEventListener('click',closeVideoModal); }

  // ── Lightbox ──────────────────────────────────────────────────────────────
  function openLightbox(src){ var lb=document.getElementById('lightbox'); lb.querySelector('img').src=src; lb.classList.add('open'); }
  function closeLightbox(){ var lb=document.getElementById('lightbox'); lb.classList.remove('open'); setTimeout(function(){ lb.querySelector('img').src=''; },300); }
  function initLightbox(){ var lb=document.getElementById('lightbox'); if (!lb) return; lb.addEventListener('click',function(e){ if(e.target===lb) closeLightbox(); }); var b=lb.querySelector('.lightbox-close'); if (b) b.addEventListener('click',closeLightbox); }

  function initPanelClose(){
    var btn=document.querySelector('.panel-close'); if (btn) btn.addEventListener('click',closePanel);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ closeLightbox(); closeVideoModal(); closePanel(); } });
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function(){
    safe(initSplash,          'splash');
    safe(initNav,             'nav');
    safe(initColorPicker,     'color-picker');
    safe(initMap,             'map');
    safe(initConquestBtns,    'conquest-btns');
    safe(initPanelClose,      'panel-close');
    safe(initLightbox,        'lightbox');
    safe(initVideoModal,      'video-modal');
    safe(initAddVideoForm,    'add-video-form');
    safe(initCountryDropdown, 'country-dropdown');
    safe(initScrollToFlags,   'scroll-to-flags');
    safe(renderFlagsStrip,    'flags-strip');
  });

})();
