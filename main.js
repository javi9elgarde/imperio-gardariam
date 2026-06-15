(function () {
  'use strict';

  var T = window.__TRAVELS__;
  var map = null;
  var geoLayers = {};      // { isoCode: L.layer }
  var currentISO = null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn('[Gardariam]', name, e); }
  }

  function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }

  function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

  function getYouTubeId(url) {
    var m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return m ? m[1] : null;
  }

  function ytThumb(id) {
    return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
  }

  // ── Conquest state (localStorage) ────────────────────────────────────────
  var STORAGE_KEY = 'gardariam_conquest_v2';

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
  }

  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  // Derive status from regions array
  function computeStatus(regions) {
    if (!regions || regions.length === 0) return 'full';
    var c = regions.filter(function (r) { return r.conquered; }).length;
    if (c === 0) return 'none';
    if (c === regions.length) return 'full';
    return 'partial';
  }

  // Get merged regions for a country (base data + localStorage overrides)
  function getRegions(iso) {
    var base = (T.countries[iso] && T.countries[iso].regions) ? T.countries[iso].regions : [];
    var saved = (loadState()[iso] && loadState()[iso].regions) ? loadState()[iso].regions : null;
    if (!saved) return base.map(function (r) { return Object.assign({}, r); });
    // Merge: base gives names/ids, saved gives conquered status
    return base.map(function (r) {
      var s = saved.find(function (x) { return x.id === r.id; });
      return Object.assign({}, r, s ? { conquered: s.conquered } : {});
    });
  }

  // Get conquest status for a country
  function getStatus(iso) {
    if (!T.countries[iso]) return 'none';
    var saved = loadState()[iso];
    if (saved && saved.status !== undefined) return saved.status;
    // Derive from base data
    return computeStatus(T.countries[iso].regions);
  }

  // Save conquest status + regions for a country
  function setStatus(iso, status, regions) {
    var s = loadState();
    s[iso] = { status: status, regions: regions };
    saveState(s);
  }

  // ── Map colors ────────────────────────────────────────────────────────────
  var STYLE = {
    none:    { fillColor: '#0f1628', fillOpacity: 1, color: '#1a2540', weight: 0.6 },
    partial: { fillColor: '#5a3c08', fillOpacity: 1, color: '#8a5c12', weight: 1.2 },
    full:    { fillColor: '#c08820', fillOpacity: 1, color: '#f0c030', weight: 1.8 },
  };

  var HOVER = {
    none:    { fillColor: '#182240', color: '#2a3858' },
    partial: { fillColor: '#7a5210', color: '#c08820' },
    full:    { fillColor: '#e0a828', color: '#ffda40' },
  };

  function styleForISO(iso) {
    return Object.assign({}, STYLE[getStatus(iso)]);
  }

  // ── Splash ────────────────────────────────────────────────────────────────
  function initSplash() {
    var el = document.getElementById('splash');
    if (!el) return;
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    }, 4200);
  }

  // ── Nav ───────────────────────────────────────────────────────────────────
  function initNav() {
    var tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var view = tab.dataset.view;
        document.querySelectorAll('.view').forEach(function (v) {
          v.classList.toggle('active', v.id === view + '-view');
        });
        if (view === 'map' && map) setTimeout(function () { map.invalidateSize(); }, 50);
        if (view === 'restaurants') renderRestaurants();
        if (view === 'photos') renderPhotos();
        if (view === 'videos') renderVideos();
      });
    });
    updateStats();
  }

  function updateStats() {
    var count = Object.keys(T.countries).filter(function (iso) {
      return getStatus(iso) !== 'none';
    }).length;
    var el = document.getElementById('stat-countries');
    if (el) el.textContent = count;
  }

  // ── Map init ──────────────────────────────────────────────────────────────
  function initMap() {
    if (!window.L) return;

    map = L.map('map', {
      center: [20, 10], zoom: 2.5,
      minZoom: 1.5, maxZoom: 9,
      zoomControl: true, worldCopyJump: false,
      attributionControl: false,
    });

    // No tile layer — ocean is CSS background

    fetch('lib/countries.geojson')
      .then(function (r) { return r.json(); })
      .then(function (data) { buildGeoLayer(data); })
      .catch(function (e) { console.warn('[Gardariam] GeoJSON failed', e); });
  }

  function buildGeoLayer(data) {
    L.geoJSON(data, {
      style: function (f) {
        var iso = f.properties.ISO_A2;
        return styleForISO(iso);
      },
      onEachFeature: function (f, layer) {
        var iso = f.properties.ISO_A2;
        var name = f.properties.ADMIN || f.properties.NAME || iso;

        geoLayers[iso] = layer;

        // Tooltip
        var status = getStatus(iso);
        var label = name + (status === 'full' ? ' ⚜' : status === 'partial' ? ' ⚔' : '');
        layer.bindTooltip(label, {
          className: 'country-tooltip', sticky: true, direction: 'top', offset: [0, -4],
        });

        layer.on('mouseover', function (e) {
          var st = getStatus(iso);
          e.target.setStyle(Object.assign({}, styleForISO(iso), HOVER[st] || HOVER.none));
        });
        layer.on('mouseout', function (e) {
          e.target.setStyle(styleForISO(iso));
        });
        layer.on('click', function () {
          openPanel(iso, name);
          // Fly to country
          try { map.flyToBounds(layer.getBounds(), { padding: [60,60], duration: 1, maxZoom: 6 }); } catch (_) {}
        });
      },
    }).addTo(map);

    renderHUD();
  }

  function refreshMapStyle(iso) {
    var layer = geoLayers[iso];
    if (!layer) return;
    var st = styleForISO(iso);
    layer.setStyle(st);
    // Update tooltip
    var name = layer.feature && (layer.feature.properties.ADMIN || layer.feature.properties.NAME || iso);
    var status = getStatus(iso);
    var label = name + (status === 'full' ? ' ⚜' : status === 'partial' ? ' ⚔' : '');
    layer.setTooltipContent(label);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function renderHUD() {
    var conquered = Object.keys(T.countries).filter(function (iso) {
      return getStatus(iso) !== 'none';
    }).length;
    var el = document.getElementById('hud-conquered');
    if (el) el.textContent = conquered;
  }

  // ── Detail Panel ─────────────────────────────────────────────────────────
  function openPanel(iso, countryName) {
    currentISO = iso;
    var data = T.countries[iso];
    var panel = document.getElementById('detail-panel');
    panel.setAttribute('aria-hidden', 'false');

    // Hero
    var heroImg = panel.querySelector('.panel-hero img');
    var cover = (data && data.coverPhoto) ? data.coverPhoto : 'https://images.unsplash.com/photo-1457449940276-e8deed18bfff?w=1200&q=80';
    heroImg.src = cover;
    heroImg.alt = countryName;

    // Flag + name
    var flagSrc = (data && data.flag) ? data.flag : ('https://flagcdn.com/w80/' + iso.toLowerCase() + '.png');
    panel.querySelector('.panel-flag-img').src = flagSrc;
    panel.querySelector('.panel-country-name').textContent = countryName;

    // Conquest controls
    renderConquestControls(iso);

    // Regions
    renderRegions(iso);

    // Visits (only if data exists)
    var visitsSection = document.getElementById('panel-visits-section');
    if (data && data.visits && data.visits.length > 0) {
      visitsSection.style.display = '';
      renderVisitDetails(data, 0);
    } else {
      visitsSection.style.display = 'none';
    }

    panel.classList.add('open');
  }

  function closePanel() {
    var panel = document.getElementById('detail-panel');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    currentISO = null;
  }

  function renderConquestControls(iso) {
    var status = getStatus(iso);
    document.querySelectorAll('.conquest-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.status === status);
    });
  }

  function renderRegions(iso) {
    var container = document.getElementById('panel-regions');
    var regions = getRegions(iso);
    if (!regions || regions.length === 0) {
      container.style.display = 'none';
      return;
    }
    container.style.display = '';
    var html = '<div class="section-label">Territorios</div><div class="regions-grid">';
    regions.forEach(function (r) {
      html += '<div class="region-chip' + (r.conquered ? ' conquered' : '') + '" data-id="' + r.id + '">' +
        '<span class="chip-dot"></span>' +
        r.name +
        (r.date ? '<span class="region-date">' + r.date + '</span>' : '') +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.region-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        toggleRegion(iso, chip.dataset.id);
      });
    });
  }

  function toggleRegion(iso, regionId) {
    var regions = getRegions(iso);
    regions = regions.map(function (r) {
      return r.id === regionId ? Object.assign({}, r, { conquered: !r.conquered }) : r;
    });
    var newStatus = computeStatus(regions);
    setStatus(iso, newStatus, regions);
    renderConquestControls(iso);
    renderRegions(iso);
    refreshMapStyle(iso);
    renderHUD();
    updateStats();
  }

  function renderVisitDetails(data, idx) {
    var visit = data.visits[idx];
    if (!visit) return;

    // Meta
    var days = daysBetween(visit.dateFrom, visit.dateTo);
    document.getElementById('panel-visit-meta').innerHTML =
      '<div class="meta-chip gold">📅 ' + fmt(visit.dateFrom) + '</div>' +
      '<div class="meta-chip">⏱ ' + days + ' días</div>' +
      '<div class="meta-chip">📍 ' + visit.region + '</div>';

    // Photos
    var photosEl = document.getElementById('panel-photos');
    if (visit.photos && visit.photos.length > 0) {
      photosEl.className = 'panel-photos';
      photosEl.innerHTML = visit.photos.map(function (src) {
        return '<img src="' + src + '" alt="" loading="lazy">';
      }).join('');
      photosEl.querySelectorAll('img').forEach(function (img) {
        img.addEventListener('click', function () { openLightbox(img.src); });
      });
    } else {
      photosEl.className = '';
      photosEl.innerHTML = '<div class="no-photos">Próximamente · Subiendo fotos</div>';
    }

    // Restaurants
    var restEl = document.getElementById('panel-restaurants');
    restEl.innerHTML = '';
    if (visit.restaurants && visit.restaurants.length > 0) {
      restEl.className = 'panel-restaurant-list';
      visit.restaurants.forEach(function (r) {
        var div = document.createElement('div');
        div.className = 'panel-restaurant';
        div.innerHTML =
          '<div class="pr-header"><div><div class="pr-name">' + r.name + '</div>' +
          '<div class="pr-city">' + r.city + '</div></div>' +
          '<span class="pr-cuisine">' + r.cuisine + '</span></div>' +
          '<div class="pr-stars">' + stars(r.rating) + '</div>' +
          '<div class="pr-note">' + r.note + '</div>';
        restEl.appendChild(div);
      });
    } else {
      restEl.innerHTML = '<p style="color:var(--text-3);font-size:0.75rem">Sin restaurantes registrados aún.</p>';
    }

    // Highlights
    var hlEl = document.getElementById('panel-highlights');
    hlEl.innerHTML = '';
    if (visit.highlights && visit.highlights.length > 0) {
      hlEl.className = 'highlights-list';
      visit.highlights.forEach(function (h) {
        var div = document.createElement('div');
        div.className = 'highlight-item';
        div.textContent = h;
        hlEl.appendChild(div);
      });
    }
  }

  // ── Conquest button events ───────────────────────────────────────────────
  function initConquestBtns() {
    document.querySelectorAll('.conquest-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!currentISO) return;
        var newStatus = btn.dataset.status;
        var regions = getRegions(currentISO).map(function (r) {
          return Object.assign({}, r, { conquered: newStatus === 'full' });
        });
        if (newStatus === 'none') regions = regions.map(function (r) { return Object.assign({}, r, { conquered: false }); });
        setStatus(currentISO, newStatus, regions);
        renderConquestControls(currentISO);
        renderRegions(currentISO);
        refreshMapStyle(currentISO);
        renderHUD();
        updateStats();
      });
    });
  }

  // ── Restaurants view ─────────────────────────────────────────────────────
  var restaurantsRendered = false;

  function getAllRestaurants() {
    var all = [];
    Object.keys(T.countries).forEach(function (iso) {
      var c = T.countries[iso];
      if (!c.visits) return;
      c.visits.forEach(function (visit) {
        if (!visit.restaurants) return;
        visit.restaurants.forEach(function (r) {
          all.push(Object.assign({}, r, {
            isoCode: iso, countryName: c.name, flag: c.flag,
            region: visit.region, visitDate: visit.dateFrom,
          }));
        });
      });
    });
    return all.sort(function (a, b) { return b.rating - a.rating; });
  }

  function renderRestaurants() {
    var grid = document.getElementById('restaurants-grid');
    if (!grid) return;

    var filterISO = document.getElementById('filter-country') ? document.getElementById('filter-country').value : 'all';
    var filterRating = document.getElementById('filter-rating') ? document.getElementById('filter-rating').value : '0';

    var data = getAllRestaurants().filter(function (r) {
      if (filterISO !== 'all' && r.isoCode !== filterISO) return false;
      if (r.rating < parseInt(filterRating)) return false;
      return true;
    });

    if (data.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-3);font-size:0.8rem;padding:24px">Sin resultados con estos filtros.</p>';
      return;
    }

    grid.innerHTML = data.map(function (r) {
      return '<div class="restaurant-card">' +
        '<div class="rc-header">' +
          '<img class="rc-flag" src="' + r.flag + '" alt="' + r.countryName + '">' +
          '<div><div class="rc-country">' + r.countryName + ' · ' + r.region + '</div>' +
          '<div class="rc-name">' + r.name + '</div>' +
          '<div class="rc-city">' + r.city + '</div></div>' +
          '<div class="rc-badges"><span class="rc-cuisine">' + r.cuisine + '</span></div>' +
        '</div>' +
        '<div class="rc-stars">' + stars(r.rating) + '</div>' +
        '<div class="rc-note">' + r.note + '</div>' +
      '</div>';
    }).join('');

    if (!restaurantsRendered) {
      populateCountryFilter();
      restaurantsRendered = true;
    }
  }

  function populateCountryFilter() {
    var sel = document.getElementById('filter-country');
    if (!sel) return;
    Object.keys(T.countries).sort(function (a, b) {
      return T.countries[a].name.localeCompare(T.countries[b].name, 'es');
    }).forEach(function (iso) {
      var opt = document.createElement('option');
      opt.value = iso;
      opt.textContent = T.countries[iso].name;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', renderRestaurants);
    var rSel = document.getElementById('filter-rating');
    if (rSel) rSel.addEventListener('change', renderRestaurants);
  }

  // ── Photos view ───────────────────────────────────────────────────────────
  function renderPhotos() {
    var grid = document.getElementById('photos-grid');
    if (!grid) return;

    var filterISO = document.getElementById('filter-photo-country') ? document.getElementById('filter-photo-country').value : 'all';

    var items = [];
    Object.keys(T.countries).forEach(function (iso) {
      var c = T.countries[iso];
      if (!c.visits) return;
      c.visits.forEach(function (visit) {
        if (!visit.photos) return;
        visit.photos.forEach(function (src) {
          items.push({ src: src, iso: iso, country: c.name, flag: c.flag });
        });
      });
    });

    if (filterISO !== 'all') {
      items = items.filter(function (i) { return i.iso === filterISO; });
    }

    if (items.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-3);font-size:0.8rem;padding:24px">Sin fotos disponibles aún.</p>';
      return;
    }

    grid.innerHTML = items.map(function (item) {
      return '<div class="photo-item">' +
        '<img src="' + item.src + '" alt="' + item.country + '" loading="lazy">' +
        '<div class="photo-overlay">' +
          '<img src="' + item.flag + '" alt="' + item.country + '">' +
          '<span>' + item.country + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    grid.querySelectorAll('.photo-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var img = item.querySelector('img');
        openLightbox(img.src);
      });
    });

    // Populate photo country filter on first render
    populatePhotoFilter();
  }

  function populatePhotoFilter() {
    var sel = document.getElementById('filter-photo-country');
    if (!sel || sel.dataset.populated) return;
    sel.dataset.populated = '1';
    Object.keys(T.countries).sort(function (a, b) {
      return T.countries[a].name.localeCompare(T.countries[b].name, 'es');
    }).forEach(function (iso) {
      var opt = document.createElement('option');
      opt.value = iso;
      opt.textContent = T.countries[iso].name;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', renderPhotos);
  }

  // ── Videos view ───────────────────────────────────────────────────────────
  var VIDEO_STORAGE = 'gardariam_videos_v2';

  function loadVideos() {
    try { return JSON.parse(localStorage.getItem(VIDEO_STORAGE)) || []; } catch (e) { return []; }
  }

  function saveVideos(v) {
    try { localStorage.setItem(VIDEO_STORAGE, JSON.stringify(v)); } catch (e) {}
  }

  function getAllVideos() {
    // Base videos from data.js
    var base = [];
    Object.keys(T.countries).forEach(function (iso) {
      var c = T.countries[iso];
      if (!c.visits) return;
      c.visits.forEach(function (visit) {
        if (!visit.videos) return;
        visit.videos.forEach(function (v) {
          base.push(Object.assign({}, v, { iso: iso, countryName: c.name, flag: c.flag, source: 'base' }));
        });
      });
    });
    // User-added
    var user = loadVideos().map(function (v) {
      var c = T.countries[v.iso];
      return Object.assign({}, v, {
        countryName: c ? c.name : v.iso,
        flag: c ? c.flag : ('https://flagcdn.com/w80/' + v.iso.toLowerCase() + '.png'),
        source: 'user',
      });
    });
    return base.concat(user);
  }

  function renderVideos() {
    var grid = document.getElementById('videos-grid');
    if (!grid) return;

    var videos = getAllVideos();

    if (videos.length === 0) {
      grid.innerHTML = '<div class="videos-empty">⚜ Sin vídeos aún<p>Pega un enlace de YouTube arriba para añadir el primero</p></div>';
      return;
    }

    grid.innerHTML = videos.map(function (v, idx) {
      var id = getYouTubeId(v.youtubeUrl || v.url || '');
      if (!id) return '';
      var thumb = ytThumb(id);
      var deleteBtn = v.source === 'user' ? '<button class="video-delete" data-idx="' + idx + '" title="Eliminar">✕</button>' : '';
      return '<div class="video-card" data-yt="' + id + '">' +
        '<div class="video-thumb">' +
          '<img src="' + thumb + '" alt="' + v.title + '" loading="lazy">' +
          '<div class="video-play"><div class="play-icon">▶</div></div>' +
        '</div>' +
        '<div class="video-info">' +
          '<img class="video-flag" src="' + v.flag + '" alt="' + v.countryName + '">' +
          '<div class="video-meta">' +
            '<div class="video-title">' + (v.title || 'Vídeo') + '</div>' +
            '<div class="video-country">' + v.countryName + '</div>' +
          '</div>' +
          deleteBtn +
        '</div>' +
      '</div>';
    }).filter(Boolean).join('');

    // Click to play
    grid.querySelectorAll('.video-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.classList.contains('video-delete')) return;
        openVideoModal(card.dataset.yt);
      });
    });

    // Delete buttons
    grid.querySelectorAll('.video-delete').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var userVideos = loadVideos();
        // idx in getAllVideos = base.length + user_idx, but we passed the flat idx
        // Re-count: base videos come first, user videos after
        var baseCount = getAllVideos().filter(function (v) { return v.source === 'base'; }).length;
        var userIdx = parseInt(btn.dataset.idx) - baseCount;
        if (userIdx >= 0) {
          userVideos.splice(userIdx, 1);
          saveVideos(userVideos);
          renderVideos();
        }
      });
    });

    // Populate video country filter on first render
    populateVideoFilter();
  }

  function populateVideoFilter() {
    var sel = document.getElementById('video-country-select');
    if (!sel || sel.dataset.populated) return;
    sel.dataset.populated = '1';
    Object.keys(T.countries).sort(function (a, b) {
      return T.countries[a].name.localeCompare(T.countries[b].name, 'es');
    }).forEach(function (iso) {
      var opt = document.createElement('option');
      opt.value = iso;
      opt.textContent = T.countries[iso].name;
      sel.appendChild(opt);
    });
  }

  function initAddVideoForm() {
    var btn = document.getElementById('add-video-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var urlEl = document.getElementById('video-url-input');
      var titleEl = document.getElementById('video-title-input');
      var countryEl = document.getElementById('video-country-select');
      if (!urlEl || !countryEl) return;

      var url = urlEl.value.trim();
      var iso = countryEl.value;
      var title = (titleEl && titleEl.value.trim()) || null;

      if (!url || !iso) { urlEl.focus(); return; }
      var id = getYouTubeId(url);
      if (!id) { urlEl.style.borderColor = 'var(--danger)'; setTimeout(function () { urlEl.style.borderColor = ''; }, 1500); return; }

      var videos = loadVideos();
      videos.push({ youtubeUrl: url, title: title || 'Vídeo ' + (videos.length + 1), iso: iso, addedAt: new Date().toISOString() });
      saveVideos(videos);

      urlEl.value = '';
      if (titleEl) titleEl.value = '';
      renderVideos();
    });

    // Submit on Enter in URL field
    var urlEl = document.getElementById('video-url-input');
    if (urlEl) {
      urlEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') btn.click();
      });
    }
  }

  // ── Video modal ───────────────────────────────────────────────────────────
  function openVideoModal(ytId) {
    var modal = document.getElementById('video-modal');
    var iframe = document.getElementById('yt-embed');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + ytId + '?autoplay=1&rel=0';
    modal.classList.add('open');
  }

  function closeVideoModal() {
    var modal = document.getElementById('video-modal');
    var iframe = document.getElementById('yt-embed');
    modal.classList.remove('open');
    setTimeout(function () { iframe.src = ''; }, 300);
  }

  function initVideoModal() {
    var modal = document.getElementById('video-modal');
    if (!modal) return;
    modal.addEventListener('click', function (e) { if (e.target === modal) closeVideoModal(); });
    var closeBtn = modal.querySelector('.video-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeVideoModal);
  }

  // ── Lightbox ──────────────────────────────────────────────────────────────
  function openLightbox(src) {
    var lb = document.getElementById('lightbox');
    lb.querySelector('img').src = src;
    lb.classList.add('open');
  }

  function initLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    var btn = lb.querySelector('.lightbox-close');
    if (btn) btn.addEventListener('click', closeLightbox);
  }

  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    lb.classList.remove('open');
    setTimeout(function () { lb.querySelector('img').src = ''; }, 300);
  }

  // ── Panel close & keyboard ────────────────────────────────────────────────
  function initPanelClose() {
    var btn = document.querySelector('.panel-close');
    if (btn) btn.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeLightbox(); closeVideoModal(); closePanel(); }
    });
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    safe(initSplash,       'splash');
    safe(initNav,          'nav');
    safe(initMap,          'map');
    safe(initConquestBtns, 'conquest-btns');
    safe(initPanelClose,   'panel-close');
    safe(initLightbox,     'lightbox');
    safe(initVideoModal,   'video-modal');
    safe(initAddVideoForm, 'add-video-form');
  });

})();
