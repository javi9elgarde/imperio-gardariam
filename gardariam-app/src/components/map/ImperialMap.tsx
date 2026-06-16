"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  addStroke,
  clearStrokes,
  getConquestColor,
  getStatus,
  getStrokes,
  setConquestColor,
  setStatus as saveStatus,
} from "@/lib/storage";
import type { ConquestStatus, PaintStroke } from "@/lib/types";
import { BASE_PATH } from "@/lib/basePath";
import { playFanfare } from "@/lib/sound";
import { getNameEs, getCapitalNameEs } from "@/lib/countryNamesEs";

const BRUSH_PX = [9, 24, 52];
const SPAIN_CCAA_ZOOM = 4.25;
const CAPITALS_ZOOM = 4.5;

export interface ImperialMapHandle {
  setCountryStatus: (iso: string, status: ConquestStatus) => void;
  enterPaintMode: (iso: string) => void;
  exitPaintMode: () => void;
  getColor: () => string;
  setColor: (hex: string) => void;
  setBrushSize: (index: number) => void;
  toggleEraseMode: () => boolean;
  toggleImperialView: () => boolean;
}

interface ImperialMapProps {
  onSelectCountry: (iso: string, name: string) => void;
  onConqueredCountChange: (count: number) => void;
  onWorldLoaded: (totalCountries: number) => void;
  onAnnex?: (iso: string, name: string) => void;
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

function styleFor(status: ConquestStatus, color: string): L.PathOptions {
  if (status === "full")
    return { fillColor: color, fillOpacity: 1, color: lighten(color, 40), weight: 1.8 };
  if (status === "partial")
    return { fillColor: "#b85c28", fillOpacity: 0.85, color: "#8a3e18", weight: 1.6 };
  return { fillColor: "#dcc99a", fillOpacity: 1, color: "#9a7a50", weight: 0.8 };
}
function hoverFor(status: ConquestStatus, color: string): L.PathOptions {
  if (status === "full") return { fillColor: lighten(color, 28), color: lighten(color, 70) };
  if (status === "partial") return { fillColor: "#cc6a32", color: "#9a4820" };
  return { fillColor: "#c8a870", color: "#7a5a30" };
}
function imperialStyleFor(status: ConquestStatus, color: string): L.PathOptions {
  if (status === "none")
    return { fillColor: "#c8ae80", fillOpacity: 0.88, color: "rgba(120,85,45,0.35)", weight: 0.5 };
  return {
    fillColor: status === "full" ? color : "#b85c28",
    fillOpacity: 1,
    color: lighten(color, 60),
    weight: 2.4,
  };
}
function tooltipHtml(iso: string, name: string, status: ConquestStatus) {
  const badge =
    status === "full"
      ? '<span class="ct-badge ct-full">⚜ Conquistado</span>'
      : status === "partial"
        ? '<span class="ct-badge ct-partial">⚔ Invadiendo</span>'
        : '<span class="ct-badge ct-none">Sin conquistar</span>';
  return `<div class="ct-header"><img class="ct-flag" src="https://flagcdn.com/w80/${iso.toLowerCase()}.png" alt="${iso}"><span class="ct-name">${name}</span></div>${badge}`;
}


const ImperialMap = forwardRef<ImperialMapHandle, ImperialMapProps>(
  function ImperialMap(
    { onSelectCountry, onConqueredCountChange, onWorldLoaded, onAnnex },
    ref,
  ) {
    const mapDivRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const s = useRef({
      map: null as L.Map | null,
      geoLayers: {} as Record<string, L.Polygon>,
      geoGeometries: {} as Record<string, SimpleGeometry>,
      battleMarkers: {} as Record<string, L.Marker>,
      allCountries: [] as { iso: string; name: string }[],
      spainLayer: null as L.GeoJSON | null,
      capitalsLayer: null as L.GeoJSON | null,
      ctx: null as CanvasRenderingContext2D | null,
      isPaintMode: false,
      isEraseMode: false,
      isPainting: false,
      currentBrush: 1,
      activeStroke: [] as [number, number][],
      currentPaintIso: null as string | null,
      imperialView: false,
    });

    function recomputeConqueredCount() {
      const total = s.current.allCountries.length;
      const count = s.current.allCountries.filter(
        (c) => getStatus(c.iso) !== "none",
      ).length;
      onConqueredCountChange(count);
      return total;
    }

    function refreshStyle(iso: string) {
      const layer = s.current.geoLayers[iso];
      if (!layer) return;
      const status = getStatus(iso);
      const color = getConquestColor();
      layer.setStyle(s.current.imperialView ? imperialStyleFor(status, color) : styleFor(status, color));
    }

    function applyImperialStyles() {
      const active = s.current.imperialView;
      const color = getConquestColor();
      Object.entries(s.current.geoLayers).forEach(([iso, layer]) => {
        const status = getStatus(iso);
        layer.setStyle(active ? imperialStyleFor(status, color) : styleFor(status, color));
      });
      containerRef.current?.classList.toggle("imperial-view", active);
    }

    function spawnAnnexBurst(map: L.Map, lat: number, lng: number, iso: string) {
      const icon = L.divIcon({
        className: "",
        html: `<div class="annex-burst"><div class="annex-ring"></div><div class="annex-ring annex-ring-2"></div><div class="annex-flag"><img src="https://flagcdn.com/w40/${iso.toLowerCase()}.png" alt=""/></div></div>`,
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
      const name = s.current.allCountries.find((c) => c.iso === iso)?.name ?? iso;
      onAnnex?.(iso, name);
    }

    function updateBattleMarkers() {
      const map = s.current.map;
      if (!map) return;
      Object.values(s.current.battleMarkers).forEach((m) => m.remove());
      s.current.battleMarkers = {};
      Object.entries(s.current.geoLayers).forEach(([iso, layer]) => {
        if (getStatus(iso) !== "partial") return;
        const bounds = layer.getBounds?.();
        if (!bounds) return;
        const c = bounds.getCenter();
        const icon = L.divIcon({
          className: "battle-marker-wrap",
          html: '<div class="battle-marker">⚔</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        s.current.battleMarkers[iso] = L.marker([c.lat, c.lng], {
          icon,
          interactive: false,
          keyboard: false,
          zIndexOffset: 1500,
        }).addTo(map);
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
        ctx.globalAlpha = 0.82;
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = w * 0.25;
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
      s.current.allCountries.forEach((c) => {
        const strokes = getStrokes(c.iso);
        if (strokes.length === 0) return;
        ctx.save();
        applyCountryClip(ctx, map, c.iso);
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
        updateBattleMarkers();
        recomputeConqueredCount();
        triggerAnnexation(s.current.currentPaintIso);
      }
      redrawCanvas();
    }

    /* ── Imperative handle ───────────────────────────── */
    useImperativeHandle(ref, () => ({
      setCountryStatus(iso, status) {
        const wasNone = getStatus(iso) === "none";
        if (status === "none") clearStrokes(iso);
        saveStatus(iso, status);
        refreshStyle(iso);
        updateBattleMarkers();
        recomputeConqueredCount();
        redrawCanvas();
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
        updateBattleMarkers();
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
      toggleImperialView() {
        s.current.imperialView = !s.current.imperialView;
        applyImperialStyles();
        updateBattleMarkers();
        return s.current.imperialView;
      },
    }));

    /* ── Mount ────────────────────────────────────────── */
    useEffect(() => {
      if (!mapDivRef.current) return;

      // Reset mutable collections in case of a Strict-Mode dev remount.
      s.current.geoLayers = {};
      s.current.geoGeometries = {};
      s.current.battleMarkers = {};
      s.current.allCountries = [];
      s.current.spainLayer = null;
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

      const worldB = L.latLngBounds([
        [-65, -168],
        [82, 178],
      ]);
      map.fitBounds(worldB, { animate: false, padding: [0, 0] });
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

      function pointerDown(e: MouseEvent) {
        onPaintDown(e.clientX, e.clientY);
      }
      function pointerMove(e: MouseEvent) {
        onPaintMove(e.clientX, e.clientY);
      }
      function pointerUp() {
        onPaintUp();
      }
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
        // Countries
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

            layer.bindTooltip(tooltipHtml(iso, name, getStatus(iso)), {
              className: "country-tooltip-rich",
              sticky: true,
              direction: "top",
              offset: [0, -8],
              opacity: 1,
            });
            layer.on("mouseover", () => {
              if (s.current.isPaintMode) return;
              layer.setTooltipContent(tooltipHtml(iso, name, getStatus(iso)));
              const base = s.current.imperialView
                ? imperialStyleFor(getStatus(iso), getConquestColor())
                : styleFor(getStatus(iso), getConquestColor());
              (layer as L.Path).setStyle({ ...base, ...hoverFor(getStatus(iso), getConquestColor()) });
            });
            layer.on("mouseout", () => {
              if (s.current.isPaintMode) return;
              const base = s.current.imperialView
                ? imperialStyleFor(getStatus(iso), getConquestColor())
                : styleFor(getStatus(iso), getConquestColor());
              (layer as L.Path).setStyle(base);
            });
            layer.on("click", () => {
              if (s.current.isPaintMode) return;
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
        updateBattleMarkers();
        redrawCanvas();


        // Spain provinces (zoom-dependent)
        fetch(`${BASE_PATH}/geo/spain-ccaa-simple.geojson`)
          .then((r) => r.json())
          .then((data) => {
            if (disposed) return;
            const spainLayer = L.geoJSON(data, {
              style: () => ({
                fillColor: "#000000",
                fillOpacity: 0.001,
                color: "rgba(200,144,40,0.55)",
                weight: 1.4,
                dashArray: "4,3",
                interactive: true,
              }),
              onEachFeature: (f, layer) => {
                const n = f.properties?.name || "";
                layer.bindTooltip(`<div class="ccaa-tip">${n}</div>`, {
                  className: "ccaa-tip-wrap",
                  sticky: true,
                  direction: "top",
                  offset: [0, -6],
                  opacity: 1,
                });
                layer.on("mouseover", () =>
                  (layer as L.Path).setStyle({ color: "rgba(240,192,48,0.85)", weight: 2, dashArray: "" }),
                );
                layer.on("mouseout", () =>
                  (layer as L.Path).setStyle({ color: "rgba(200,144,40,0.55)", weight: 1.4, dashArray: "4,3" }),
                );
                layer.on("click", () => onSelectCountry("ES", "España"));
              },
            });
            s.current.spainLayer = spainLayer;
            const update = () => {
              if (!s.current.spainLayer) return;
              if (map.getZoom() >= SPAIN_CCAA_ZOOM) {
                if (!map.hasLayer(s.current.spainLayer)) s.current.spainLayer.addTo(map);
              } else if (map.hasLayer(s.current.spainLayer)) {
                map.removeLayer(s.current.spainLayer);
              }
            };
            update();
            map.on("zoom", update);
            map.on("zoomend", update);
          })
          .catch(() => {});

        // Capitals (zoom-dependent)
        fetch(`${BASE_PATH}/geo/capitals.geojson`)
          .then((r) => r.json())
          .then((data) => {
            if (disposed) return;
            const capitalsLayer = L.geoJSON(data, {
              pointToLayer: (f, latlng) => {
                const name = getCapitalNameEs(f.properties?.name || "");
                const icon = L.divIcon({
                  className: "",
                  html: `<div class="cap-mk"><div class="cap-dot"></div><span class="cap-nm">${name}</span></div>`,
                  iconSize: [0, 0],
                  iconAnchor: [3, 3],
                });
                return L.marker(latlng, { icon, interactive: false, keyboard: false, zIndexOffset: 800 });
              },
            });
            s.current.capitalsLayer = capitalsLayer;
            const update = () => {
              if (!s.current.capitalsLayer) return;
              if (map.getZoom() >= CAPITALS_ZOOM) {
                if (!map.hasLayer(s.current.capitalsLayer)) s.current.capitalsLayer.addTo(map);
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
