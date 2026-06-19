"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useAuth } from "@/lib/auth";
import {
  addIconMarker,
  addStroke,
  clearStrokes,
  getConquestColor,
  getIconMarkers,
  getStatus,
  getStrokes,
  removeIconMarker as removeIconMarkerFromStorage,
  setConquestColor,
  setStatus as saveStatus,
} from "@/lib/storage";
import type { ConquestStatus, IconType, PaintStroke } from "@/lib/types";
import { BASE_PATH } from "@/lib/basePath";
import { playFanfare } from "@/lib/sound";
import { getNameEs, getCapitalNameEs } from "@/lib/countryNamesEs";

const BRUSH_PX = [9, 24, 52];
const SPAIN_CCAA_ZOOM = 4.25;
const CAPITALS_ZOOM = 4.5;
const WORLD_BOUNDS = L.latLngBounds([[-65, -168], [82, 178]]);

const ICON_EMOJIS: Record<string, string> = {
  battle: "⚔",
  next: "🏴",
  interest: "⭐",
  danger: "💀",
  explore: "🔭",
  alliance: "🤝",
};

export interface HoverData {
  iso: string;
  name: string;
  status: ConquestStatus;
  x: number;
  y: number;
}

export interface ImperialMapHandle {
  setCountryStatus: (iso: string, status: ConquestStatus) => void;
  enterPaintMode: (iso: string) => void;
  exitPaintMode: () => void;
  getColor: () => string;
  setColor: (hex: string) => void;
  setBrushSize: (index: number) => void;
  toggleEraseMode: () => boolean;
  resetView: () => void;
  setIconMode: (type: string | null) => void;
  redraw: () => void;
}

interface ImperialMapProps {
  onSelectCountry: (iso: string, name: string) => void;
  onConqueredCountChange: (count: number) => void;
  onWorldLoaded: (totalCountries: number) => void;
  onAnnex?: (iso: string, name: string) => void;
  onHover?: (data: HoverData | null) => void;
}

interface SimpleGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}
interface CountryFeature {
  type: "Feature";
  properties: { ISO_A2: string; ADMIN?: string; NAME?: string };
  geometry: SimpleGeometry;
}

function hexRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}
function lighten(hex: string, amt: number) {
  const c = hexRgb(hex);
  return `rgb(${Math.min(c.r + amt, 255)},${Math.min(c.g + amt, 255)},${Math.min(c.b + amt, 255)})`;
}
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// partial: returns same style as none — the canvas paint layer shows the conquest color on top
function styleFor(status: ConquestStatus, color: string): L.PathOptions {
  if (status === "full")
    return { fillColor: color, fillOpacity: 1, color: lighten(color, 40), weight: 1.8 };
  return { fillColor: "#dcc99a", fillOpacity: 1, color: "#9a7a50", weight: 0.8 };
}
function hoverFor(status: ConquestStatus, color: string): L.PathOptions {
  if (status === "full") return { fillColor: lighten(color, 28), color: lighten(color, 70) };
  return { fillColor: "#c8a870", color: "#7a5a30" };
}

function iconHtml(type: string, id: string): string {
  const emoji = ICON_EMOJIS[type] || "📍";
  return `<div class="map-icon-wrap icon-${type}" data-icon-id="${id}" title="Click para eliminar"><div class="map-icon-inner">${emoji}</div></div>`;
}

const ImperialMap = forwardRef<ImperialMapHandle, ImperialMapProps>(
  function ImperialMap(
    { onSelectCountry, onConqueredCountChange, onWorldLoaded, onAnnex, onHover },
    ref,
  ) {
    const { isAdmin } = useAuth();
    const isAdminRef = useRef(isAdmin);
    isAdminRef.current = isAdmin;
    const mapDivRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const s = useRef({
      map: null as L.Map | null,
      geoLayers: {} as Record<string, L.Polygon>,
      geoGeometries: {} as Record<string, SimpleGeometry>,
      iconMarkerLayers: {} as Record<string, L.Marker>,
      allCountries: [] as { iso: string; name: string }[],
      provinceKeys: [] as string[],
      provinceNames: {} as Record<string, string>,
      spainProvinceLayer: null as L.GeoJSON | null,
      capitalsLayer: null as L.GeoJSON | null,
      capitalMarkers: [] as { marker: L.Marker; latlng: L.LatLng; iso: string; pop: number }[],
      refreshCapitals: null as (() => void) | null,
      ctx: null as CanvasRenderingContext2D | null,
      isPaintMode: false,
      isEraseMode: false,
      isPainting: false,
      currentBrush: 1,
      activeStroke: [] as [number, number][],
      currentPaintIso: null as string | null,
      iconMode: null as string | null,
    });

    function recomputeConqueredCount() {
      const count = s.current.allCountries.filter(
        (c) => getStatus(c.iso) !== "none",
      ).length;
      onConqueredCountChange(count);
    }

    function refreshStyle(iso: string) {
      const layer = s.current.geoLayers[iso];
      if (!layer) return;
      const status = getStatus(iso);
      const color = getConquestColor();

      // Spain base layer: hide when provinces are visible
      if (iso === "ES" && s.current.map && s.current.map.getZoom() >= SPAIN_CCAA_ZOOM) {
        layer.setStyle({ fillOpacity: 0, color: "rgba(0,0,0,0)", weight: 0 });
        return;
      }

      // Province layers: parchment fill + gold border
      if (iso.startsWith("ES-")) {
        layer.setStyle({
          ...styleFor(status, color),
          color: "rgba(200,144,40,0.55)",
          dashArray: status === "none" ? "4,3" : "",
          weight: 1.4,
        });
        return;
      }

      layer.setStyle(styleFor(status, color));
    }

    function updateSpainVisibility() {
      const esLayer = s.current.geoLayers["ES"];
      const map = s.current.map;
      if (!esLayer || !map) return;
      if (map.getZoom() >= SPAIN_CCAA_ZOOM) {
        esLayer.setStyle({ fillOpacity: 0, color: "rgba(0,0,0,0)", weight: 0 });
      } else {
        const status = getStatus("ES");
        const color = getConquestColor();
        esLayer.setStyle(styleFor(status, color));
      }
    }

    function spawnAnnexBurst(map: L.Map, lat: number, lng: number, iso: string) {
      const baseIso = iso.includes("-") ? iso.split("-")[0] : iso;
      const icon = L.divIcon({
        className: "",
        html: `<div class="annex-burst"><div class="annex-ring"></div><div class="annex-ring annex-ring-2"></div><div class="annex-flag"><img src="https://flagcdn.com/w40/${baseIso.toLowerCase()}.png" alt=""/></div></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const marker = L.marker([lat, lng], {
        icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 2000,
      }).addTo(map);
      setTimeout(() => marker.remove(), 1900);
    }

    function triggerAnnexation(iso: string) {
      const layer = s.current.geoLayers[iso];
      const map = s.current.map;
      if (layer && map) {
        try {
          const c = layer.getBounds().getCenter();
          spawnAnnexBurst(map, c.lat, c.lng, iso);
        } catch {
          /* noop */
        }
      }
      playFanfare();
      const name =
        s.current.allCountries.find((c) => c.iso === iso)?.name ??
        s.current.provinceNames[iso] ??
        iso;
      onAnnex?.(iso, name);
    }

    /* ── Icon markers ───────────────────────────────── */
    function renderIconMarker(map: L.Map, id: string, type: string, lat: number, lng: number) {
      const icon = L.divIcon({
        className: "",
        html: iconHtml(type, id),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      const marker = L.marker([lat, lng], {
        icon,
        interactive: true,
        keyboard: false,
        zIndexOffset: 1500,
      }).addTo(map);
      marker.on("click", (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (!isAdminRef.current) return;
        marker.remove();
        delete s.current.iconMarkerLayers[id];
        removeIconMarkerFromStorage(id);
      });
      s.current.iconMarkerLayers[id] = marker;
    }

    function placeIconMarker(map: L.Map, lat: number, lng: number, type: string) {
      const id = `${type}-${Date.now()}`;
      addIconMarker({ id, type: type as IconType, lat, lng });
      renderIconMarker(map, id, type, lat, lng);
    }

    function loadIconMarkers(map: L.Map) {
      getIconMarkers().forEach(({ id, type, lat, lng }) => {
        renderIconMarker(map, id, type, lat, lng);
      });
    }

    /* ── Paint canvas ─────────────────────────────── */
    function geomRingsToPath(ctx: CanvasRenderingContext2D, map: L.Map, rings: number[][][]) {
      rings.forEach((ring) => {
        if (!ring || ring.length === 0) return;
        const f = map.latLngToContainerPoint(L.latLng(ring[0][1], ring[0][0]));
        ctx.moveTo(f.x, f.y);
        for (let i = 1; i < ring.length; i++) {
          const p = map.latLngToContainerPoint(L.latLng(ring[i][1], ring[i][0]));
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
      });
    }
    function applyCountryClip(ctx: CanvasRenderingContext2D, map: L.Map, iso: string) {
      const geom = s.current.geoGeometries[iso];
      if (!geom) return;
      ctx.beginPath();
      if (geom.type === "Polygon") {
        geomRingsToPath(ctx, map, geom.coordinates as number[][][]);
      } else {
        (geom.coordinates as number[][][][]).forEach((poly) => geomRingsToPath(ctx, map, poly));
      }
      try {
        ctx.clip("evenodd");
      } catch {
        ctx.clip();
      }
    }

    function drawStroke(stroke: PaintStroke) {
      const ctx = s.current.ctx;
      const map = s.current.map;
      if (!ctx || !map || stroke.points.length === 0) return;
      let w = stroke.weight || 20;
      w = w * Math.pow(2, map.getZoom() - stroke.zoom);
      w = Math.max(1, Math.min(w, 600));
      ctx.save();
      if (stroke.eraser) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const pts = stroke.points;
      if (pts.length === 1) {
        const p0 = map.latLngToContainerPoint(L.latLng(pts[0][0], pts[0][1]));
        ctx.beginPath();
        ctx.arc(p0.x, p0.y, w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        const f = map.latLngToContainerPoint(L.latLng(pts[0][0], pts[0][1]));
        ctx.moveTo(f.x, f.y);
        for (let i = 1; i < pts.length; i++) {
          const p = map.latLngToContainerPoint(L.latLng(pts[i][0], pts[i][1]));
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    function redrawCanvas() {
      const ctx = s.current.ctx;
      const map = s.current.map;
      const canvas = canvasRef.current;
      if (!ctx || !map || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Regular country paint strokes
      s.current.allCountries.forEach((c) => {
        const strokes = getStrokes(c.iso);
        if (strokes.length === 0) return;
        ctx.save();
        applyCountryClip(ctx, map, c.iso);
        strokes.forEach(drawStroke);
        ctx.restore();
      });

      // Province conquest state on canvas.
      // At low zoom (provinces GeoJSON hidden): canvas fills "full" provinces with
      // 100% opaque conquest color so they're visible over the parchment ES layer.
      // At high zoom (provinces GeoJSON visible): GeoJSON handles "full" fill —
      // canvas only draws paint strokes, avoiding double-render with the SVG filter.
      const provincesVisible = map.getZoom() >= SPAIN_CCAA_ZOOM;
      s.current.provinceKeys.forEach((iso) => {
        const status = getStatus(iso);
        const strokes = getStrokes(iso);
        const needsFill = status === "full" && !provincesVisible;
        if (!needsFill && strokes.length === 0) return;
        ctx.save();
        applyCountryClip(ctx, map, iso);
        if (needsFill) {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = getConquestColor();
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        strokes.forEach(drawStroke);
        ctx.restore();
      });
      if (s.current.isPainting && s.current.activeStroke.length > 0) {
        ctx.save();
        if (s.current.currentPaintIso) applyCountryClip(ctx, map, s.current.currentPaintIso);
        drawStroke({
          color: getConquestColor(),
          weight: BRUSH_PX[s.current.currentBrush],
          zoom: map.getZoom(),
          eraser: s.current.isEraseMode,
          points: s.current.activeStroke,
        });
        ctx.restore();
      }
    }

    function syncCanvasSize() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      redrawCanvas();
    }

    function canvasLatLng(clientX: number, clientY: number): L.LatLng {
      const canvas = canvasRef.current!;
      const map = s.current.map!;
      const r = canvas.getBoundingClientRect();
      return map.containerPointToLatLng(L.point(clientX - r.left, clientY - r.top));
    }

    function updateBrushCursor(clientX: number, clientY: number) {
      const el = cursorRef.current;
      if (!el) return;
      const sz = BRUSH_PX[s.current.currentBrush];
      el.style.width = `${sz}px`;
      el.style.height = `${sz}px`;
      el.style.left = `${clientX}px`;
      el.style.top = `${clientY}px`;
      el.classList.toggle("eraser-mode", s.current.isEraseMode);
    }

    function onPaintDown(clientX: number, clientY: number) {
      if (!s.current.isPaintMode) return;
      s.current.isPainting = true;
      s.current.activeStroke = [];
      const ll = canvasLatLng(clientX, clientY);
      s.current.activeStroke.push([ll.lat, ll.lng]);
      redrawCanvas();
    }
    function onPaintMove(clientX: number, clientY: number) {
      if (!s.current.isPaintMode) return;
      updateBrushCursor(clientX, clientY);
      if (!s.current.isPainting) return;
      const ll = canvasLatLng(clientX, clientY);
      s.current.activeStroke.push([ll.lat, ll.lng]);
      redrawCanvas();
    }
    function onPaintUp() {
      if (!s.current.isPainting || s.current.activeStroke.length === 0) return;
      s.current.isPainting = false;
      const iso = s.current.currentPaintIso || "_";
      const map = s.current.map!;
      addStroke(iso, {
        color: getConquestColor(),
        weight: BRUSH_PX[s.current.currentBrush],
        zoom: map.getZoom(),
        eraser: s.current.isEraseMode,
        points: s.current.activeStroke.slice(),
      });
      s.current.activeStroke = [];
      if (
        s.current.currentPaintIso &&
        !s.current.isEraseMode &&
        getStatus(s.current.currentPaintIso) === "none"
      ) {
        saveStatus(s.current.currentPaintIso, "partial");
        refreshStyle(s.current.currentPaintIso);
        recomputeConqueredCount();
        s.current.refreshCapitals?.();
        triggerAnnexation(s.current.currentPaintIso);
      }
      redrawCanvas();
    }

    /* ── Imperative handle ───────────────────────────── */
    useImperativeHandle(ref, () => ({
      redraw() {
        Object.keys(s.current.geoLayers).forEach((iso) => refreshStyle(iso));
        recomputeConqueredCount();
        redrawCanvas();
        s.current.refreshCapitals?.();
        const map = s.current.map;
        if (map) {
          Object.values(s.current.iconMarkerLayers).forEach((m) => m.remove());
          s.current.iconMarkerLayers = {};
          loadIconMarkers(map);
        }
      },
      setCountryStatus(iso, status) {
        const wasNone = getStatus(iso) === "none";
        if (status === "none") clearStrokes(iso);
        saveStatus(iso, status);
        refreshStyle(iso);
        recomputeConqueredCount();
        redrawCanvas();
        s.current.refreshCapitals?.();
        if (wasNone && status !== "none") triggerAnnexation(iso);
      },
      enterPaintMode(iso) {
        s.current.isPaintMode = true;
        s.current.currentPaintIso = iso;
        containerRef.current?.classList.add("paint-mode");
        const canvas = canvasRef.current;
        if (canvas) canvas.style.pointerEvents = "all";
        if (cursorRef.current) cursorRef.current.style.display = "block";
        s.current.map?.dragging.disable();
        s.current.map?.scrollWheelZoom.disable();
      },
      exitPaintMode() {
        s.current.isPaintMode = false;
        s.current.isPainting = false;
        s.current.activeStroke = [];
        containerRef.current?.classList.remove("paint-mode");
        const canvas = canvasRef.current;
        if (canvas) canvas.style.pointerEvents = "none";
        if (cursorRef.current) cursorRef.current.style.display = "none";
        s.current.map?.dragging.enable();
        s.current.map?.scrollWheelZoom.enable();
      },
      getColor() {
        return getConquestColor();
      },
      setColor(hex) {
        setConquestColor(hex);
        Object.keys(s.current.geoLayers).forEach((iso) => {
          if (getStatus(iso) !== "none") refreshStyle(iso);
        });
        redrawCanvas();
      },
      setBrushSize(index) {
        s.current.currentBrush = index;
        s.current.isEraseMode = false;
      },
      toggleEraseMode() {
        s.current.isEraseMode = !s.current.isEraseMode;
        return s.current.isEraseMode;
      },
      resetView() {
        s.current.map?.fitBounds(WORLD_BOUNDS, { animate: true, padding: [0, 0] });
      },
      setIconMode(type: string | null) {
        s.current.iconMode = type;
      },
    }));

    /* ── Mount ────────────────────────────────────────── */
    useEffect(() => {
      if (!mapDivRef.current) return;

      s.current.geoLayers = {};
      s.current.geoGeometries = {};
      s.current.iconMarkerLayers = {};
      s.current.allCountries = [];
      s.current.provinceKeys = [];
      s.current.provinceNames = {};
      s.current.spainProvinceLayer = null;
      s.current.capitalsLayer = null;

      let disposed = false;

      const map = L.map(mapDivRef.current, {
        center: [20, 15],
        zoom: 3,
        minZoom: 1,
        maxZoom: 9,
        maxBoundsViscosity: 1.0,
        zoomSnap: 0.25,
        zoomAnimation: false,
        zoomControl: true,
        worldCopyJump: false,
        attributionControl: false,
      });
      s.current.map = map;

      map.fitBounds(WORLD_BOUNDS, { animate: false, padding: [0, 0] });
      map.setMinZoom(map.getZoom());
      map.setMaxBounds(L.latLngBounds([-78, -182], [86, 184]));

      const canvas = canvasRef.current;
      if (canvas) s.current.ctx = canvas.getContext("2d");
      syncCanvasSize();

      map.on("move", redrawCanvas);
      map.on("zoom", redrawCanvas);
      map.on("zoomstart", () => {
        const c = canvasRef.current;
        if (s.current.ctx && c) s.current.ctx.clearRect(0, 0, c.width, c.height);
      });
      map.on("zoomend", redrawCanvas);
      map.on("resize", syncCanvasSize);

      // Icon placement on map click
      map.on("click", (e: L.LeafletMouseEvent) => {
        if (!s.current.iconMode) return;
        placeIconMarker(map, e.latlng.lat, e.latlng.lng, s.current.iconMode);
      });

      function pointerDown(e: MouseEvent) { onPaintDown(e.clientX, e.clientY); }
      function pointerMove(e: MouseEvent) { onPaintMove(e.clientX, e.clientY); }
      function pointerUp() { onPaintUp(); }
      canvas?.addEventListener("mousedown", pointerDown);
      canvas?.addEventListener("mousemove", pointerMove);
      document.addEventListener("mouseup", pointerUp);

      function touchStart(e: TouchEvent) {
        e.preventDefault();
        const t = e.touches[0];
        if (t) onPaintDown(t.clientX, t.clientY);
      }
      function touchMove(e: TouchEvent) {
        e.preventDefault();
        const t = e.touches[0];
        if (t) onPaintMove(t.clientX, t.clientY);
      }
      canvas?.addEventListener("touchstart", touchStart, { passive: false });
      canvas?.addEventListener("touchmove", touchMove, { passive: false });
      document.addEventListener("touchend", pointerUp);

      const resizeObserver = new ResizeObserver(() => syncCanvasSize());
      if (containerRef.current) resizeObserver.observe(containerRef.current);

      async function loadEverything() {
        // World countries
        const countriesRes = await fetch(`${BASE_PATH}/geo/countries.geojson`);
        const countriesData = await countriesRes.json();
        if (disposed) return;

        const layerGroup = L.geoJSON(countriesData, {
          style: (f) => styleFor(getStatus(f!.properties.ISO_A2), getConquestColor()),
          onEachFeature: (f, layer) => {
            const feature = f as unknown as CountryFeature;
            const iso = feature.properties.ISO_A2;
            const fallback = feature.properties.ADMIN || feature.properties.NAME || iso;
            const name = getNameEs(iso, fallback);
            s.current.geoLayers[iso] = layer as L.Polygon;
            s.current.geoGeometries[iso] = feature.geometry;
            s.current.allCountries.push({ iso, name });

            layer.on("mouseover", (e: L.LeafletMouseEvent) => {
              if (s.current.isPaintMode) return;
              const oe = e.originalEvent as MouseEvent;
              onHover?.({ iso, name, status: getStatus(iso), x: oe.clientX, y: oe.clientY });
              const base = styleFor(getStatus(iso), getConquestColor());
              (layer as L.Path).setStyle({ ...base, ...hoverFor(getStatus(iso), getConquestColor()) });
            });
            layer.on("mousemove", (e: L.LeafletMouseEvent) => {
              if (s.current.isPaintMode) return;
              const oe = e.originalEvent as MouseEvent;
              onHover?.({ iso, name, status: getStatus(iso), x: oe.clientX, y: oe.clientY });
            });
            layer.on("mouseout", () => {
              if (s.current.isPaintMode) return;
              onHover?.(null);
              (layer as L.Path).setStyle(styleFor(getStatus(iso), getConquestColor()));
            });
            layer.on("click", (e: L.LeafletMouseEvent) => {
              if (s.current.isPaintMode) return;
              if (s.current.iconMode) return;
              // When Spain provinces visible, don't open Spain panel
              if (iso === "ES" && map.getZoom() >= SPAIN_CCAA_ZOOM) return;
              L.DomEvent.stopPropagation(e);
              onSelectCountry(iso, name);
              try {
                map.flyToBounds((layer as L.Polygon).getBounds(), { padding: [60, 60], duration: 1, maxZoom: 6 });
              } catch {
                /* noop */
              }
            });
          },
        });
        layerGroup.addTo(map);

        onWorldLoaded(s.current.allCountries.length);
        recomputeConqueredCount();
        redrawCanvas();
        loadIconMarkers(map);

        // Spain provinces (zoom-dependent, each independently conquerable)
        fetch(`${BASE_PATH}/geo/spain-ccaa-simple.geojson`)
          .then((r) => r.json())
          .then((data) => {
            if (disposed) return;
            const spainProvinceLayer = L.geoJSON(data, {
              style: (f) => {
                const pname = f?.properties?.name || "";
                const piso = `ES-${slugify(pname)}`;
                const status = getStatus(piso);
                const color = getConquestColor();
                return {
                  ...styleFor(status, color),
                  color: "rgba(200,144,40,0.55)",
                  dashArray: status === "none" ? "4,3" : "",
                  weight: 1.4,
                };
              },
              onEachFeature: (f, layer) => {
                const pname: string = f.properties?.name || "";
                const piso = `ES-${slugify(pname)}`;
                s.current.geoLayers[piso] = layer as L.Polygon;
                s.current.geoGeometries[piso] = f.geometry as SimpleGeometry;
                s.current.provinceKeys.push(piso);
                s.current.provinceNames[piso] = pname;

                layer.on("mouseover", (e: L.LeafletMouseEvent) => {
                  if (s.current.isPaintMode) return;
                  const oe = e.originalEvent as MouseEvent;
                  const status = getStatus(piso);
                  onHover?.({ iso: piso, name: pname, status, x: oe.clientX, y: oe.clientY });
                  (layer as L.Path).setStyle({ color: "rgba(240,192,48,0.9)", weight: 2, dashArray: "" });
                });
                layer.on("mousemove", (e: L.LeafletMouseEvent) => {
                  if (s.current.isPaintMode) return;
                  const oe = e.originalEvent as MouseEvent;
                  const status = getStatus(piso);
                  onHover?.({ iso: piso, name: pname, status, x: oe.clientX, y: oe.clientY });
                });
                layer.on("mouseout", () => {
                  if (s.current.isPaintMode) return;
                  onHover?.(null);
                  const status = getStatus(piso);
                  const color = getConquestColor();
                  (layer as L.Path).setStyle({
                    ...styleFor(status, color),
                    color: "rgba(200,144,40,0.55)",
                    dashArray: status === "none" ? "4,3" : "",
                    weight: 1.4,
                  });
                });
                layer.on("click", (e: L.LeafletMouseEvent) => {
                  if (s.current.isPaintMode) return;
                  if (s.current.iconMode) return;
                  L.DomEvent.stopPropagation(e);
                  onSelectCountry(piso, pname);
                });
              },
            });
            s.current.spainProvinceLayer = spainProvinceLayer;

            const updateProvinceVisibility = () => {
              if (!s.current.spainProvinceLayer) return;
              if (map.getZoom() >= SPAIN_CCAA_ZOOM) {
                if (!map.hasLayer(s.current.spainProvinceLayer)) s.current.spainProvinceLayer.addTo(map);
                updateSpainVisibility();
              } else {
                if (map.hasLayer(s.current.spainProvinceLayer)) map.removeLayer(s.current.spainProvinceLayer);
                updateSpainVisibility();
              }
            };
            updateProvinceVisibility();
            map.on("zoom", updateProvinceVisibility);
            map.on("zoomend", updateProvinceVisibility);
          })
          .catch(() => {});

        // Capitals (zoom-dependent)
        fetch(`${BASE_PATH}/geo/capitals.geojson`)
          .then((r) => r.json())
          .then((data) => {
            if (disposed) return;
            const capitalMarkers: { marker: L.Marker; latlng: L.LatLng; iso: string; pop: number }[] = [];
            const capitalsLayer = L.geoJSON(data, {
              pointToLayer: (f, latlng) => {
                const name = getCapitalNameEs(f.properties?.name || "");
                const iso = (f.properties?.iso2 || "").toUpperCase();
                const pop = Number(f.properties?.pop) || 0;
                const icon = L.divIcon({
                  className: "",
                  html: `<div class="cap-mk"><div class="cap-dot"></div><span class="cap-nm">${name}</span></div>`,
                  iconSize: [0, 0],
                  iconAnchor: [3, 3],
                });
                const marker = L.marker(latlng, {
                  icon,
                  interactive: false,
                  keyboard: false,
                  zIndexOffset: 800,
                });
                capitalMarkers.push({ marker, latlng, iso, pop });
                return marker;
              },
            });
            s.current.capitalsLayer = capitalsLayer;
            s.current.capitalMarkers = capitalMarkers;
            s.current.refreshCapitals = () => declutter();

            // Bigger/more populated capitals win when two labels overlap on screen
            // (e.g. Rome vs. Vatican City, only ~2km apart)
            const byPopDesc = [...capitalMarkers].sort((a, b) => b.pop - a.pop);

            function declutter() {
              const accepted: L.Point[] = [];
              byPopDesc.forEach(({ marker, latlng, iso }) => {
                const inner = marker.getElement()?.querySelector<HTMLElement>(".cap-mk");
                if (!inner) return;
                inner.classList.toggle("is-conquered", getStatus(iso) !== "none");

                const pt = map.latLngToContainerPoint(latlng);
                const collision = accepted.some((a) => pt.distanceTo(a) < 26);
                if (collision) {
                  // Nudge this label clear of the one it would otherwise sit on top of
                  inner.style.transform = "translate(11px, 10px)";
                  accepted.push(pt.add([11, 10]));
                } else {
                  inner.style.transform = "";
                  accepted.push(pt);
                }
              });
            }

            const update = () => {
              if (!s.current.capitalsLayer) return;
              if (map.getZoom() >= CAPITALS_ZOOM) {
                if (!map.hasLayer(s.current.capitalsLayer)) s.current.capitalsLayer.addTo(map);
                declutter();
              } else if (map.hasLayer(s.current.capitalsLayer)) {
                map.removeLayer(s.current.capitalsLayer);
              }
            };
            update();
            map.on("zoom", update);
            map.on("zoomend", update);
          })
          .catch(() => {});
      }

      loadEverything();

      return () => {
        disposed = true;
        canvas?.removeEventListener("mousedown", pointerDown);
        canvas?.removeEventListener("mousemove", pointerMove);
        document.removeEventListener("mouseup", pointerUp);
        canvas?.removeEventListener("touchstart", touchStart);
        canvas?.removeEventListener("touchmove", touchMove);
        document.removeEventListener("touchend", pointerUp);
        resizeObserver.disconnect();
        map.remove();
        s.current.map = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div ref={containerRef} className="map-root absolute inset-0 overflow-hidden">
        <div ref={mapDivRef} className="absolute inset-0" />
        <svg
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 411,
            opacity: 0.28,
            mixBlendMode: "soft-light",
            pointerEvents: "none",
          }}
        >
          <filter id="map-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#map-grain)" />
        </svg>
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ zIndex: 420, pointerEvents: "none" }}
        />
        <div ref={cursorRef} id="brush-cursor" />
      </div>
    );
  },
);

export default ImperialMap;
