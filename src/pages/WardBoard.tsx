import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, MapPin, ArrowRight, Layers, HelpCircle, 
  Sparkles, CheckCircle2, ChevronRight, MessageSquare, 
  Map, List, X, QrCode, Phone, Megaphone, AlertTriangle, 
  Compass, ArrowUp, AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { Issue } from "../types.ts";
import { StatusBadge } from "../components/StatusBadge.tsx";
import L from "leaflet";

interface Ward {
  id: string;
  name: string;
  zone: "Central" | "East" | "South" | "North" | "West";
  code: string;
  representative: string;
  locality: string;
  lat: number;
  lng: number;
}

const DEFAULT_WARDS: Ward[] = [
  { id: "ward-downtown", name: "Oak Downtown Ward", zone: "Central", code: "#10", representative: "Uday B. Garudachar", locality: "Downtown", lat: 37.7749, lng: -122.4194 },
  { id: "ward-westside", name: "Library Westside Ward", zone: "West", code: "#15", representative: "Manjula S.", locality: "Westside", lat: 37.7833, lng: -122.4167 },
  { id: "ward-heights", name: "Heights Park Ward", zone: "South", code: "#31", representative: "C. K. Ramamurthy", locality: "Pine Heights", lat: 37.7699, lng: -122.4468 },
  { id: "ward-northpark", name: "Maple Northpark Ward", zone: "North", code: "#43", representative: "B. A. Basavaraja", locality: "Northpark", lat: 37.7946, lng: -122.4018 },
  { id: "ward-marina", name: "Marina Heights Ward", zone: "North", code: "#48", representative: "Manjula S.", locality: "Marina", lat: 37.8024, lng: -122.4417 },
  { id: "ward-mission", name: "Mission District Ward", zone: "South", code: "#12", representative: "C. K. Ramamurthy", locality: "Mission Heights", lat: 37.7599, lng: -122.4368 },
  { id: "ward-richmond", name: "Richmond Valley Ward", zone: "West", code: "#22", representative: "B. A. Basavaraja", locality: "Richmond", lat: 37.7785, lng: -122.4783 },
  { id: "ward-sunset", name: "Sunset Shoreline Ward", zone: "West", code: "#41", representative: "Uday B. Garudachar", locality: "Sunset", lat: 37.7495, lng: -122.4881 },
];

// Haversine distance helper to assign issues to nearest ward
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const WardBoard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Digest Banner State
  const [showBanner, setShowBanner] = useState(true);

  // Search, Filters & View Mode (Map or List, matching screenshots)
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  
  // Selected ward detail drawer state
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  
  // Scan QR modal state
  const [showQRModal, setShowQRModal] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);

  // Fetch Public Issues
  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/issues");
      if (!res.ok) throw new Error("Failed to load community board reports");
      const data: Issue[] = await res.json();
      setIssues(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Map each issue to its closest ward center dynamically
  const issuesWithWards = useMemo(() => {
    return issues.map(issue => {
      const lat = issue.location.lat;
      const lng = issue.location.lng;
      
      let closestWardId = DEFAULT_WARDS[0].id;
      let minDistance = Infinity;

      DEFAULT_WARDS.forEach(ward => {
        const dist = getDistance(lat, lng, ward.lat, ward.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestWardId = ward.id;
        }
      });

      return {
        ...issue,
        wardId: closestWardId
      };
    });
  }, [issues]);

  // Apply search/severity/status filters to issues
  const filteredIssues = useMemo(() => {
    return issuesWithWards.filter(issue => {
      const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        (issue.location.address && issue.location.address.toLowerCase().includes(query));

      return matchesSeverity && matchesStatus && matchesSearch;
    });
  }, [issuesWithWards, severityFilter, statusFilter, searchQuery]);

  // Map ward IDs to their corresponding lists of filtered issues
  const wardIssuesMap = useMemo(() => {
    const map: Record<string, Issue[]> = {};
    DEFAULT_WARDS.forEach(w => {
      map[w.id] = [];
    });
    filteredIssues.forEach(issue => {
      if (map[issue.wardId]) {
        map[issue.wardId].push(issue);
      }
    });
    return map;
  }, [filteredIssues]);

  // Compute active statistics for each ward (unresolved vs total count)
  const computedWards = useMemo(() => {
    return DEFAULT_WARDS.map(ward => {
      const wardIssues = wardIssuesMap[ward.id] || [];
      const unresolvedIssues = wardIssues.filter(
        i => i.status !== "resolved" && i.status !== "rejected"
      );
      
      return {
        ...ward,
        unresolvedCount: unresolvedIssues.length,
        totalCount: wardIssues.length
      };
    }).sort((a, b) => b.unresolvedCount - a.unresolvedCount); // Sort by highest unresolved counts first
  }, [wardIssuesMap]);

  // Currently selected ward object details
  const selectedWard = useMemo(() => {
    return computedWards.find(w => w.id === selectedWardId) || null;
  }, [selectedWardId, computedWards]);

  // Currently selected ward issues list
  const selectedWardIssues = useMemo(() => {
    if (!selectedWardId) return [];
    return wardIssuesMap[selectedWardId] || [];
  }, [selectedWardId, wardIssuesMap]);

  // Map Initialization & Dynamic Pin Synchronization
  useEffect(() => {
    if (viewMode !== "map" || isLoading) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
      }
      return;
    }

    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapRef.current = map;
      markersLayerRef.current = L.featureGroup().addTo(map);
    }

    // Refresh Circular cluster markers
    if (mapRef.current && markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      computedWards.forEach((ward) => {
        const unresolved = ward.unresolvedCount;
        const color = unresolved > 0 ? "#8b1e1e" : "#1c5837"; // Dark Red for unresolved, Dark green for perfect resolution
        
        // Neon-brutalist custom circular marker
        const markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
            <div class="w-12 h-12 flex items-center justify-center font-mono font-black text-sm border-2 border-ink rounded-full shadow-xs text-white transition-all hover:bg-opacity-90" 
                 style="background-color: ${color}">
              ${unresolved}
            </div>
            ${unresolved > 5 ? `<span class="absolute w-14 h-14 bg-red-600 rounded-full opacity-10 animate-ping -z-10"></span>` : ""}
          </div>
        `;

        const markerIcon = L.divIcon({
          html: markerHtml,
          className: "",
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        const marker = L.marker([ward.lat, ward.lng], { icon: markerIcon });
        marker.on("click", () => {
          setSelectedWardId(ward.id);
        });

        marker.bindTooltip(
          `<div class="font-mono p-1">
            <p class="font-extrabold text-xs text-slate-900 uppercase">${ward.name}</p>
            <p class="text-[10px] text-slate-500">Zone: ${ward.zone} | Rep: ${ward.representative}</p>
            <p class="text-[10px] text-red-600 font-bold mt-0.5">${unresolved} unresolved / ${ward.totalCount} total</p>
           </div>`,
          { direction: "top", offset: [0, -20], opacity: 0.95 }
        );

        marker.addTo(markersLayerRef.current!);
      });

      // Fit map bounds to encompass all wards
      if (computedWards.length > 0) {
        const bounds = L.latLngBounds(computedWards.map(w => [w.lat, w.lng]));
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [viewMode, computedWards, isLoading]);

  // Smooth FlyTo selected ward center
  useEffect(() => {
    if (mapRef.current && selectedWard) {
      mapRef.current.setView([selectedWard.lat, selectedWard.lng], 14, { animate: true });
    }
  }, [selectedWardId, selectedWard]);

  return (
    <div className="space-y-6 py-4 font-sans text-left" id="ward-board-view-container">
      
      {/* Digest Monday Alert Banner */}
      {showBanner && (
        <div 
          className="bg-rose-50 border border-rose-100 p-4 flex items-center justify-between shadow-xs rounded-2xl font-sans text-xs text-[#b71c1c] font-semibold animate-fade-in"
          id="digest-banner-alert"
        >
          <div className="flex items-center gap-3">
            <Megaphone className="text-[#b71c1c] shrink-0 animate-bounce" size={18} />
            <span>Join 575 CivicFlow Citizens receiving the Monday Local Digest for community work order updates.</span>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="p-1 hover:bg-[#b71c1c]/10 rounded-xl transition-all cursor-pointer"
            id="dismiss-digest-banner"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Primary Headers */}
      <div className="relative border border-border-light bg-soft-bg rounded-3xl p-8 sm:p-10 shadow-[0_15px_40px_rgba(45,106,79,0.02)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent bg-[#e8f5e9] text-[#1b4332] px-3 py-1 font-bold rounded-full inline-block mb-3">MUNICIPAL DATA LEDGERS</span>
            <h1 className="text-3xl sm:text-4xl font-sans font-bold text-ink leading-tight">
              CivicFlow Ward Board
            </h1>
            <p className="text-text-light text-xs sm:text-sm leading-relaxed font-sans font-normal mt-3 max-w-2xl">
              Analyze unresolved public claims, monitor designated municipal wards, and hold elected representatives accountable.
            </p>
          </div>

          {/* Toggle Map/List Views matching screenshot exactly */}
          <div className="flex border border-border-light overflow-hidden bg-white shadow-xs rounded-xl">
            <button
              onClick={() => { setViewMode("map"); setSelectedWardId(null); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-sans font-semibold text-[11px] uppercase cursor-pointer transition-all ${
                viewMode === "map"
                  ? "bg-accent text-white"
                  : "bg-white text-ink hover:bg-soft-bg"
              }`}
              id="view-mode-map-toggle"
            >
              <Map size={13} />
              <span>Map</span>
            </button>
            <button
              onClick={() => { setViewMode("list"); setSelectedWardId(null); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-sans font-semibold text-[11px] uppercase cursor-pointer transition-all border-l border-border-light ${
                viewMode === "list"
                  ? "bg-accent text-white"
                  : "bg-white text-ink hover:bg-soft-bg"
              }`}
              id="view-mode-list-toggle"
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown filters and query bars */}
      <div className="bg-white border border-border-light rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        
        {/* Local Search bar */}
        <div className="relative w-full md:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light">
            <Compass size={14} />
          </span>
          <input
            type="text"
            placeholder="Search within CivicFlow Wards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-light rounded-xl focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent text-xs text-ink font-sans font-medium placeholder-text-light/50"
          />
        </div>

        {/* Multi Filtering */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter dropdown */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-sans font-bold text-text-light uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-border-light rounded-xl text-xs bg-white text-ink font-sans font-semibold cursor-pointer focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Active Repair</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Severity filter dropdown */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-sans font-bold text-text-light uppercase tracking-wider">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-border-light rounded-xl text-xs bg-white text-ink font-sans font-semibold cursor-pointer focus:outline-hidden"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs font-sans text-text-light font-medium border border-border-light border-dashed rounded-2xl bg-white animate-pulse">
          Syncing CivicFlow Ward Coordinates...
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-100 rounded-2xl text-center text-[#b71c1c] flex items-center justify-center gap-2 text-xs font-sans font-semibold">
          <AlertCircle size={16} />
          <span>Error loading: {error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* VIEW MODE: LIST (Displays wards dynamically grouped by unresolved counts) */}
          {viewMode === "list" && (
            <div className="lg:col-span-7 space-y-4">
              {computedWards.map((ward) => {
                const isSelected = selectedWardId === ward.id;
                
                return (
                  <div
                    key={ward.id}
                    className={`border border-border-light p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all cursor-pointer shadow-[0_12px_30px_rgba(45,106,79,0.01)] rounded-2xl ${
                      isSelected 
                        ? "bg-soft-bg border-l-4 border-l-accent" 
                        : "bg-white hover:bg-soft-bg/40"
                    }`}
                    onClick={() => setSelectedWardId(isSelected ? null : ward.id)}
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      {/* Big Unresolved Count badge on the left, matching screenshots */}
                      <div className="w-14 h-14 bg-soft-bg border border-border-light rounded-2xl flex flex-col items-center justify-center shrink-0">
                        <span className="font-sans font-extrabold text-xl text-ink leading-none">{ward.unresolvedCount}</span>
                        <span className="text-[8px] font-sans font-bold text-text-light uppercase tracking-widest mt-1">OPEN</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <h3 className="font-sans font-bold text-xl text-ink leading-tight">
                            {ward.name}
                          </h3>
                          <span className="font-sans text-[10px] font-bold text-[#1b4332] bg-[#d8f3dc] px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {ward.zone} {ward.code}
                          </span>
                        </div>
                        <p className="text-xs text-text-light font-normal flex items-center gap-1">
                          <MapPin size={11} className="text-text-light shrink-0" />
                          <span>Primary Locality: {ward.locality}</span>
                        </p>
                        <p className="text-[10px] font-sans text-text-light/80 uppercase tracking-wider font-semibold mt-1">
                          Ward Officer: <strong className="text-ink">{ward.representative}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      <span className="text-[11px] font-sans font-semibold text-text-light uppercase tracking-wide">
                        {ward.totalCount} active logs
                      </span>
                      <ChevronRight 
                        className={`text-text-light transition-transform ${isSelected ? "rotate-90" : "rotate-0"}`} 
                        size={16} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE: MAP (Displays interactive Circular counts dynamically placed on OSM) */}
          {viewMode === "map" && (
            <div className="lg:col-span-7 relative border border-border-light overflow-hidden bg-slate-100 shadow-xs min-h-[500px] rounded-3xl">
              <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-10" id="osm-ward-leaflet-map" />
              
              {/* Legend overlay floating */}
              <div className="absolute top-3 left-3 bg-white/95 border border-border-light rounded-2xl px-3.5 py-3 text-[10px] font-semibold text-ink font-sans shadow-md z-20 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-light border-b border-border-light pb-1 mb-1">Ward Status</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#8b1e1e]" />
                  <span>Unresolved complaints present</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#1c5837]" />
                  <span>Zero Unresolved claims (Clean!)</span>
                </span>
              </div>
            </div>
          )}

          {/* Selected Ward Details Sidebar / Drawer */}
          <div className="lg:col-span-5 bg-white border border-border-light rounded-3xl p-6 space-y-4 shadow-[0_12px_30px_rgba(45,106,79,0.03)]">
            <AnimatePresence mode="wait">
              {selectedWard ? (
                <motion.div
                  key={selectedWard.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="border-b border-border-light pb-4 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-sans font-bold text-[#1b4332] bg-[#d8f3dc] px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                        WARD {selectedWard.code}
                      </span>
                      <button 
                        onClick={() => setSelectedWardId(null)}
                        className="text-text-light hover:text-ink transition-colors p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <h2 className="font-sans font-bold text-2xl text-ink tracking-tight mt-3 leading-none">
                      {selectedWard.name}
                    </h2>
                    <p className="font-sans text-xs text-text-light uppercase tracking-wider font-bold mt-2">
                      Elected Rep: <span className="text-ink underline">{selectedWard.representative}</span>
                    </p>
                  </div>

                  {/* Ward Statistics summary */}
                  <div className="grid grid-cols-2 gap-3 font-sans text-center">
                    <div className="border border-border-light rounded-2xl bg-rose-50 p-3 shadow-xs">
                      <span className="text-[9px] font-sans font-bold text-[#b71c1c] uppercase block tracking-wider">Unresolved</span>
                      <span className="text-2xl font-black text-[#b71c1c] block mt-1">{selectedWard.unresolvedCount}</span>
                    </div>
                    <div className="border border-border-light rounded-2xl bg-emerald-50 p-3 shadow-xs">
                      <span className="text-[9px] font-sans font-bold text-emerald-800 uppercase block tracking-wider">Total Filed</span>
                      <span className="text-2xl font-black text-emerald-900 block mt-1">{selectedWard.totalCount}</span>
                    </div>
                  </div>

                  {/* List of reports matching this ward */}
                  <div className="space-y-3 pt-2 text-left">
                    <h4 className="font-sans text-[11px] font-bold text-text-light uppercase tracking-wider border-b border-border-light pb-2.5 flex items-center gap-1.5">
                      <Layers size={13} />
                      <span>Complaints Ledger ({selectedWardIssues.length})</span>
                    </h4>

                    {selectedWardIssues.length === 0 ? (
                      <p className="text-xs font-sans text-text-light/80 italic p-4 text-center border border-border-light border-dashed rounded-xl bg-soft-bg/40">
                        Perfect score! No unresolved complaints active in this ward area.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {selectedWardIssues.map(issue => (
                          <div 
                            key={issue._id}
                            className="p-4 border border-border-light rounded-2xl bg-[#fdfdfb] hover:bg-soft-bg transition-all flex flex-col justify-between gap-2.5"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <Link 
                                to={`/issues/${issue._id}`}
                                className="font-sans font-bold text-base text-ink hover:text-accent tracking-tight leading-tight line-clamp-1"
                              >
                                {issue.title}
                              </Link>
                              <StatusBadge status={issue.status} size="sm" />
                            </div>
                            
                            <p className="text-xs text-text-light font-sans font-normal leading-relaxed">
                              {issue.description}
                            </p>

                            <div className="flex items-center justify-between border-t border-border-light pt-2 text-[10px] font-sans font-semibold text-text-light/80">
                              <span>Reported: {new Date(issue.createdAt).toLocaleDateString()}</span>
                              <Link 
                                to={`/issues/${issue._id}`}
                                className="text-accent font-bold hover:underline flex items-center gap-0.5"
                              >
                                <span>Timeline</span>
                                <ArrowRight size={10} />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-ward"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-soft-bg border border-border-light flex items-center justify-center text-accent shadow-xs rounded-2xl animate-bounce">
                    <HelpCircle size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-sans font-bold text-lg text-ink">No Ward Selected</p>
                    <p className="text-xs text-text-light max-w-[250px] leading-relaxed mx-auto mt-1 font-normal">
                      {viewMode === "map" 
                        ? "Select an active circular geonode on the OSM city grid to display ward statistics and unresolved work orders."
                        : "Select a ward card in the ledger list to analyze corporators and unresolved resident claims."
                      }
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* Floating Bottom Bar: Scan QR to Report / Report claim overlay */}
      <div 
        className="border border-border-light bg-accent text-white px-5 sm:px-8 py-5 rounded-3xl shadow-lg shadow-accent/15 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs font-bold"
        id="scan-qr-bottom-bar"
      >
        <div className="flex items-center gap-3">
          <QrCode className="text-white shrink-0 animate-pulse" size={20} />
          <span>Need to register a civic issue? Locate community QR code markers or trigger digital filing.</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowQRModal(true)}
            className="px-4 py-2.5 bg-white text-ink hover:bg-soft-bg transition-all rounded-xl cursor-pointer border border-border-light uppercase font-bold flex items-center gap-1.5 shadow-sm"
            id="open-qr-scanner-btn"
          >
            <Phone size={13} />
            <span>Scan QR to Report</span>
          </button>
          <Link 
            to="/report"
            className="px-4 py-2.5 border border-white text-white hover:bg-white hover:text-ink transition-all rounded-xl cursor-pointer uppercase font-bold text-center"
            id="direct-file-report-link"
          >
            Direct File
          </Link>
        </div>
      </div>

      {/* QR Code Scanner Dialog Modal Overlay */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-border-light p-8 max-w-sm w-full text-center relative rounded-3xl shadow-2xl"
              id="qr-scan-modal"
            >
              <button 
                onClick={() => setShowQRModal(false)}
                className="absolute top-3.5 right-3.5 text-text-light hover:text-ink p-1 cursor-pointer"
                id="close-qr-modal-btn"
              >
                <X size={18} />
              </button>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-[#e8f5e9] text-accent flex items-center justify-center rounded-2xl border border-border-light">
                    <QrCode size={24} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-lg text-ink">Scan QR Code Tracker</h3>
                  <p className="text-xs text-text-light font-sans font-normal leading-relaxed">
                    Point your device camera at the physical ward marker plates placed near city street intersections or dustbins.
                  </p>
                </div>

                {/* Mock QR Code Image visual container */}
                <div className="flex justify-center py-4">
                  <div className="w-40 h-40 border border-border-light rounded-2xl bg-white p-2 flex items-center justify-center relative">
                    {/* Corner anchors mock layout */}
                    <div className="absolute top-1 left-1 w-4 h-4 border-t border-l border-ink" />
                    <div className="absolute top-1 right-1 w-4 h-4 border-t border-r border-ink" />
                    <div className="absolute bottom-1 left-1 w-4 h-4 border-b border-l border-ink" />
                    <div className="absolute bottom-1 right-1 w-4 h-4 border-b border-r border-ink" />
                    
                    {/* Mock matrix dots */}
                    <div className="w-full h-full bg-[#fafafa] flex flex-col justify-between p-1 opacity-80 select-none">
                      <div className="flex justify-between">
                        <div className="w-8 h-8 border-2 border-ink bg-white" />
                        <div className="w-8 h-8 border-2 border-ink bg-white" />
                      </div>
                      <div className="flex justify-center text-[10px] font-sans font-bold tracking-tight uppercase text-text-light/60">
                        WARD QR CODE
                      </div>
                      <div className="flex justify-between">
                        <div className="w-8 h-8 border-2 border-ink bg-white" />
                        <div className="w-3 h-3 bg-[#2d6a4f] rounded-full animate-ping" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link 
                    to="/report"
                    onClick={() => setShowQRModal(false)}
                    className="w-full py-3 bg-accent text-white border border-accent hover:bg-accent/90 font-sans font-bold text-xs uppercase tracking-wider block transition-all rounded-xl shadow-md shadow-accent/15 cursor-pointer text-center"
                  >
                    Proceed to Report form
                  </Link>
                  <button 
                    onClick={() => {
                      setShowQRModal(false);
                      showToast("Simulating QR Scan for Local Ward #43 Downtown Success!", "success");
                    }}
                    className="w-full py-2.5 bg-white text-ink border border-border-light hover:bg-soft-bg font-sans font-bold text-[10px] uppercase tracking-wider block transition-all rounded-xl cursor-pointer"
                  >
                    Simulate Quick Scan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
