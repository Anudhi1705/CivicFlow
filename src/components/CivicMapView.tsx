import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, ArrowUp, ArrowRight, Layers, HelpCircle, Sparkles } from "lucide-react";
import { StatusBadge } from "./StatusBadge.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { Issue } from "../types.ts";
import L from "leaflet";

interface CivicMapViewProps {
  issues: Issue[];
  onUpvote: (id: string) => Promise<void>;
}

export const CivicMapView: React.FC<CivicMapViewProps> = ({ issues, onUpvote }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);
  const heatmapLayerRef = useRef<L.FeatureGroup | null>(null);

  // Find selected issue
  const selectedIssue = useMemo(() => {
    return issues.find((i) => i._id === selectedIssueId) || null;
  }, [issues, selectedIssueId]);

  // Extract all categories
  const categories = useMemo(() => {
    return Array.from(new Set(issues.map((i) => i.category)));
  }, [issues]);

  // Filter issues displayed on map
  const mapFilteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (activeCategoryFilter === "all") return true;
      return issue.category === activeCategoryFilter;
    });
  }, [issues, activeCategoryFilter]);

  // Helper: color code matching issue status
  const getStatusColor = (status: Issue["status"]) => {
    switch (status) {
      case "resolved": return "#10b981"; // Emerald Green
      case "in-progress": return "#f59e0b"; // Amber Yellow
      case "rejected": return "#f43f5e"; // Rose Red
      case "pending":
      default:
        return "#3b82f6"; // Electric Blue
    }
  };

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([37.7749, -122.4194], 13); // Default SF coordinates

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapRef.current = map;
      markersLayerRef.current = L.featureGroup().addTo(map);
      heatmapLayerRef.current = L.featureGroup().addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
        heatmapLayerRef.current = null;
      }
    };
  }, []);

  // Update Markers when filtered list or selection state changes
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    mapFilteredIssues.forEach((issue) => {
      const lat = issue.location.lat || 37.7749;
      const lng = issue.location.lng || -122.4194;
      const color = getStatusColor(issue.status);
      const isSelected = selectedIssueId === issue._id;

      // Render highly detailed vector layout marker pins
      const markerHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -top-7 rounded-full p-1 shadow-md border-2 border-white flex items-center justify-center transition-all ${
            isSelected ? "bg-red-600 scale-125 z-30 animate-bounce" : "scale-100 z-10 hover:scale-110"
          }" style="background-color: ${color}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="w-3.5 h-3.5 text-white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          ${isSelected ? `<span class="absolute top-0 w-4.5 h-4.5 bg-red-500 rounded-full opacity-50 animate-ping"></span>` : ""}
          <span class="relative w-1.5 h-1.5 rounded-full border border-white" style="background-color: ${color}"></span>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: markerHtml,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([lat, lng], { icon: markerIcon });

      marker.on("click", () => {
        setSelectedIssueId(issue._id);
      });

      // Quick hover tooltip
      marker.bindTooltip(
        `<div class="font-sans px-1 py-0.5">
          <p class="font-bold text-xs text-slate-900">${issue.title}</p>
          <p class="text-[10px] text-slate-500 font-mono capitalize">Sector: ${issue.category} | Severity: ${issue.severity}</p>
         </div>`,
        { direction: "top", offset: [0, -15], opacity: 0.95 }
      );

      marker.addTo(markersLayerRef.current!);
    });

    // Auto fit map bounds nicely if markers exist and no manual single pin zoom is triggered
    if (mapFilteredIssues.length > 0 && markersLayerRef.current.getLayers().length > 0) {
      const bounds = markersLayerRef.current.getBounds();
      mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [mapFilteredIssues, selectedIssueId]);

  // Synchronize Heatmap / Grid Concentration overlay
  useEffect(() => {
    if (!mapRef.current || !heatmapLayerRef.current) return;

    heatmapLayerRef.current.clearLayers();

    if (showHeatmap) {
      // Aggregate issues spatially around similar sectors (100m buckets)
      const grid: { [key: string]: { lat: number; lng: number; count: number; category: string } } = {};
      
      mapFilteredIssues.forEach((issue) => {
        const keyLat = Math.round(issue.location.lat * 150) / 150;
        const keyLng = Math.round(issue.location.lng * 150) / 150;
        const key = `${keyLat},${keyLng}`;
        
        if (!grid[key]) {
          grid[key] = { lat: keyLat, lng: keyLng, count: 0, category: issue.category };
        }
        grid[key].count += 1;
      });

      Object.values(grid).forEach((sector) => {
        const intensity = Math.min(1, sector.count / 3);

        // Broad fading alert zone
        L.circle([sector.lat, sector.lng], {
          radius: 240,
          color: "#f43f5e",
          fillColor: "#f43f5e",
          fillOpacity: intensity * 0.15,
          weight: 1,
          dashArray: "3, 6"
        }).addTo(heatmapLayerRef.current!);

        // Core dense warning core
        const core = L.circle([sector.lat, sector.lng], {
          radius: 90,
          color: "#e11d48",
          fillColor: "#e11d48",
          fillOpacity: intensity * 0.45,
          weight: 0
        }).addTo(heatmapLayerRef.current!);

        core.bindTooltip(
          `<div class="font-sans p-1 text-center">
            <p class="font-bold text-[9px] uppercase tracking-widest text-rose-600 font-mono">Civic Density Warning</p>
            <p class="text-xs font-bold text-slate-800">${sector.count} Hotspot Claims</p>
           </div>`,
          { direction: "center", permanent: false, opacity: 0.95 }
        );
      });
    }
  }, [showHeatmap, mapFilteredIssues]);

  // Handle smooth fly-to when issue is selected
  useEffect(() => {
    if (mapRef.current && selectedIssue) {
      const lat = selectedIssue.location.lat;
      const lng = selectedIssue.location.lng;
      if (lat && lng) {
        mapRef.current.setView([lat, lng], 15);
      }
    }
  }, [selectedIssueId]);

  return (
    <div className="grid lg:grid-cols-12 gap-6 bg-slate-50 border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-xs" id="civic-map-dashboard">
      {/* Sidebar - Controls and Selected Details */}
      <div className="lg:col-span-4 flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles size={12} className="animate-pulse" />
              <span>OpenSource Geoview</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono font-medium bg-slate-100 px-2 py-0.5 rounded-md">
              Mapping {mapFilteredIssues.length} reports
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-sans">
              <Layers size={16} className="text-slate-500 animate-spin-slow" />
              <span>Real-Time Map Layers</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Browse municipal complaints interactively on our OpenStreetMap platform. Map anchors indicate live status details automatically.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="space-y-3 pt-1">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategoryFilter("all")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border cursor-pointer ${
                  activeCategoryFilter === "all"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Sectors
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border capitalize cursor-pointer ${
                    activeCategoryFilter === cat
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Heatmap Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${showHeatmap ? "bg-red-500 animate-pulse" : "bg-slate-300"}`} />
                <span className="text-xs font-bold text-slate-700">Glow Hotspot Overlay</span>
              </div>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  showHeatmap ? "bg-red-500" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    showHeatmap ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Issue Info Drawer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs min-h-[170px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {selectedIssue ? (
              <motion.div
                key={selectedIssue._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3.5 font-sans"
              >
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                    {selectedIssue.category}
                  </span>
                  <StatusBadge status={selectedIssue.status} size="sm" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm leading-tight hover:text-blue-600 transition-colors">
                    <Link to={`/issues/${selectedIssue._id}`} id={`map-selected-link-${selectedIssue._id}`}>
                      {selectedIssue.title}
                    </Link>
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{selectedIssue.location.address || "CivicFlow City"}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {selectedIssue.description}
                </p>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onUpvote(selectedIssue._id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      user && selectedIssue.upvotes.includes(user._id)
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                    id={`map-selected-upvote-${selectedIssue._id}`}
                  >
                    <ArrowUp size={12} />
                    <span>Upvote ({selectedIssue.upvotes.length})</span>
                  </button>

                  <Link
                    to={`/issues/${selectedIssue._id}`}
                    className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                    id={`map-selected-view-timeline-${selectedIssue._id}`}
                  >
                    <span>Timeline & Talk</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full py-6 text-center space-y-2 font-sans"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                  <HelpCircle size={20} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">No report selected</p>
                  <p className="text-[11px] text-slate-400 max-w-[210px] leading-normal">
                    Click any interactive status pin on the city grid to view dispatcher details and citizen comments.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Map OSM Container */}
      <div className="lg:col-span-8 relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-inner min-h-[400px]">
        {/* Map Legend Floating */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs z-20 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-slate-600 font-sans">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>In Repair</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Resolved</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Rejected</span>
          </div>
        </div>

        {/* Hotspots indicator */}
        {showHeatmap && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold tracking-tight shadow-sm z-20 animate-pulse flex items-center gap-1 font-sans">
            <span>● Area Concentration Layer Active</span>
          </div>
        )}

        {/* Map leaf elements */}
        <div ref={mapContainerRef} className="w-full h-full min-h-[450px] z-10" id="civic-interactive-leaflet-map" />

        {/* Coords overlay details footer */}
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-xs text-white px-4 py-2 flex items-center justify-between text-[11px] font-mono z-20">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Map Frame:</span>
            <span className="font-bold text-blue-400">CivicFlow Citizen GeoNodes</span>
          </div>
          <span className="text-slate-400 hidden sm:inline">
            Drag/zoom map dynamically to query local neighborhoods.
          </span>
        </div>
      </div>
    </div>
  );
};
