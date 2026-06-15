(function () {
  'use strict';

  /* ── One-time reset to fresh start ─────────────── */
  if (!localStorage.getItem('gardariam_reset_v4')) {
    ['gardariam_conquest_v2','gardariam_paint_v1','gardariam_country_data_v1',
     'gardariam_videos_v2','gardariam_conquest_color'].forEach(function(k){ localStorage.removeItem(k); });
    localStorage.setItem('gardariam_reset_v4','1');
  }

  var T   = window.__TRAVELS__;
  var map = null;
  var geoLayers    = {};   // ISO → Leaflet layer
  var battleMarkers = {};  // ISO → Leaflet marker
  var spainCCAALayer = null;
  var SPAIN_CCAA_ZOOM = 4.25; // zoom threshold to show autonomous communities

  var currentISO   = null; // panel open for this country

  /* ── Paint state ────────────────────────────────── */
  var isPaintMode = false;
  var isEraseMode = false;
  var isPainting  = false;
  var currentBrush = 1;           // 0=small 1=medium 2=large
  var BRUSH_PX = [9, 24, 52];     // canvas lineWidth
  var paintCanvas, paintCtx;
  var activeStroke = [];          // current in-progress points [[lat,lng],…]

  /* ── Stripe animation (partial countries) ────────── */
  var stripeAnimId  = null;
  var stripeOffset  = 0;

  /* ── Helpers ─────────────────────────────────────── */
  function flagUrl(iso){ return 'https://flagcdn.com/w80/'+iso.toLowerCase()+'.png'; }
  function stars(n){ return '★'.repeat(n)+'☆'.repeat(5-n); }
  function fmtDate(d){ return d ? new Date(d+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}) : '—'; }
  function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }
  function getYouTubeId(url){
    var m=url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return m?m[1]:null;
  }
  function ytThumb(id){ return 'https://img.youtube.com/vi/'+id+'/hqdefault.jpg'; }
  function safe(fn,name){ try{ fn(); }catch(e){ console.warn('[Gardariam]',name,e); } }

  /* ── Color ─────────────────────────────────────────── */
  var COLOR_KEY = 'gardariam_conquest_color';
  var DEFAULT_COLOR = '#8b1a2a';
  function getColor(){ return localStorage.getItem(COLOR_KEY)||DEFAULT_COLOR; }
  function setColor(c){ localStorage.setItem(COLOR_KEY,c); }
  function hexRgb(h){ return {r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)}; }
  function lighten(h,a){ var c=hexRgb(h); return 'rgb('+Math.min(c.r+a,255)+','+Math.min(c.g+a,255)+','+Math.min(c.b+a,255)+')'; }
  function rgba(h,a){ var c=hexRgb(h); return 'rgba('+c.r+','+c.g+','+c.b+','+a+')'; }

  /* ── Conquest status ────────────────────────────── */
  var STATE_KEY = 'gardariam_conquest_v2';
  function loadState(){ try{ return JSON.parse(localStorage.getItem(STATE_KEY))||{}; }catch(e){ return {}; } }
  function saveState(s){ try{ localStorage.setItem(STATE_KEY,JSON.stringify(s)); }catch(e){} }
  function getStatus(iso){
    var v=loadState()[iso];
    if (!v) return 'none';
    if (typeof v==='string') return v;
    return v.status||'none';
  }
  function setStatus(iso,st){
    var s=loadState();
    if (st==='none') delete s[iso]; else s[iso]=st;
    saveState(s);
  }

  /* ── Country detail data ────────────────────────── */
  var DATA_KEY = 'gardariam_country_data_v1';
  function loadData(){ try{ return JSON.parse(localStorage.getItem(DATA_KEY))||{}; }catch(e){ return {}; } }
  function saveData(d){ try{ localStorage.setItem(DATA_KEY,JSON.stringify(d)); }catch(e){} }
  function getCountry(iso){ return Object.assign({coverPhoto:'',visits:[],restaurants:[],highlights:[]},loadData()[iso]||{}); }
  function setCountry(iso,obj){ var d=loadData(); d[iso]=obj; saveData(d); }

  /* ── Paint strokes ──────────────────────────────── */
  var PAINT_KEY = 'gardariam_paint_v1';
  function loadPaint(){ try{ return JSON.parse(localStorage.getItem(PAINT_KEY))||{}; }catch(e){ return {}; } }
  function savePaint(d){ try{ localStorage.setItem(PAINT_KEY,JSON.stringify(d)); }catch(e){} }
  function getStrokes(iso){ return loadPaint()[iso]||[]; }
  function addStroke(iso,stroke){
    var d=loadPaint();
    if (!d[iso]) d[iso]=[];
    d[iso].push(stroke);
    savePaint(d);
  }
  function clearStrokes(iso){
    var d=loadPaint(); delete d[iso]; savePaint(d);
  }
  function clearAllStrokes(){
    savePaint({});
  }

  /* ── Map styles ─────────────────────────────────── */
  function styleFor(iso){
    var st=getStatus(iso), col=getColor();
    switch(st){
      case 'full':    return {fillColor:col,  fillOpacity:1,    color:lighten(col,55), weight:2};
      case 'partial': return {fillColor:'#cf8d14', fillOpacity:0.92, color:col, weight:1.8};
      default:        return {fillColor:'#cf8d14', fillOpacity:0.92, color:'#e8aa20', weight:0.8};
    }
  }
  function hoverFor(iso){
    var st=getStatus(iso), col=getColor();
    switch(st){
      case 'full':    return {fillColor:lighten(col,28), color:lighten(col,70)};
      case 'partial': return {fillColor:'#e09a28', color:lighten(col,40)};
      default:        return {fillColor:'#e09a28', color:'#f5bc30'};
    }
  }

  function refreshStyle(iso){
    var l=geoLayers[iso]; if (!l) return;
    l.setStyle(styleFor(iso));
    var name=l.feature&&(l.feature.properties.ADMIN||l.feature.properties.NAME||iso);
    if (l.getTooltip()) l.setTooltipContent(tooltipHtml(iso,name));
  }

  /* ── Tooltip ────────────────────────────────────── */
  function tooltipHtml(iso,name){
    var st=getStatus(iso);
    var badge = st==='full'  ? '<span class="ct-badge ct-full">⚜ Conquistado</span>'
              : st==='partial'? '<span class="ct-badge ct-partial">⚔ Invadiendo</span>'
              :                 '<span class="ct-badge ct-none">Sin conquistar</span>';
    return '<div class="ct-header"><img class="ct-flag" src="'+flagUrl(iso)+'" alt="'+iso+'"><span class="ct-name">'+name+'</span></div>'+badge;
  }

  /* ── Battle markers ─────────────────────────────── */
  function updateBattleMarkers(){
    Object.keys(battleMarkers).forEach(function(iso){ try{ battleMarkers[iso].remove(); }catch(e){} delete battleMarkers[iso]; });
    Object.keys(geoLayers).forEach(function(iso){
      if (getStatus(iso)!=='partial') return;
      var l=geoLayers[iso];
      try{
        var c=l.getBounds().getCenter();
        var icon=L.divIcon({className:'battle-marker-wrap',html:'<div class="battle-marker">⚔</div>',iconSize:[32,32],iconAnchor:[16,16]});
        battleMarkers[iso]=L.marker([c.lat,c.lng],{icon:icon,interactive:false,keyboard:false,zIndexOffset:1500}).addTo(map);
      }catch(e){}
    });
  }

  /* ── Stripe animation (partial polygon border glow) */
  function startStripe(){
    if (stripeAnimId) return;
    function tick(){
      stripeOffset=(stripeOffset+0.18)%10;
      var pat=document.getElementById('conquest-stripe');
      if (pat) pat.setAttribute('patternTransform','rotate(45 0 0) translate('+stripeOffset.toFixed(2)+',0)');
      stripeAnimId=requestAnimationFrame(tick);
    }
    stripeAnimId=requestAnimationFrame(tick);
  }
  function stopStripe(){
    if (stripeAnimId){ cancelAnimationFrame(stripeAnimId); stripeAnimId=null; }
    var pat=document.getElementById('conquest-stripe');
    if (pat) pat.setAttribute('patternTransform','rotate(45 0 0)');
  }
  function syncStripe(){
    var has=Object.keys(geoLayers).some(function(iso){ return getStatus(iso)==='partial'; });
    if (has) startStripe(); else stopStripe();
  }

  /* ── SVG stripe pattern ─────────────────────────── */
  function injectStripe(){
    var svg=document.querySelector('.leaflet-overlay-pane svg');
    if (!svg||svg.querySelector('#gardariam-defs')) return;
    var c=hexRgb(getColor());
    var defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
    defs.id='gardariam-defs';
    defs.innerHTML='<pattern id="conquest-stripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45 0 0)"><rect x="0" y="0" width="5" height="10" fill="rgba('+c.r+','+c.g+','+c.b+',0.65)"/></pattern>';
    svg.insertBefore(defs,svg.firstChild);
  }
  function updateStripeColor(){
    var defs=document.getElementById('gardariam-defs'); if (!defs) return;
    var c=hexRgb(getColor());
    var rect=defs.querySelector('#conquest-stripe rect');
    if (rect) rect.setAttribute('fill','rgba('+c.r+','+c.g+','+c.b+',0.65)');
  }

  /* ════════════════════════════════════════════════
     CANVAS PAINT SYSTEM
  ════════════════════════════════════════════════ */
  function initPaintCanvas(){
    paintCanvas=document.getElementById('paint-canvas');
    if (!paintCanvas) return;
    paintCtx=paintCanvas.getContext('2d');
    syncCanvasSize();
    map.on('move',      redrawCanvas);
    map.on('zoom',      redrawCanvas);
    map.on('zoomstart', function(){ if(paintCtx) paintCtx.clearRect(0,0,paintCanvas.width,paintCanvas.height); });
    map.on('zoomend',   redrawCanvas);
    map.on('resize',    syncCanvasSize);

    paintCanvas.addEventListener('mousedown', onPaintDown);
    paintCanvas.addEventListener('mousemove', onPaintMove);
    document.addEventListener('mouseup', onPaintUp);

    paintCanvas.addEventListener('touchstart', function(e){ e.preventDefault(); onPaintDown(e.touches[0]); },{passive:false});
    paintCanvas.addEventListener('touchmove',  function(e){ e.preventDefault(); onPaintMove(e.touches[0]); },{passive:false});
    document.addEventListener('touchend', onPaintUp);
  }

  function syncCanvasSize(){
    var ct=document.getElementById('map-container');
    paintCanvas.width  = ct.offsetWidth;
    paintCanvas.height = ct.offsetHeight;
    redrawCanvas();
  }

  /* Build a 2D canvas clip path from a country's GeoJSON geometry */
  function applyCountryClip(ctx, iso){
    var layer=geoLayers[iso];
    if (!layer||!layer.feature) return;
    var geom=layer.feature.geometry;
    ctx.beginPath();
    if (geom.type==='Polygon'){
      geomRingsToPath(ctx,geom.coordinates);
    } else if (geom.type==='MultiPolygon'){
      geom.coordinates.forEach(function(poly){ geomRingsToPath(ctx,poly); });
    }
    try{ ctx.clip('evenodd'); }catch(e){ ctx.clip(); }
  }

  function geomRingsToPath(ctx, rings){
    rings.forEach(function(ring){
      if (!ring||ring.length===0) return;
      var f=map.latLngToContainerPoint(L.latLng(ring[0][1],ring[0][0]));
      ctx.moveTo(f.x,f.y);
      for (var i=1;i<ring.length;i++){
        var p=map.latLngToContainerPoint(L.latLng(ring[i][1],ring[i][0]));
        ctx.lineTo(p.x,p.y);
      }
      ctx.closePath();
    });
  }

  function redrawCanvas(){
    if (!paintCtx||!map) return;
    paintCtx.clearRect(0,0,paintCanvas.width,paintCanvas.height);
    var d=loadPaint();
    Object.keys(d).forEach(function(iso){
      if (!d[iso]||d[iso].length===0) return;
      paintCtx.save();
      if (iso!=='_') applyCountryClip(paintCtx,iso);
      d[iso].forEach(function(stroke){ drawStroke(stroke); });
      paintCtx.restore();
    });
    if (isPainting && activeStroke.length>0){
      paintCtx.save();
      if (currentISO && currentISO!=='_') applyCountryClip(paintCtx,currentISO);
      drawStroke({color:getColor(),weight:BRUSH_PX[currentBrush],zoom:map.getZoom(),eraser:isEraseMode,points:activeStroke});
      paintCtx.restore();
    }
  }

  function drawStroke(stroke){
    if (!stroke.points||stroke.points.length===0) return;
    var w=stroke.weight||20;
    if (stroke.zoom!==undefined){
      w=w*Math.pow(2,map.getZoom()-stroke.zoom);
    }
    w=Math.max(1,Math.min(w,600));
    paintCtx.save();
    if (stroke.eraser){
      paintCtx.globalCompositeOperation='destination-out';
      paintCtx.globalAlpha=1;
    } else {
      paintCtx.globalCompositeOperation='source-over';
      paintCtx.globalAlpha=0.82;
      paintCtx.shadowColor=stroke.color||getColor();
      paintCtx.shadowBlur=w*0.25;
    }
    paintCtx.strokeStyle=stroke.color||getColor();
    paintCtx.fillStyle=stroke.color||getColor();
    paintCtx.lineWidth=w;
    paintCtx.lineCap='round';
    paintCtx.lineJoin='round';
    var pts=stroke.points;
    if (pts.length===1){
      var p0=map.latLngToContainerPoint(L.latLng(pts[0][0],pts[0][1]));
      paintCtx.beginPath();
      paintCtx.arc(p0.x,p0.y,w/2,0,Math.PI*2);
      paintCtx.fill();
    } else {
      paintCtx.beginPath();
      var f=map.latLngToContainerPoint(L.latLng(pts[0][0],pts[0][1]));
      paintCtx.moveTo(f.x,f.y);
      for (var i=1;i<pts.length;i++){
        var pi=map.latLngToContainerPoint(L.latLng(pts[i][0],pts[i][1]));
        paintCtx.lineTo(pi.x,pi.y);
      }
      paintCtx.stroke();
    }
    paintCtx.restore();
  }

  function canvasLatLng(e){
    var r=paintCanvas.getBoundingClientRect();
    return map.containerPointToLatLng(L.point(e.clientX-r.left, e.clientY-r.top));
  }

  function onPaintDown(e){
    if (!isPaintMode) return;
    isPainting=true;
    activeStroke=[];
    var ll=canvasLatLng(e);
    activeStroke.push([ll.lat,ll.lng]);
    redrawCanvas();
  }

  function onPaintMove(e){
    if (!isPaintMode) return;
    updateBrushCursor(e.clientX, e.clientY);
    if (!isPainting) return;
    var ll=canvasLatLng(e);
    activeStroke.push([ll.lat,ll.lng]);
    redrawCanvas();
  }

  function onPaintUp(){
    if (!isPainting||activeStroke.length===0) return;
    isPainting=false;
    // Save stroke to current ISO (or global '_')
    var iso=currentISO||'_';
    addStroke(iso,{
      color:getColor(),
      weight:BRUSH_PX[currentBrush],
      zoom:map.getZoom(),
      eraser:isEraseMode,
      points:activeStroke.slice()
    });
    activeStroke=[];
    // If this stroke was on a tracked country, mark as partial
    if (currentISO && !isEraseMode && getStatus(currentISO)==='none'){
      setStatus(currentISO,'partial');
      refreshStyle(currentISO);
      updateBattleMarkers();
      syncStripe();
      updateStats();
      renderFlagsStrip();
    }
    redrawCanvas();
  }

  /* ── Brush cursor UI ────────────────────────────── */
  var brushCursorEl = null;
  function initBrushCursor(){
    brushCursorEl = document.getElementById('brush-cursor');
  }
  function updateBrushCursor(cx,cy){
    if (!brushCursorEl) return;
    var w=BRUSH_PX[currentBrush]*Math.pow(2,map.getZoom()-map.getZoom())||BRUSH_PX[currentBrush]; // always px
    var sz=BRUSH_PX[currentBrush]; // screen px; the actual weight
    brushCursorEl.style.width  = sz+'px';
    brushCursorEl.style.height = sz+'px';
    brushCursorEl.style.left   = cx+'px';
    brushCursorEl.style.top    = cy+'px';
    brushCursorEl.classList.toggle('eraser-mode',isEraseMode);
  }
  function showBrushCursor(){ if (brushCursorEl) brushCursorEl.style.display='block'; }
  function hideBrushCursor(){ if (brushCursorEl) brushCursorEl.style.display='none'; }

  /* ── Paint Mode controls ────────────────────────── */
  function enterPaintMode(iso){
    isPaintMode = true;
    currentISO  = iso||null; // attribute strokes to this country
    var ct=document.getElementById('map-container');
    if (ct) ct.classList.add('paint-mode');
    if (map){ map.dragging.disable(); map.scrollWheelZoom.disable(); }
    var tb=document.getElementById('brush-toolbar');
    if (tb) tb.classList.add('visible');
    showBrushCursor();
    closePanel();
    updateBrushDots();
  }

  function exitPaintMode(){
    isPaintMode=false; isPainting=false; activeStroke=[];
    var ct=document.getElementById('map-container');
    if (ct) ct.classList.remove('paint-mode');
    if (map){ map.dragging.enable(); map.scrollWheelZoom.enable(); }
    var tb=document.getElementById('brush-toolbar');
    if (tb) tb.classList.remove('visible');
    hideBrushCursor();
  }

  function initBrushToolbar(){
    document.querySelectorAll('.brush-sz').forEach(function(btn){
      btn.addEventListener('click',function(){
        currentBrush=parseInt(btn.dataset.size);
        isEraseMode=false;
        updateBrushDots();
      });
    });
    var erBtn=document.getElementById('brush-eraser-btn');
    if (erBtn) erBtn.addEventListener('click',function(){
      isEraseMode=!isEraseMode;
      erBtn.classList.toggle('active',isEraseMode);
      updateBrushDots();
    });
    var exBtn=document.getElementById('brush-exit-btn');
    if (exBtn) exBtn.addEventListener('click',exitPaintMode);
    document.addEventListener('keydown',function(e){ if (e.key==='Escape'&&isPaintMode) exitPaintMode(); });
  }

  function updateBrushDots(){
    var col=getColor();
    document.querySelectorAll('.brush-sz').forEach(function(btn,i){
      btn.classList.toggle('active',i===currentBrush&&!isEraseMode);
    });
    document.querySelectorAll('.bsz-dot').forEach(function(d){ d.style.background=col; });
    var erBtn=document.getElementById('brush-eraser-btn');
    if (erBtn) erBtn.classList.toggle('active',isEraseMode);
  }

  /* ═══════════════════════════════════════════════
     MAP
  ═══════════════════════════════════════════════ */
  function initMap(){
    if (!window.L) return;
    map=L.map('map',{
      center:[20,15],zoom:3,
      minZoom:1,maxZoom:9,
      maxBoundsViscosity:1.0,
      zoomSnap:0.25,
      zoomAnimation:false,
      bounceAtZoomLimits:false,
      zoomControl:true,
      worldCopyJump:false,
      attributionControl:false
    });
    var worldB=L.latLngBounds([[-65,-168],[82,178]]);
    map.fitBounds(worldB,{animate:false,padding:[0,0]});
    map.setMinZoom(map.getZoom());
    map.setMaxBounds(L.latLngBounds([[-78,-182],[86,184]]));
    map.on('resize',function(){ map.fitBounds(worldB,{animate:false,padding:[0,0]}); map.setMinZoom(map.getZoom()); });
    addGraticule();
    fetch('lib/countries.geojson?v=20260616')
      .then(function(r){ return r.json(); })
      .then(function(data){ buildGeoLayer(data); initPhysicalLayers(); addDecorations(); initSpainCCAA(); })
      .catch(function(e){ console.warn('[Gardariam] GeoJSON failed',e); });
  }

  function addGraticule(){
    var lines=[];
    [-180,-150,-120,-90,-60,-30,0,30,60,90,120,150,180].forEach(function(lng){
      lines.push({type:'Feature',geometry:{type:'LineString',coordinates:[[lng,-85],[lng,85]]},properties:{}});
    });
    [-60,-30,0,30,60].forEach(function(lat){
      lines.push({type:'Feature',geometry:{type:'LineString',coordinates:[[-180,lat],[180,lat]]},properties:{}});
    });
    L.geoJSON({type:'FeatureCollection',features:lines},{style:{color:'rgba(200,160,20,0.13)',weight:0.7,opacity:1,fill:false,interactive:false}}).addTo(map);
  }

  /* ── Spain CCAA layer ───────────────────────────── */
  function initSpainCCAA(){
    fetch('lib/spain-ccaa-simple.geojson?v=20260615')
      .then(function(r){ return r.json(); })
      .then(function(data){
        spainCCAALayer=L.geoJSON(data,{
          style:function(){ return {
            fillColor:'#000000',
            fillOpacity:0.001,
            color:'rgba(200,144,40,0.55)',
            weight:1.4,
            dashArray:'4,3',
            interactive:true
          };},
          onEachFeature:function(f,layer){
            var n=f.properties.name||'';
            layer.bindTooltip(
              '<div class="ccaa-tip">'+n+'</div>',
              {className:'ccaa-tip-wrap',sticky:true,direction:'top',offset:[0,-6],opacity:1}
            );
            layer.on('mouseover',function(){ layer.setStyle({color:'rgba(240,192,48,0.85)',weight:2,dashArray:''}); });
            layer.on('mouseout', function(){ layer.setStyle({color:'rgba(200,144,40,0.55)',weight:1.4,dashArray:'4,3'}); });
            layer.on('click',function(){ openPanel('ES','España'); });
          }
        });
        updateCCAAVisibility();
        map.on('zoom', updateCCAAVisibility);
        map.on('zoomend', updateCCAAVisibility);
      })
      .catch(function(e){ console.warn('[Gardariam] CCAA failed',e); });
  }

  function updateCCAAVisibility(){
    if (!spainCCAALayer||!map) return;
    if (map.getZoom()>=SPAIN_CCAA_ZOOM){
      if (!map.hasLayer(spainCCAALayer)) spainCCAALayer.addTo(map);
    } else {
      if (map.hasLayer(spainCCAALayer)) map.removeLayer(spainCCAALayer);
    }
  }

  /* ── Physical layers (rivers + lakes) ────────── */
  function initPhysicalLayers(){
    fetch('lib/rivers.geojson?v=20260616')
      .then(function(r){ return r.json(); })
      .then(function(data){
        L.geoJSON(data,{
          style:function(f){
            var sr=f.properties.scalerank||4;
            return {color:'rgba(80,110,195,0.48)',weight:sr<=2?1.4:0.75,opacity:1,fill:false,interactive:false};
          }
        }).addTo(map);
      }).catch(function(){});
    fetch('lib/lakes.geojson?v=20260616')
      .then(function(r){ return r.json(); })
      .then(function(data){
        L.geoJSON(data,{
          style:function(){
            return {fillColor:'rgba(55,80,160,0.42)',fillOpacity:1,color:'rgba(75,110,195,0.5)',weight:0.6,interactive:false};
          }
        }).addTo(map);
      }).catch(function(){});
  }

  /* ── Terrain SVG decorations ──────────────────── */
  var MTN_SVG='<svg viewBox="0 0 62 28" xmlns="http://www.w3.org/2000/svg" width="62" height="28"><polygon points="31,2 50,26 12,26" fill="rgba(140,108,68,0.22)" stroke="rgba(168,128,76,0.36)" stroke-width="0.9"/><polygon points="16,9 30,26 2,26" fill="rgba(130,100,62,0.17)" stroke="rgba(158,118,72,0.28)" stroke-width="0.7"/><polygon points="46,10 61,26 31,26" fill="rgba(130,100,62,0.17)" stroke="rgba(158,118,72,0.28)" stroke-width="0.7"/><line x1="29" y1="12" x2="33" y2="12" stroke="rgba(220,195,160,0.22)" stroke-width="1.2" stroke-linecap="round"/></svg>';
  var FOR_SVG='<svg viewBox="0 0 46 24" xmlns="http://www.w3.org/2000/svg" width="46" height="24"><polygon points="10,3 18,21 2,21" fill="rgba(18,72,18,0.3)" stroke="rgba(28,92,28,0.42)" stroke-width="0.8"/><polygon points="23,1 33,21 13,21" fill="rgba(18,72,18,0.36)" stroke="rgba(28,92,28,0.48)" stroke-width="0.9"/><polygon points="36,3 45,21 27,21" fill="rgba(18,72,18,0.3)" stroke="rgba(28,92,28,0.42)" stroke-width="0.8"/></svg>';
  var DES_SVG='<svg viewBox="0 0 54 17" xmlns="http://www.w3.org/2000/svg" width="54" height="17"><path d="M2,13 Q11,4 20,13 Q29,22 38,13 Q46,4 52,13" fill="none" stroke="rgba(195,142,42,0.36)" stroke-width="1.3" stroke-linecap="round"/><path d="M5,7 Q13,2 21,7 Q30,12 38,7 Q45,2 51,7" fill="none" stroke="rgba(195,142,42,0.24)" stroke-width="0.9" stroke-linecap="round"/><circle cx="15" cy="5" r="1.2" fill="rgba(200,158,55,0.28)"/><circle cx="37" cy="5" r="1.2" fill="rgba(200,158,55,0.28)"/></svg>';

  function addTerrainDecorations(){
    function mk(lat,lng,html,w,h){
      var icon=L.divIcon({className:'',html:html,iconSize:[w,h],iconAnchor:[w/2,h/2]});
      L.marker([lat,lng],{icon:icon,interactive:false,keyboard:false,zIndexOffset:-3000}).addTo(map);
    }
    // Mountain ranges
    [[46.5,10],[42.7,1.5],[31.5,-3.5],[63,14],[60.5,59],[42.5,44],[29,84.5],
     [5,-74],[-22,-68],[-40,-72.5],[51,-116],[10,37.5],[-29,29.5],[36,69],[42,77]
    ].forEach(function(p){ mk(p[0],p[1],MTN_SVG,62,28); });
    // Forests
    [[-4,-61],[-1,24],[5,110],[1,114],[60,65],[62,122],[56,-95],[65,22]
    ].forEach(function(p){ mk(p[0],p[1],FOR_SVG,46,24); });
    // Deserts
    [[22,-5],[25,22],[22,46],[42,105],[-26,131],[-43,-67],[-24,21],[32,57.5],[26,72],[41,-115]
    ].forEach(function(p){ mk(p[0],p[1],DES_SVG,54,17); });
  }

  var SHIP_SVG='<svg viewBox="0 0 48 42" xmlns="http://www.w3.org/2000/svg" width="48" height="42"><line x1="24" y1="3" x2="24" y2="28" stroke="rgba(210,148,24,0.4)" stroke-width="1.2"/><polygon points="24,5 38,22 10,22" fill="rgba(210,148,24,0.18)" stroke="rgba(210,148,24,0.3)" stroke-width="0.8"/><polygon points="24,10 33,22 15,22" fill="rgba(210,148,24,0.1)"/><path d="M8,28 Q24,36 40,28 L38,28 Q24,34 10,28 Z" fill="rgba(210,148,24,0.28)"/></svg>';
  var SERPENT_SVG='<svg viewBox="0 0 70 30" xmlns="http://www.w3.org/2000/svg" width="70" height="30"><path d="M5,18 Q12,8 22,16 Q32,24 42,14 Q52,4 62,12" fill="none" stroke="rgba(210,148,24,0.25)" stroke-width="2.5" stroke-linecap="round"/><circle cx="63" cy="11" r="4" fill="rgba(210,148,24,0.2)" stroke="rgba(210,148,24,0.3)" stroke-width="0.8"/><line x1="65" y1="9" x2="68" y2="7" stroke="rgba(210,148,24,0.3)" stroke-width="1" stroke-linecap="round"/><line x1="65" y1="9" x2="69" y2="10" stroke="rgba(210,148,24,0.3)" stroke-width="1" stroke-linecap="round"/></svg>';
  var CROSS_SVG='<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" width="22" height="22"><line x1="11" y1="2" x2="11" y2="20" stroke="rgba(210,148,24,0.22)" stroke-width="1.5"/><line x1="2" y1="11" x2="20" y2="11" stroke="rgba(210,148,24,0.22)" stroke-width="1.5"/><circle cx="11" cy="11" r="2.5" fill="rgba(210,148,24,0.28)"/></svg>';

  function addDecorations(){
    function mk(lat,lng,html,w,h){
      var icon=L.divIcon({className:'',html:html,iconSize:[w,h],iconAnchor:[w/2,h/2]});
      L.marker([lat,lng],{icon:icon,interactive:false,keyboard:false,zIndexOffset:-2000}).addTo(map);
    }
    mk(28,-38,SHIP_SVG,48,42); mk(8,168,SHIP_SVG,48,42);
    mk(-15,-25,SERPENT_SVG,70,30); mk(-40,80,SERPENT_SVG,70,30);
    mk(72,-18,CROSS_SVG,22,22); mk(72,90,CROSS_SVG,22,22); mk(-55,-80,CROSS_SVG,22,22);
    addTerrainDecorations();
  }

  function buildGeoLayer(data){
    L.geoJSON(data,{
      style:function(f){ return styleFor(f.properties.ISO_A2); },
      onEachFeature:function(f,layer){
        var iso  = f.properties.ISO_A2;
        var name = f.properties.ADMIN||f.properties.NAME||iso;
        geoLayers[iso]=layer;

        layer.bindTooltip(tooltipHtml(iso,name),{
          className:'country-tooltip-rich',sticky:true,direction:'top',offset:[0,-8],opacity:1
        });

        layer.on('mouseover',function(e){
          if (isPaintMode) return;
          layer.setTooltipContent(tooltipHtml(iso,name));
          e.target.setStyle(Object.assign({},styleFor(iso),hoverFor(iso)));
        });
        layer.on('mouseout',function(e){
          if (!isPaintMode) e.target.setStyle(styleFor(iso));
        });
        layer.on('click',function(){
          if (isPaintMode) return;
          openPanel(iso,name);
          try{ map.flyToBounds(layer.getBounds(),{padding:[60,60],duration:1,maxZoom:6}); }catch(_){}
        });
      }
    }).addTo(map);

    injectStripe();
    initPaintCanvas();
    initBrushCursor();
    renderHUD();
    updateBattleMarkers();
    syncStripe();
  }

  /* ═══════════════════════════════════════════════
     PANEL
  ═══════════════════════════════════════════════ */
  function openPanel(iso,name){
    currentISO=iso;
    var d=getCountry(iso);
    var panel=document.getElementById('detail-panel');

    // Hero
    var heroImg=panel.querySelector('.panel-hero-img');
    heroImg.src=d.coverPhoto||'';
    heroImg.alt=name;
    if (!d.coverPhoto){
      heroImg.style.display='none';
      panel.querySelector('.panel-hero').style.background='linear-gradient(135deg,#0d1322 0%,#1a2440 100%)';
    } else {
      heroImg.style.display='block';
      panel.querySelector('.panel-hero').style.background='';
    }
    panel.querySelector('.panel-flag-img').src=flagUrl(iso);
    panel.querySelector('.panel-flag-img').alt=name;
    panel.querySelector('.panel-country-name').textContent=name;

    // Conquest controls
    renderConquestBtns(iso);

    // Sections
    renderVisits(iso);
    renderRestaurantsPanel(iso);
    renderHighlights(iso);

    // Hero URL bar
    document.getElementById('hero-url-bar').style.display='none';

    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
  }

  function closePanel(){
    var p=document.getElementById('detail-panel');
    p.classList.remove('open');
    p.setAttribute('aria-hidden','true');
    // Don't clear currentISO so paint mode knows which country
  }

  /* ── Conquest buttons ────────────────────────────── */
  function renderConquestBtns(iso){
    var st=getStatus(iso);
    document.querySelectorAll('.conquest-btn').forEach(function(btn){
      btn.classList.toggle('active',btn.dataset.status===st);
    });
  }

  function initConquestBtns(){
    document.querySelectorAll('.conquest-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        if (!currentISO) return;
        var iso=currentISO, st=btn.dataset.status;
        if (st==='partial'){
          // Enter paint mode for this country
          enterPaintMode(iso);
          if (getStatus(iso)==='none'){ setStatus(iso,'partial'); refreshStyle(iso); updateBattleMarkers(); syncStripe(); }
          return;
        }
        if (st==='full'){
          // Fill entire country
          clearStrokes(iso);
          setStatus(iso,'full');
          refreshStyle(iso);
          updateBattleMarkers(); syncStripe();
          redrawCanvas();
        } else {
          // None — clear everything
          clearStrokes(iso);
          setStatus(iso,'none');
          refreshStyle(iso);
          updateBattleMarkers(); syncStripe();
          redrawCanvas();
        }
        renderConquestBtns(iso);
        updateStats();
        renderFlagsStrip();
      });
    });
  }

  /* ── Hero photo ───────────────────────────────────── */
  function initHeroPhoto(){
    var btn=document.getElementById('hero-photo-btn');
    var bar=document.getElementById('hero-url-bar');
    var inp=document.getElementById('hero-url-input');
    var apply=document.getElementById('hero-url-apply');
    var cancel=document.getElementById('hero-url-cancel');
    if (!btn) return;
    btn.addEventListener('click',function(){
      var d=getCountry(currentISO);
      inp.value=d.coverPhoto||'';
      bar.style.display='flex';
      inp.focus();
    });
    apply.addEventListener('click',function(){
      var url=inp.value.trim();
      var d=getCountry(currentISO);
      d.coverPhoto=url;
      setCountry(currentISO,d);
      var heroImg=document.querySelector('.panel-hero-img');
      if (url){ heroImg.src=url; heroImg.style.display='block'; }
      else heroImg.style.display='none';
      bar.style.display='none';
    });
    cancel.addEventListener('click',function(){ bar.style.display='none'; });
    inp.addEventListener('keydown',function(e){ if(e.key==='Enter') apply.click(); if(e.key==='Escape') cancel.click(); });
  }

  /* ═══════════════════════════════════════════════
     VISITS CRUD
  ═══════════════════════════════════════════════ */
  function renderVisits(iso){
    var list=document.getElementById('visits-list'); if (!list) return;
    var d=getCountry(iso);
    if (!d.visits||d.visits.length===0){
      list.innerHTML='<p class="list-empty">Sin expediciones registradas</p>';
    } else {
      list.innerHTML=d.visits.map(function(v,i){ return visitItemHtml(v,i); }).join('');
      list.querySelectorAll('.item-edit-btn').forEach(function(btn){
        btn.addEventListener('click',function(){ showVisitForm(iso,parseInt(btn.dataset.idx)); });
      });
      list.querySelectorAll('.item-del-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
          var d2=getCountry(iso); d2.visits.splice(parseInt(btn.dataset.idx),1); setCountry(iso,d2);
          renderVisits(iso); refreshGlobalViews();
        });
      });
      list.querySelectorAll('.visit-photos img').forEach(function(img){
        img.addEventListener('click',function(){ openLightbox(img.src); });
      });
    }
  }

  function visitItemHtml(v,i){
    var photos=v.photos&&v.photos.length?'<div class="visit-photos">'+v.photos.slice(0,6).map(function(s){ return '<img src="'+s+'" alt="" loading="lazy">'; }).join('')+'</div>':'';
    var dates=(v.dateFrom||'') + (v.dateTo?' → '+fmtDate(v.dateTo):'');
    if (v.dateFrom) dates=fmtDate(v.dateFrom)+(v.dateTo?' → '+fmtDate(v.dateTo)+' · '+daysBetween(v.dateFrom,v.dateTo)+' días':'');
    return '<div class="list-item">'+
      '<div class="visit-region">'+(v.region||'Expedición')+'</div>'+
      '<div class="visit-dates">'+dates+'</div>'+
      (v.note?'<div class="visit-note">'+v.note+'</div>':'')+
      photos+
      '<div class="item-actions"><button class="item-edit-btn" data-idx="'+i+'">Editar</button><button class="item-del-btn" data-idx="'+i+'">Eliminar</button></div>'+
    '</div>';
  }

  function showVisitForm(iso, idx){
    var list=document.getElementById('visits-list'); if (!list) return;
    var d=getCountry(iso);
    var v=(idx!=null&&idx>=0) ? d.visits[idx] : null;
    var formHtml='<div class="inline-form" id="visit-form">'+
      '<label class="ifl">Zona / Título</label><input class="ifi" id="vf-region" value="'+(v&&v.region||'')+'">'+
      '<div class="form-row-2">'+
        '<div><label class="ifl">Fecha inicio</label><input class="ifi" id="vf-from" type="date" value="'+(v&&v.dateFrom||'')+'"></div>'+
        '<div><label class="ifl">Fecha fin</label><input class="ifi" id="vf-to" type="date" value="'+(v&&v.dateTo||'')+'"></div>'+
      '</div>'+
      '<label class="ifl">Notas</label><textarea class="ift" id="vf-note">'+(v&&v.note||'')+'</textarea>'+
      '<label class="ifl">Fotos (URLs, una por línea)</label><textarea class="ift" id="vf-photos">'+(v&&v.photos?v.photos.join('\n'):'')+'</textarea>'+
      '<div class="form-actions">'+
        '<button class="form-save" id="vf-save">Guardar</button>'+
        '<button class="form-cancel" id="vf-cancel">Cancelar</button>'+
      '</div>'+
    '</div>';

    // Insert form: if editing replace item, else prepend
    if (idx!=null&&idx>=0){
      var items=list.querySelectorAll('.list-item');
      if (items[idx]) items[idx].outerHTML=formHtml;
    } else {
      list.insertAdjacentHTML('afterbegin',formHtml);
    }

    document.getElementById('vf-save').addEventListener('click',function(){
      var obj={
        region:document.getElementById('vf-region').value.trim()||'Expedición',
        dateFrom:document.getElementById('vf-from').value||'',
        dateTo:document.getElementById('vf-to').value||'',
        note:document.getElementById('vf-note').value.trim(),
        photos:document.getElementById('vf-photos').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean)
      };
      var d2=getCountry(iso);
      if (!d2.visits) d2.visits=[];
      if (idx!=null&&idx>=0) d2.visits[idx]=obj; else d2.visits.unshift(obj);
      setCountry(iso,d2);
      renderVisits(iso); refreshGlobalViews();
    });
    document.getElementById('vf-cancel').addEventListener('click',function(){ renderVisits(iso); });
  }

  function initAddVisit(){
    var btn=document.getElementById('add-visit-btn');
    if (btn) btn.addEventListener('click',function(){ if (currentISO) showVisitForm(currentISO,null); });
  }

  /* ═══════════════════════════════════════════════
     RESTAURANTS CRUD (panel)
  ═══════════════════════════════════════════════ */
  function renderRestaurantsPanel(iso){
    var list=document.getElementById('restaurants-list'); if (!list) return;
    var d=getCountry(iso);
    if (!d.restaurants||d.restaurants.length===0){
      list.innerHTML='<p class="list-empty">Sin restaurantes registrados</p>';
    } else {
      list.innerHTML=d.restaurants.map(function(r,i){ return restItemHtml(r,i); }).join('');
      list.querySelectorAll('.item-edit-btn').forEach(function(btn){
        btn.addEventListener('click',function(){ showRestForm(iso,parseInt(btn.dataset.idx)); });
      });
      list.querySelectorAll('.item-del-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
          var d2=getCountry(iso); d2.restaurants.splice(parseInt(btn.dataset.idx),1); setCountry(iso,d2);
          renderRestaurantsPanel(iso); refreshGlobalViews();
        });
      });
    }
  }

  function restItemHtml(r,i){
    return '<div class="list-item">'+
      '<div class="rest-name">'+(r.name||'Restaurante')+'</div>'+
      '<div class="rest-meta"><span class="rest-city">'+(r.city||'')+'</span>'+(r.cuisine?'<span class="rest-cuisine">'+r.cuisine+'</span>':'')+'</div>'+
      '<div class="rest-stars">'+stars(r.rating||3)+'</div>'+
      (r.note?'<div class="rest-note">'+r.note+'</div>':'')+
      '<div class="item-actions"><button class="item-edit-btn" data-idx="'+i+'">Editar</button><button class="item-del-btn" data-idx="'+i+'">Eliminar</button></div>'+
    '</div>';
  }

  function showRestForm(iso, idx){
    var list=document.getElementById('restaurants-list'); if (!list) return;
    var d=getCountry(iso);
    var r=(idx!=null&&idx>=0)?d.restaurants[idx]:null;
    var rating=r?r.rating:3;
    var starsHtml='<div class="star-rating" id="rf-stars">';
    for(var n=1;n<=5;n++) starsHtml+='<button type="button" class="star-btn'+(n<=rating?' on':'')+'" data-v="'+n+'">★</button>';
    starsHtml+='</div>';
    var formHtml='<div class="inline-form" id="rest-form">'+
      '<div class="form-row-2">'+
        '<div><label class="ifl">Nombre</label><input class="ifi" id="rf-name" value="'+(r&&r.name||'')+'"></div>'+
        '<div><label class="ifl">Ciudad</label><input class="ifi" id="rf-city" value="'+(r&&r.city||'')+'"></div>'+
      '</div>'+
      '<label class="ifl">Tipo de cocina</label><input class="ifi" id="rf-cuisine" value="'+(r&&r.cuisine||'')+'">'+
      '<label class="ifl">Valoración</label>'+starsHtml+
      '<label class="ifl">Nota</label><textarea class="ift" id="rf-note">'+(r&&r.note||'')+'</textarea>'+
      '<div class="form-actions">'+
        '<button class="form-save" id="rf-save">Guardar</button>'+
        '<button class="form-cancel" id="rf-cancel">Cancelar</button>'+
      '</div>'+
    '</div>';

    if (idx!=null&&idx>=0){
      var items=list.querySelectorAll('.list-item');
      if (items[idx]) items[idx].outerHTML=formHtml;
    } else {
      list.insertAdjacentHTML('afterbegin',formHtml);
    }

    var currentRating=rating;
    document.querySelectorAll('#rf-stars .star-btn').forEach(function(sb){
      sb.addEventListener('click',function(){
        currentRating=parseInt(sb.dataset.v);
        document.querySelectorAll('#rf-stars .star-btn').forEach(function(s,i){ s.classList.toggle('on',i<currentRating); });
      });
    });

    document.getElementById('rf-save').addEventListener('click',function(){
      var obj={
        name:document.getElementById('rf-name').value.trim()||'Restaurante',
        city:document.getElementById('rf-city').value.trim(),
        cuisine:document.getElementById('rf-cuisine').value.trim(),
        rating:currentRating,
        note:document.getElementById('rf-note').value.trim()
      };
      var d2=getCountry(iso);
      if (!d2.restaurants) d2.restaurants=[];
      if (idx!=null&&idx>=0) d2.restaurants[idx]=obj; else d2.restaurants.unshift(obj);
      setCountry(iso,d2);
      renderRestaurantsPanel(iso); refreshGlobalViews();
    });
    document.getElementById('rf-cancel').addEventListener('click',function(){ renderRestaurantsPanel(iso); });
  }

  function initAddRestaurant(){
    var btn=document.getElementById('add-restaurant-btn');
    if (btn) btn.addEventListener('click',function(){ if (currentISO) showRestForm(currentISO,null); });
  }

  /* ═══════════════════════════════════════════════
     HIGHLIGHTS CRUD
  ═══════════════════════════════════════════════ */
  function renderHighlights(iso){
    var list=document.getElementById('highlights-list'); if (!list) return;
    var d=getCountry(iso);
    if (!d.highlights||d.highlights.length===0){
      list.innerHTML='<p class="list-empty">Sin lugares añadidos aún</p>';
    } else {
      list.innerHTML=d.highlights.map(function(h,i){
        return '<div class="highlight-item">'+
          '<span class="highlight-icon">⚔</span>'+
          '<span class="highlight-text">'+h+'</span>'+
          '<button class="highlight-del-btn" data-idx="'+i+'">✕</button>'+
        '</div>';
      }).join('');
      list.querySelectorAll('.highlight-del-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
          var d2=getCountry(iso); d2.highlights.splice(parseInt(btn.dataset.idx),1); setCountry(iso,d2);
          renderHighlights(iso);
        });
      });
    }
  }

  function showHighlightForm(iso){
    var list=document.getElementById('highlights-list'); if (!list) return;
    var formHtml='<div class="inline-form" id="hl-form">'+
      '<label class="ifl">Lugar o momento destacado</label>'+
      '<input class="ifi" id="hl-text" placeholder="Sagrada Família, atardecer en...">'+
      '<div class="form-actions">'+
        '<button class="form-save" id="hl-save">Guardar</button>'+
        '<button class="form-cancel" id="hl-cancel">Cancelar</button>'+
      '</div>'+
    '</div>';
    list.insertAdjacentHTML('afterbegin',formHtml);
    document.getElementById('hl-text').focus();
    document.getElementById('hl-save').addEventListener('click',function(){
      var txt=document.getElementById('hl-text').value.trim(); if (!txt) return;
      var d2=getCountry(iso);
      if (!d2.highlights) d2.highlights=[];
      d2.highlights.unshift(txt);
      setCountry(iso,d2);
      renderHighlights(iso);
    });
    document.getElementById('hl-cancel').addEventListener('click',function(){ renderHighlights(iso); });
    document.getElementById('hl-text').addEventListener('keydown',function(e){ if(e.key==='Enter') document.getElementById('hl-save').click(); });
  }

  function initAddHighlight(){
    var btn=document.getElementById('add-highlight-btn');
    if (btn) btn.addEventListener('click',function(){ if (currentISO) showHighlightForm(currentISO); });
  }

  /* ═══════════════════════════════════════════════
     GLOBAL VIEWS (restaurants, photos tabs)
  ═══════════════════════════════════════════════ */
  function refreshGlobalViews(){
    // Called after data changes; only refresh the active view
    var active=document.querySelector('.nav-tab.active');
    if (!active) return;
    var v=active.dataset.view;
    if (v==='restaurants') renderRestaurantsView();
    if (v==='photos')      renderPhotosView();
  }

  function getAllRestaurantsData(){
    var all=[];
    var d=loadData();
    Object.keys(d).forEach(function(iso){
      var c=d[iso]; if (!c.restaurants) return;
      var name=getCountryName(iso);
      c.restaurants.forEach(function(r){
        all.push(Object.assign({},r,{iso:iso,countryName:name}));
      });
    });
    return all.sort(function(a,b){ return (b.rating||0)-(a.rating||0); });
  }

  function getAllPhotosData(){
    var all=[];
    var d=loadData();
    Object.keys(d).forEach(function(iso){
      var c=d[iso]; if (!c.visits) return;
      var name=getCountryName(iso);
      c.visits.forEach(function(v){
        if (!v.photos) return;
        v.photos.forEach(function(src){ all.push({src:src,iso:iso,country:name}); });
      });
    });
    return all;
  }

  function getCountryName(iso){
    var c=T.allCountries.find(function(x){ return x.code===iso; });
    return c?c.name:iso;
  }

  function renderRestaurantsView(){
    var grid=document.getElementById('restaurants-grid'); if (!grid) return;
    var fi=document.getElementById('filter-country'), fr=document.getElementById('filter-rating');
    var data=getAllRestaurantsData().filter(function(r){
      if (fi&&fi.value!=='all'&&r.iso!==fi.value) return false;
      if (fr&&r.rating<parseInt(fr.value)) return false;
      return true;
    });
    if (!data.length){ grid.innerHTML='<p style="color:var(--text-3);font-size:.8rem;padding:24px">Sin restaurantes registrados. Añade desde la ficha de cada país.</p>'; return; }
    grid.innerHTML=data.map(function(r){
      return '<div class="restaurant-card"><div class="rc-header"><img class="rc-flag" src="'+flagUrl(r.iso)+'" alt="'+r.countryName+'"><div><div class="rc-country">'+r.countryName+'</div><div class="rc-name">'+r.name+'</div><div class="rc-city">'+r.city+'</div></div><div class="rc-badges"><span class="rc-cuisine">'+r.cuisine+'</span></div></div><div class="rc-stars">'+stars(r.rating||3)+'</div><div class="rc-note">'+r.note+'</div></div>';
    }).join('');
    populateRestFilter();
  }
  var restFilterDone=false;
  function populateRestFilter(){
    if (restFilterDone) return; restFilterDone=true;
    var sel=document.getElementById('filter-country'); if (!sel) return;
    T.allCountries.forEach(function(c){ var o=document.createElement('option'); o.value=c.code; o.textContent=c.name; sel.appendChild(o); });
    sel.addEventListener('change',renderRestaurantsView);
    var rs=document.getElementById('filter-rating'); if (rs) rs.addEventListener('change',renderRestaurantsView);
  }

  function renderPhotosView(){
    var grid=document.getElementById('photos-grid'); if (!grid) return;
    var fi=document.getElementById('filter-photo-country');
    var items=getAllPhotosData();
    if (fi&&fi.value!=='all') items=items.filter(function(i){ return i.iso===fi.value; });
    if (!items.length){ grid.innerHTML='<p style="color:var(--text-3);font-size:.8rem;padding:24px">Sin fotos. Añade fotos desde la ficha de cada expedición.</p>'; return; }
    grid.innerHTML=items.map(function(i){
      return '<div class="photo-item"><img src="'+i.src+'" alt="'+i.country+'" loading="lazy"><div class="photo-overlay"><img src="'+flagUrl(i.iso)+'" alt="'+i.country+'"><span>'+i.country+'</span></div></div>';
    }).join('');
    grid.querySelectorAll('.photo-item').forEach(function(item){
      item.addEventListener('click',function(){ openLightbox(item.querySelector('img').src); });
    });
    populatePhotoFilter();
  }
  var photoFilterDone=false;
  function populatePhotoFilter(){
    if (photoFilterDone) return; photoFilterDone=true;
    var sel=document.getElementById('filter-photo-country'); if (!sel) return;
    T.allCountries.forEach(function(c){ var o=document.createElement('option'); o.value=c.code; o.textContent=c.name; sel.appendChild(o); });
    sel.addEventListener('change',renderPhotosView);
  }

  /* ═══════════════════════════════════════════════
     VIDEOS
  ═══════════════════════════════════════════════ */
  var VIDEO_KEY='gardariam_videos_v2';
  function loadVideos(){ try{ return JSON.parse(localStorage.getItem(VIDEO_KEY))||[]; }catch(e){ return []; } }
  function saveVideos(v){ try{ localStorage.setItem(VIDEO_KEY,JSON.stringify(v)); }catch(e){} }

  function renderVideos(){
    var grid=document.getElementById('videos-grid'); if (!grid) return;
    var vids=loadVideos();
    if (!vids.length){ grid.innerHTML='<div class="videos-empty">⚜ Sin vídeos aún<p>Pega un enlace de YouTube arriba para añadir el primero</p></div>'; populateVideoFilter(); return; }
    grid.innerHTML=vids.map(function(v,i){
      var id=getYouTubeId(v.youtubeUrl||v.url||''); if (!id) return '';
      return '<div class="video-card" data-yt="'+id+'"><div class="video-thumb"><img src="'+ytThumb(id)+'" alt="'+v.title+'" loading="lazy"><div class="video-play"><div class="play-icon">▶</div></div></div><div class="video-info"><img class="video-flag" src="'+flagUrl(v.iso||'UN')+'" alt=""><div class="video-meta"><div class="video-title">'+(v.title||'Vídeo')+'</div><div class="video-country">'+getCountryName(v.iso||'')+'</div></div><button class="video-delete" data-idx="'+i+'">✕</button></div></div>';
    }).filter(Boolean).join('');
    grid.querySelectorAll('.video-card').forEach(function(c){ c.addEventListener('click',function(e){ if(e.target.classList.contains('video-delete')) return; openVideoModal(c.dataset.yt); }); });
    grid.querySelectorAll('.video-delete').forEach(function(btn){ btn.addEventListener('click',function(e){ e.stopPropagation(); var u=loadVideos(); u.splice(parseInt(btn.dataset.idx),1); saveVideos(u); renderVideos(); }); });
    populateVideoFilter();
  }
  var videoFilterDone=false;
  function populateVideoFilter(){
    if (videoFilterDone) return; videoFilterDone=true;
    var sel=document.getElementById('video-country-select'); if (!sel) return;
    T.allCountries.forEach(function(c){ var o=document.createElement('option'); o.value=c.code; o.textContent=c.name; sel.appendChild(o); });
  }
  function initAddVideo(){
    var btn=document.getElementById('add-video-btn'); if (!btn) return;
    btn.addEventListener('click',function(){
      var u=document.getElementById('video-url-input'), ti=document.getElementById('video-title-input'), cs=document.getElementById('video-country-select');
      var url=u.value.trim(), iso=cs.value, title=(ti&&ti.value.trim())||null;
      if (!url||!iso){ if(!url) u.style.borderColor='var(--danger)'; setTimeout(function(){ u.style.borderColor=''; },1500); return; }
      var id=getYouTubeId(url); if (!id){ u.style.borderColor='var(--danger)'; setTimeout(function(){ u.style.borderColor=''; },1500); return; }
      var vids=loadVideos(); vids.push({youtubeUrl:url,title:title||'Vídeo '+(vids.length+1),iso:iso,addedAt:new Date().toISOString()}); saveVideos(vids);
      u.value=''; if (ti) ti.value=''; renderVideos();
    });
    var u=document.getElementById('video-url-input'); if (u) u.addEventListener('keydown',function(e){ if(e.key==='Enter') btn.click(); });
  }

  /* ═══════════════════════════════════════════════
     HUD + STATS + FLAGS
  ═══════════════════════════════════════════════ */
  function updateStats(){
    var count=T.allCountries.filter(function(c){ return getStatus(c.code)!=='none'; }).length;
    var el=document.getElementById('stat-countries'); if (el) el.textContent=count;
  }

  function renderHUD(){
    var count=T.allCountries.filter(function(c){ return getStatus(c.code)!=='none'; }).length;
    var el=document.getElementById('hud-conquered'); if (el) el.textContent=count;
  }

  function renderFlagsStrip(){
    var grid=document.getElementById('flags-strip-grid'); if (!grid) return;
    var all=T.allCountries||[];
    var count=all.filter(function(c){ return getStatus(c.code)!=='none'; }).length;
    var ctr=document.getElementById('fs-counter'); if (ctr) ctr.textContent=count+' / '+all.length+' conquistados';
    renderHUD();
    grid.innerHTML=all.map(function(c){
      var vis=getStatus(c.code)!=='none';
      return '<div class="fs-item'+(vis?' visited':'')+'" title="'+c.name+'" data-iso="'+c.code+'">'+
        '<img src="https://flagcdn.com/w40/'+c.code.toLowerCase()+'.png" alt="'+c.name+'" loading="lazy">'+
        (vis?'<div class="fs-dot"></div>':'')+
      '</div>';
    }).join('');
    grid.querySelectorAll('.fs-item').forEach(function(item){
      item.addEventListener('click',function(){
        var iso=item.dataset.iso;
        var newSt=getStatus(iso)==='none'?'full':'none';
        if (newSt==='none') clearStrokes(iso);
        setStatus(iso,newSt);
        refreshStyle(iso);
        updateBattleMarkers(); syncStripe();
        if (newSt==='none') redrawCanvas();
        updateStats(); renderFlagsStrip();
        if (currentISO===iso) renderConquestBtns(iso);
      });
    });
  }

  function initScrollToFlags(){
    var btn=document.getElementById('scroll-to-flags-btn'); if (!btn) return;
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var view=document.getElementById('map-view'), strip=document.getElementById('flags-strip');
      if (view&&strip){ var sr=strip.getBoundingClientRect(),vr=view.getBoundingClientRect(); view.scrollTo({top:view.scrollTop+(sr.top-vr.top),behavior:'smooth'}); }
    });
  }

  function initCountryDropdown(){
    var sel=document.getElementById('country-map-select'); if (!sel) return;
    T.allCountries.slice().sort(function(a,b){ return a.name.localeCompare(b.name,'es'); }).forEach(function(c){
      var o=document.createElement('option'); o.value=c.code; o.textContent=c.name; sel.appendChild(o);
    });
    sel.addEventListener('change',function(){
      var iso=sel.value; if (!iso) return;
      var l=geoLayers[iso];
      var name=getCountryName(iso);
      openPanel(iso,name);
      if (l){ try{ map.flyToBounds(l.getBounds(),{padding:[80,80],duration:1.2,maxZoom:6}); }catch(_){} }
      setTimeout(function(){ sel.value=''; },400);
    });
  }

  /* ── Color picker ─────────────────────────────── */
  function initColorPicker(){
    var inp=document.getElementById('conquest-color-input');
    var sw=document.getElementById('color-swatch');
    if (!inp) return;
    inp.value=getColor();
    if (sw) sw.style.background=getColor();
    inp.addEventListener('input',function(){
      setColor(inp.value);
      if (sw) sw.style.background=inp.value;
      updateStripeColor();
      updateBrushDots();
      Object.keys(geoLayers).forEach(function(iso){ if(getStatus(iso)!=='none') refreshStyle(iso); });
      updateBattleMarkers();
      redrawCanvas();
    });
    if (sw) sw.addEventListener('click',function(){ inp.click(); });
  }

  /* ── Splash ──────────────────────────────────── */
  function initSplash(){
    var el=document.getElementById('splash'); if (!el) return;
    setTimeout(function(){ el.style.opacity='0'; el.style.pointerEvents='none'; },4200);
  }

  /* ── Nav ─────────────────────────────────────── */
  function initNav(){
    var tabs=document.querySelectorAll('.nav-tab');
    tabs.forEach(function(tab){
      tab.addEventListener('click',function(){
        tabs.forEach(function(t){ t.classList.remove('active'); });
        tab.classList.add('active');
        var view=tab.dataset.view;
        document.querySelectorAll('.view').forEach(function(v){ v.classList.toggle('active',v.id===view+'-view'); });
        if (view==='map'&&map) setTimeout(function(){ map.invalidateSize(); },50);
        if (view==='restaurants') renderRestaurantsView();
        if (view==='photos')      renderPhotosView();
        if (view==='videos')      renderVideos();
      });
    });
    updateStats();
  }

  /* ── Modals ──────────────────────────────────── */
  function openVideoModal(ytId){ var m=document.getElementById('video-modal'); document.getElementById('yt-embed').src='https://www.youtube-nocookie.com/embed/'+ytId+'?autoplay=1&rel=0'; m.classList.add('open'); }
  function closeVideoModal(){ var m=document.getElementById('video-modal'); m.classList.remove('open'); setTimeout(function(){ document.getElementById('yt-embed').src=''; },300); }
  function initVideoModal(){ var m=document.getElementById('video-modal'); if (!m) return; m.addEventListener('click',function(e){ if(e.target===m) closeVideoModal(); }); var b=m.querySelector('.video-modal-close'); if(b) b.addEventListener('click',closeVideoModal); }
  function openLightbox(src){ var lb=document.getElementById('lightbox'); lb.querySelector('img').src=src; lb.classList.add('open'); }
  function closeLightbox(){ var lb=document.getElementById('lightbox'); lb.classList.remove('open'); setTimeout(function(){ lb.querySelector('img').src=''; },300); }
  function initLightbox(){ var lb=document.getElementById('lightbox'); if (!lb) return; lb.addEventListener('click',function(e){ if(e.target===lb) closeLightbox(); }); var b=lb.querySelector('.lightbox-close'); if(b) b.addEventListener('click',closeLightbox); }
  function initPanelClose(){
    var btn=document.querySelector('.panel-close'); if (btn) btn.addEventListener('click',closePanel);
    document.addEventListener('keydown',function(e){
      if (e.key==='Escape'){
        if (isPaintMode){ exitPaintMode(); return; }
        closeLightbox(); closeVideoModal(); closePanel();
      }
    });
  }

  /* ═══════════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded',function(){
    safe(initSplash,        'splash');
    safe(initNav,           'nav');
    safe(initColorPicker,   'color');
    safe(initMap,           'map');
    safe(initBrushToolbar,  'brush-toolbar');
    safe(initConquestBtns,  'conquest-btns');
    safe(initHeroPhoto,     'hero-photo');
    safe(initAddVisit,      'add-visit');
    safe(initAddRestaurant, 'add-restaurant');
    safe(initAddHighlight,  'add-highlight');
    safe(initPanelClose,    'panel-close');
    safe(initLightbox,      'lightbox');
    safe(initVideoModal,    'video-modal');
    safe(initAddVideo,      'add-video');
    safe(initCountryDropdown,'dropdown');
    safe(initScrollToFlags, 'flags-scroll');
    safe(renderFlagsStrip,  'flags-strip');
  });

})();
