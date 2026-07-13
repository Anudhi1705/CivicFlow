import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Leaf, Trash2, Search, CheckCircle2, AlertTriangle, HelpCircle, 
  MapPin, Plus, Trophy, TreePine, Flame, Calendar, Trash 
} from "lucide-react";
import { useToast } from "../context/ToastContext.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import L from "leaflet";

// Waste Classification Database
interface WasteItem {
  name: string;
  category: "wet" | "dry" | "sanitary" | "hazardous" | "e-waste";
  guideline: string;
  binColor: string;
}

const WASTE_ITEMS: WasteItem[] = [
  { name: "banana peel", category: "wet", guideline: "100% compostable. Place in green bin. Drain liquids.", binColor: "bg-green-600 border-green-700 text-white" },
  { name: "apple core", category: "wet", guideline: "100% compostable. Place in green bin.", binColor: "bg-green-600 border-green-700 text-white" },
  { name: "leftover food & cooked rice", category: "wet", guideline: "Compostable. Ensure excess water is drained off before dumping in green bin.", binColor: "bg-green-600 border-green-700 text-white" },
  { name: "egg shells", category: "wet", guideline: "Crush them and place in green bin to accelerate composting decomposition.", binColor: "bg-green-600 border-green-700 text-white" },
  { name: "tea bags & coffee grounds", category: "wet", guideline: "Remove staple pin / plastic string first, then dispose in green bin.", binColor: "bg-green-600 border-green-700 text-white" },
  
  { name: "plastic milk packet", category: "dry", guideline: "Wash thoroughly, dry completely, and place in blue bin for recycling.", binColor: "bg-blue-600 border-blue-700 text-white" },
  { name: "plastic bottle", category: "dry", guideline: "Rinse, flatten to save volume, and place in blue bin.", binColor: "bg-blue-600 border-blue-700 text-white" },
  { name: "cardboard box & newspaper", category: "dry", guideline: "Flatten boxes. Keep dry and place in blue bin.", binColor: "bg-blue-600 border-blue-700 text-white" },
  { name: "aluminum beverage can", category: "dry", guideline: "Crush and drop into the blue bin for metal recycling.", binColor: "bg-blue-600 border-blue-700 text-white" },
  { name: "glass jar & bottles", category: "dry", guideline: "Rinse carefully. Place intact glassware in the blue bin.", binColor: "bg-blue-600 border-blue-700 text-white" },
  
  { name: "baby diaper", category: "sanitary", guideline: "Wrap securely in newspaper, mark with a red cross 'X', and keep separate.", binColor: "bg-red-500 border-red-600 text-white" },
  { name: "sanitary napkin", category: "sanitary", guideline: "Wrap in bio-waste bags or newspaper. Do not flush. Mark with red cross.", binColor: "bg-red-500 border-red-600 text-white" },
  { name: "used bandages & cotton", category: "sanitary", guideline: "Hazardous pathogens. Wrap securely and hand over to medical waste collectors.", binColor: "bg-red-500 border-red-600 text-white" },
  
  { name: "household batteries", category: "hazardous", guideline: "Highly toxic heavy metals. Keep in dry container and take to hazardous waste centers.", binColor: "bg-rose-700 border-rose-800 text-white" },
  { name: "expired medicine", category: "hazardous", guideline: "Do not throw in sink or open trash. Give back to pharmacies or toxic waste centers.", binColor: "bg-rose-700 border-rose-800 text-white" },
  { name: "broken fluorescent light", category: "hazardous", guideline: "Contains mercury vapors. Pack in newspaper and take to safety dropoff.", binColor: "bg-rose-700 border-rose-800 text-white" },
  { name: "paint can", category: "hazardous", guideline: "Contains volatile chemicals. Must be handed over to hazardous chemical recycling.", binColor: "bg-rose-700 border-rose-800 text-white" },
  
  { name: "old mobile phone", category: "e-waste", guideline: "Valuable rare minerals. Bring directly to designated E-waste bins at DWCC center.", binColor: "bg-slate-700 border-slate-800 text-white" },
  { name: "charging cables & adaptors", category: "e-waste", guideline: "Do not incinerate or bury. Drop off at authorized e-waste points.", binColor: "bg-slate-700 border-slate-800 text-white" },
  { name: "broken computer mouse & keyboard", category: "e-waste", guideline: "Electronic refuse. Place in DWCC e-waste bin.", binColor: "bg-slate-700 border-slate-800 text-white" },
];

// Eco Recycling Centers
interface EcoCenter {
  name: string;
  type: "Recycling Center" | "Composting Depot" | "Hazardous Site" | "Dry Waste Centre";
  lat: number;
  lng: number;
  address: string;
  contact: string;
  schedule: string;
}

const ECO_CENTERS: EcoCenter[] = [
  { name: "CivicFlow Dry Waste Collection Centre (DWCC)", type: "Dry Waste Centre", lat: 37.7850, lng: -122.4120, address: "245 Maple Ave, Northpark", contact: "+1 (415) 555-0190", schedule: "Mon-Sat: 8:00 AM - 6:00 PM" },
  { name: "Sunset Community Composting Yard", type: "Composting Depot", lat: 37.7680, lng: -122.4430, address: "812 Park Alley, Pine Heights", contact: "+1 (415) 555-0145", schedule: "Daily: 7:00 AM - 4:00 PM" },
  { name: "Civic Centre E-Waste & Toxic Safety Yard", type: "Hazardous Site", lat: 37.7780, lng: -122.4210, address: "105 Civic Plaza Dr, Downtown", contact: "+1 (415) 555-0122", schedule: "Wed & Sat: 9:00 AM - 5:00 PM" },
  { name: "Northpark Ward Recycling Depot", type: "Recycling Center", lat: 37.7950, lng: -122.4040, address: "550 Broadway St, Northpark", contact: "+1 (415) 555-0130", schedule: "Mon-Fri: 9:00 AM - 5:00 PM" }
];

// Composting Batch interface
interface CompostBatch {
  id: string;
  date: string;
  type: "Backyard Bin" | "Bokashi" | "Vermicomposting" | "Organic Tumblr";
  weight: number; // in kg
  status: "Active" | "Curing" | "Harvested";
  notes?: string;
}

export const EcoHub: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"segregation" | "composting" | "eco-map">("segregation");
  
  // Tab 1 States (Segregator)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Tab 2 States (Composter)
  const [familySize, setFamilySize] = useState<number>(3);
  const [compostBatches, setCompostBatches] = useState<CompostBatch[]>([]);
  const [newType, setNewType] = useState<CompostBatch["type"]>("Backyard Bin");
  const [newWeight, setNewWeight] = useState<string>("5");
  const [newNotes, setNewNotes] = useState("");

  // Tab 3 States (Leaflet Eco Map)
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<EcoCenter | null>(ECO_CENTERS[0]);

  // Read composting batches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`compost_batches_${user?._id || "guest"}`);
    if (saved) {
      try {
        setCompostBatches(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading composting logs", e);
      }
    } else {
      // Default initial seeds
      const initial: CompostBatch[] = [
        { id: "batch-1", date: "2026-06-15", type: "Backyard Bin", weight: 12.5, status: "Harvested", notes: "First summer batch completed!" },
        { id: "batch-2", date: "2026-06-28", type: "Bokashi", weight: 8.0, status: "Active", notes: "Added banana peels and leftover greens." }
      ];
      setCompostBatches(initial);
      localStorage.setItem(`compost_batches_${user?._id || "guest"}`, JSON.stringify(initial));
    }
  }, [user]);

  // Save composting batches
  const saveBatches = (updated: CompostBatch[]) => {
    setCompostBatches(updated);
    localStorage.setItem(`compost_batches_${user?._id || "guest"}`, JSON.stringify(updated));
  };

  // Add composting batch
  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(newWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      showToast("Please enter a valid weight in kg.", "error");
      return;
    }

    const newBatch: CompostBatch = {
      id: `batch-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: newType,
      weight: weightNum,
      status: "Active",
      notes: newNotes.trim() || undefined
    };

    const updated = [newBatch, ...compostBatches];
    saveBatches(updated);
    setNewWeight("5");
    setNewNotes("");
    showToast("Composting batch logged successfully! Carbon footprint reduced.", "success");
  };

  // Delete batch
  const handleDeleteBatch = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this composting log?")) return;
    const updated = compostBatches.filter(b => b.id !== id);
    saveBatches(updated);
    showToast("Compost log deleted.", "info");
  };

  // Update batch status
  const handleUpdateStatus = (id: string, nextStatus: CompostBatch["status"]) => {
    const updated = compostBatches.map(b => {
      if (b.id === id) {
        return { ...b, status: nextStatus };
      }
      return b;
    });
    saveBatches(updated);
    showToast(`Batch updated to ${nextStatus}!`, "success");
  };

  // Composting Calculations
  // 1 kg of wet organic waste diverted from landfill saves approximately 1.5 kg of CO2 equivalent emissions
  const totalOrganicDiverted = compostBatches.reduce((acc, b) => acc + b.weight, 0);
  const totalCO2Saved = parseFloat((totalOrganicDiverted * 1.5).toFixed(1));

  // Daily Municipal Estimates based on Family Size (average 0.45kg wet waste per person per day)
  const estDailyWetWaste = parseFloat((familySize * 0.45).toFixed(2));
  const estWeeklyWetWaste = parseFloat((estDailyWetWaste * 7).toFixed(1));
  const estWeeklyCO2Diverted = parseFloat((estWeeklyWetWaste * 1.5).toFixed(1));

  // Determine Green Badge Level
  const getEcoBadge = (weight: number) => {
    if (weight >= 50) return { title: "Zero-Waste Overlord", desc: "Superb composting scaling!", color: "bg-emerald-600 text-white" };
    if (weight >= 20) return { title: "Soil Wizard", desc: "Master composting practitioner", color: "bg-green-600 text-white" };
    if (weight >= 5) return { title: "Eco Champion", desc: "Solid local organic contributor", color: "bg-blue-600 text-white" };
    return { title: "Green Novice", desc: "Kicked off organic waste diversion", color: "bg-slate-500 text-white" };
  };
  const ecoBadge = getEcoBadge(totalOrganicDiverted);

  // Filtered Waste items
  const filteredWaste = WASTE_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  // Tab 3 Eco Map Initialization & Center Markers
  useEffect(() => {
    if (activeTab === "eco-map") {
      // Trigger short delay to guarantee HTML div rendering completed
      const timer = setTimeout(() => {
        if (mapContainerRef.current && !mapRef.current) {
          const map = L.map(mapContainerRef.current, {
            zoomControl: true,
            scrollWheelZoom: true,
          }).setView([37.7800, -122.4200], 13);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
          }).addTo(map);

          mapRef.current = map;
        }

        if (mapRef.current) {
          // Clear previous markers
          markersRef.current.forEach(m => m.remove());
          markersRef.current = [];

          // Add Eco Centers Markers
          ECO_CENTERS.forEach((center) => {
            const isSelected = selectedCenter?.name === center.name;
            const markerColor = center.type === "Composting Depot" ? "#10b981" : 
                                center.type === "Hazardous Site" ? "#f43f5e" : 
                                center.type === "Dry Waste Centre" ? "#3b82f6" : "#8b5cf6";

            const iconHtml = `
              <div class="relative flex items-center justify-center">
                <div class="absolute -top-7 rounded-full p-1.5 shadow-md border-2 border-white flex items-center justify-center transition-all ${
                  isSelected ? "bg-red-600 scale-125 z-30 animate-bounce" : "scale-100 z-10"
                }" style="background-color: ${markerColor}">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 text-white">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <span class="relative w-1.5 h-1.5 rounded-full border border-white" style="background-color: ${markerColor}"></span>
              </div>
            `;

            const icon = L.divIcon({
              html: iconHtml,
              className: "",
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            const marker = L.marker([center.lat, center.lng], { icon })
              .addTo(mapRef.current!)
              .on("click", () => {
                setSelectedCenter(center);
                mapRef.current?.setView([center.lat, center.lng], 15);
              });

            marker.bindTooltip(`
              <div class="font-sans p-1 text-center">
                <p class="font-bold text-xs text-slate-800">${center.name}</p>
                <p class="text-[9px] font-mono text-slate-400 font-bold uppercase">${center.type}</p>
              </div>
            `);

            markersRef.current.push(marker);
          });

          // Focus on active selected center
          if (selectedCenter) {
            mapRef.current.setView([selectedCenter.lat, selectedCenter.lng], 15);
          }
        }
      }, 150);

      return () => clearTimeout(timer);
    } else {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    }
  }, [activeTab, selectedCenter]);

  return (
    <div className="space-y-8 py-6 font-sans text-left" id="ecohub-portal">
      {/* Background Line Texture overlay */}
      <div className="absolute inset-0 line-texture pointer-events-none -z-10" />

      {/* Dynamic Jumbotron Header */}
      <div className="relative border border-border-light bg-soft-bg rounded-3xl p-8 sm:p-12 mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Leaf size={160} className="text-accent animate-spin-slow" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-[10px] font-bold font-mono text-accent bg-[#e8f5e9] text-[#1b4332] px-3 py-1 flex items-center gap-1.5 w-fit uppercase tracking-widest rounded-full">
            <Sparkles size={12} className="animate-pulse" />
            <span>EcoHub • Namma Kasa Core</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-sans font-bold text-ink leading-tight">
            Environmental Strategy.
          </h1>
          <p className="text-text-light text-xs sm:text-sm leading-relaxed font-sans font-normal mt-3">
            Facilitating the transition to a circular municipal economy. Track waste flow, learn segregation standards, and contribute to our local ecological stability through proactive disposal.
          </p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-soft-bg border border-border-light rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("segregation")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-sans font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === "segregation"
              ? "bg-accent text-white shadow-md shadow-accent/15"
              : "text-text-light hover:text-ink hover:bg-white/50"
          }`}
          id="tab-btn-segregation"
        >
          <Trash2 size={14} />
          <span>Waste Segregation</span>
        </button>
        <button
          onClick={() => setActiveTab("composting")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-sans font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === "composting"
              ? "bg-accent text-white shadow-md shadow-accent/15"
              : "text-text-light hover:text-ink hover:bg-white/50"
          }`}
          id="tab-btn-composting"
        >
          <Leaf size={14} />
          <span>Composting Log</span>
        </button>
        <button
          onClick={() => setActiveTab("eco-map")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-sans font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === "eco-map"
              ? "bg-accent text-white shadow-md shadow-accent/15"
              : "text-text-light hover:text-ink hover:bg-white/50"
          }`}
          id="tab-btn-eco-map"
        >
          <MapPin size={14} />
          <span>Eco Center Map</span>
        </button>
      </div>

      {/* TAB 1: WASTE SEGREGATOR SECTION */}
      {activeTab === "segregation" && (
        <div className="space-y-6 text-left" id="segregation-tab-view">
          <div className="bg-soft-bg border border-border-light rounded-2xl p-6 sm:p-8 space-y-4 text-left">
            <h2 className="text-2xl font-sans font-bold text-ink flex items-center gap-2 leading-tight">
              <Trash2 className="text-accent" size={22} />
              <span>Scrap Classification & Segregation Guide</span>
            </h2>
            <p className="text-xs sm:text-sm text-text-light leading-relaxed font-sans font-normal">
              Source segregation (dividing garbage at home) is key to waste-free cities. Type any garbage item below to discover if it is Wet, Dry, Sanitary, Hazardous, or Electronic waste, along with municipal disposal rules.
            </p>

            {/* Classification Search controls */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Type an item (e.g. banana peel, batteries, plastic packet)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-border-light rounded-xl text-xs text-ink font-sans font-normal focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>

              {/* Category Pills Filters */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 border border-border-light text-xs bg-white text-ink font-sans font-semibold rounded-xl cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
              >
                <option value="all">All Waste Classes</option>
                <option value="wet">Wet Waste (Green Bin)</option>
                <option value="dry">Dry Waste (Blue Bin)</option>
                <option value="sanitary">Sanitary Waste (Mark Red X)</option>
                <option value="hazardous">Hazardous (Household Toxic)</option>
                <option value="e-waste">E-Waste (Recycling Centres)</option>
              </select>
            </div>
          </div>

          {/* Classification grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWaste.map((item) => (
              <div
                key={item.name}
                className="bg-white border border-border-light rounded-2xl p-6 shadow-[0_12px_30px_rgba(45,106,79,0.03)] flex flex-col justify-between space-y-4 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_rgba(45,106,79,0.06)] transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-sm font-bold text-ink capitalize font-sans tracking-tight leading-tight">{item.name}</span>
                    <span className={`text-[9px] font-sans font-bold uppercase px-2.5 py-0.5 rounded-full border border-border-light ${
                      item.category === 'wet' ? 'bg-[#e8f5e9] text-[#1b4332]' :
                      item.category === 'dry' ? 'bg-[#e3f2fd] text-[#0d47a1]' :
                      item.category === 'sanitary' ? 'bg-[#ffebee] text-[#b71c1c]' :
                      item.category === 'hazardous' ? 'bg-[#fff8e1] text-[#f57f17]' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-light leading-normal font-sans font-normal">{item.guideline}</p>
                </div>
                
                <div className="border-t border-border-light pt-3 flex items-center justify-between">
                  <span className="text-[9px] text-text-light font-bold tracking-tight font-mono uppercase">DISPOSAL RULE:</span>
                  <span className="text-[10px] font-sans font-bold text-ink flex items-center gap-1.5">
                    {item.category === "wet" && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                    {item.category === "dry" && <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                    {item.category === "sanitary" && <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                    {item.category === "hazardous" && <span className="w-2.5 h-2.5 rounded-full bg-red-800" />}
                    {item.category === "e-waste" && <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />}
                    <span className="capitalize">{item.category} disposal bin</span>
                  </span>
                </div>
              </div>
            ))}

            {filteredWaste.length === 0 && (
              <div className="col-span-full bg-white border border-border-light rounded-2xl p-8 text-center text-text-light font-sans shadow-sm">
                <HelpCircle size={28} className="mx-auto text-accent mb-2" />
                <p className="font-bold text-ink uppercase">Scrap item not found</p>
                <p className="text-xs mt-1">Please check your spelling or search another household item.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIC COMPOSTING TRACKER & CO2 CALCULATOR */}
      {activeTab === "composting" && (
        <div className="space-y-6" id="composting-tab-view">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
            
            {/* Quick Estimator Card */}
            <div className="md:col-span-5 bg-soft-bg border border-border-light rounded-3xl p-8 shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-ink flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <TreePine size={16} strokeWidth={2} />
                  <span>Household Estimator</span>
                </h3>
                <p className="text-xs text-text-light leading-normal font-sans font-normal">
                  Municipal benchmarks estimate typical households generate about <span className="font-semibold text-ink">0.45 kg</span> of wet organic waste per person each day. Estimate yours below.
                </p>
              </div>

              {/* Slider Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-ink font-sans">
                  <span>Household Members:</span>
                  <span className="text-accent font-bold text-xs bg-white border border-border-light px-3 py-1 rounded-full">{familySize} persons</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={familySize}
                  onChange={(e) => setFamilySize(parseInt(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-border-light rounded-lg cursor-pointer"
                />
              </div>

              {/* Estimated output parameters */}
              <div className="border-t border-border-light pt-4 space-y-2.5 text-xs text-text-light font-sans">
                <div className="flex justify-between font-medium">
                  <span>Est. Daily Wet Waste:</span>
                  <span className="font-semibold text-ink">{estDailyWetWaste} kg / day</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Est. Weekly Diversion potential:</span>
                  <span className="font-semibold text-ink">{estWeeklyWetWaste} kg / week</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-border-light pt-3 text-ink font-bold">
                  <span>Weekly Carbon Abatement:</span>
                  <span className="bg-[#e8f5e9] text-[#1b4332] px-3 py-1 rounded-full flex items-center gap-1 text-[11px]">
                    <Flame size={12} className="text-accent rotate-180 animate-pulse" strokeWidth={2} />
                    <span>{estWeeklyCO2Diverted} kg CO₂e / week</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Total logged stats */}
            <div className="md:col-span-7 bg-accent text-white p-8 rounded-3xl shadow-[0_20px_40px_rgba(45,106,79,0.08)] flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 text-white/5 opacity-10">
                <Trophy size={160} />
              </div>
              
              <div className="flex justify-between items-start gap-1 relative z-10">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-mono font-bold tracking-widest text-accent-light/80 uppercase">My Green Badges & Impact</h3>
                  <p className="text-xl font-sans font-bold text-white">Persisted backyard composting achievements</p>
                </div>
                <span className="text-[10px] font-bold px-3 py-1 border border-white/20 bg-white/10 text-white rounded-full uppercase tracking-wider font-sans">
                  {ecoBadge.title}
                </span>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-white/10 border border-white/10 rounded-2xl p-5">
                  <span className="text-[9px] text-accent-light block font-sans font-semibold uppercase tracking-wider">Wet Waste Saved</span>
                  <span className="text-3xl font-bold font-sans text-white block mt-1">{totalOrganicDiverted.toFixed(1)} <span className="text-xs font-sans text-white/80">kg</span></span>
                  <span className="text-[9px] text-white/70 mt-1 block font-sans font-normal">Diverted from toxic landfills</span>
                </div>

                <div className="bg-white/10 border border-white/10 rounded-2xl p-5">
                  <span className="text-[9px] text-accent-light block font-sans font-semibold uppercase tracking-wider">CO₂ Offset</span>
                  <span className="text-3xl font-bold font-sans text-white block mt-1">{totalCO2Saved} <span className="text-xs font-sans text-white/80">kg</span></span>
                  <span className="text-[9px] text-white/70 mt-1 block font-sans font-normal">Methane emissions averted</span>
                </div>
              </div>

              <p className="text-[10px] text-white/60 italic leading-relaxed font-sans relative z-10">
                *Organic garbage decaying in municipal dumpsters produces methane (28x more carbon toxic than carbon dioxide). Correct composting retains carbon inside agricultural topsoils.
              </p>
            </div>
          </div>

          {/* Form to log a composting batch */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            <div className="lg:col-span-4 bg-soft-bg border border-border-light rounded-3xl p-8 shadow-sm">
              <form onSubmit={handleAddBatch} className="space-y-4">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-border-light pb-3 flex items-center gap-1 font-mono">
                  <Plus size={16} className="text-accent" />
                  <span>Log Composting Batch</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-text-light uppercase tracking-wider block">Compost Method</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CompostBatch["type"])}
                    className="w-full px-3 py-2.5 border border-border-light text-xs bg-white text-ink rounded-xl font-sans font-medium cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
                  >
                    <option value="Backyard Bin">Backyard Organic Bin</option>
                    <option value="Bokashi">Bokashi (Anaerobic Ferment)</option>
                    <option value="Vermicomposting">Vermicomposting (Worms)</option>
                    <option value="Organic Tumblr">Rotary Composting Tumblr</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-text-light uppercase tracking-wider block">Wet Waste weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-border-light text-xs bg-white text-ink rounded-xl font-mono font-medium focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-text-light uppercase tracking-wider block">Description / Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g. coffee grounds, citrus skins..."
                    className="w-full px-3 py-2.5 border border-border-light text-xs bg-white text-ink rounded-xl font-sans font-medium placeholder:text-text-light/50 focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-accent hover:bg-ink text-white rounded-xl text-xs font-sans font-semibold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-accent/10"
                >
                  <Plus size={14} />
                  <span>Submit Compost Log</span>
                </button>
              </form>
            </div>

            {/* Active Logs Table */}
            <div className="lg:col-span-8 bg-white border border-border-light rounded-3xl p-8 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Calendar size={16} className="text-accent" />
                <span>Active Composting Records</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="border-b border-border-light text-text-light font-sans uppercase tracking-wider font-semibold text-[10px]">
                      <th className="py-3">Logged Date</th>
                      <th>Method</th>
                      <th>Weight</th>
                      <th>CO₂ Diverted</th>
                      <th>Stage Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {compostBatches.map((batch) => (
                      <tr key={batch.id} className="text-ink hover:bg-soft-bg/50 transition-colors">
                        <td className="py-3.5 font-mono text-text-light font-medium">{batch.date}</td>
                        <td className="font-semibold text-ink">{batch.type}</td>
                        <td className="font-semibold text-ink">{batch.weight} kg</td>
                        <td className="text-green-700 font-bold">{(batch.weight * 1.5).toFixed(1)} kg</td>
                        <td>
                          <span className={`px-2.5 py-0.5 rounded-full border border-transparent text-[9px] font-semibold uppercase ${
                            batch.status === "Harvested" ? "bg-emerald-100 text-[#1b4332]" :
                            batch.status === "Curing" ? "bg-amber-100 text-[#f57f17]" :
                            "bg-blue-100 text-[#0d47a1] animate-pulse"
                          }`}>
                            {batch.status}
                          </span>
                        </td>
                        <td className="text-right py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {batch.status === "Active" && (
                              <button
                                onClick={() => handleUpdateStatus(batch.id, "Curing")}
                                className="px-2.5 py-1 bg-white hover:bg-accent hover:text-white text-accent border border-accent/20 rounded-lg text-[9px] font-sans font-semibold uppercase transition-all cursor-pointer"
                              >
                                Move to Curing
                              </button>
                            )}
                            {batch.status === "Curing" && (
                              <button
                                onClick={() => handleUpdateStatus(batch.id, "Harvested")}
                                className="px-2.5 py-1 bg-white hover:bg-accent hover:text-white text-accent border border-accent/20 rounded-lg text-[9px] font-sans font-semibold uppercase transition-all cursor-pointer"
                              >
                                Harvest Soil
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="p-1.5 hover:bg-rose-50 text-text-light hover:text-rose-700 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {compostBatches.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-text-light font-sans">
                          No compost logs found. Start logging using the side form!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ECO RECYCLING CENTERS & OSM LEAFLET MAP VIEW */}
      {activeTab === "eco-map" && (
        <div className="space-y-6" id="eco-map-tab-view">
          <div className="grid lg:grid-cols-12 gap-6 bg-white border border-border-light rounded-3xl p-6 shadow-sm text-left">
            
            {/* Sidebar List of Centers */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-5 text-left">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-sans font-bold text-ink flex items-center gap-1.5 leading-tight">
                    <MapPin size={18} className="text-accent animate-bounce" />
                    <span>Municipal Green Network</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-text-light leading-relaxed font-sans font-normal">
                    Select a localized dry waste collection facility, community recycling center, composting depot, or hazardous drop-off location below to show detailed directions and operating hours.
                  </p>
                </div>

                {/* Centers list cards */}
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {ECO_CENTERS.map((center) => {
                    const isSelected = selectedCenter?.name === center.name;
                    return (
                      <div
                        key={center.name}
                        onClick={() => setSelectedCenter(center)}
                        className={`p-4 border rounded-2xl transition-all cursor-pointer text-left font-sans ${
                          isSelected
                            ? "bg-soft-bg border-accent shadow-sm"
                            : "bg-white border-border-light hover:border-accent/40"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-sans font-bold text-sm text-ink leading-tight">{center.name}</h4>
                          <span className={`text-[8px] font-bold font-sans uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                            center.type === "Composting Depot" ? "bg-emerald-50 border-emerald-100 text-[#1b4332]" :
                            center.type === "Hazardous Site" ? "bg-rose-50 border-rose-100 text-[#b71c1c]" :
                            center.type === "Dry Waste Centre" ? "bg-blue-50 border-blue-100 text-[#0d47a1]" :
                            "bg-purple-50 border-purple-100 text-purple-950"
                          }`}>
                            {center.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-light mt-2.5 flex items-center gap-1 font-semibold">
                          <MapPin size={10} />
                          <span>{center.address}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Center Details Drawer */}
              {selectedCenter && (
                <div className="bg-soft-bg border border-border-light rounded-2xl p-5 space-y-3 font-sans">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-sans uppercase tracking-wider font-bold text-text-light">Selected Facility Details</span>
                  </div>

                  <div className="space-y-1 text-left">
                    <h4 className="font-sans font-bold text-sm text-ink leading-tight">{selectedCenter.name}</h4>
                    <p className="text-xs text-text-light font-normal">{selectedCenter.address}</p>
                  </div>

                  <div className="border-t border-border-light pt-3 space-y-1.5 text-xs text-text-light">
                    <div className="flex justify-between">
                      <span>Contact Helpline:</span>
                      <span className="font-semibold text-ink">{selectedCenter.contact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Working Hours:</span>
                      <span className="font-semibold text-ink">{selectedCenter.schedule}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Map Canvas */}
            <div className="lg:col-span-7 relative border border-border-light rounded-3xl overflow-hidden bg-soft-bg shadow-inner min-h-[350px]">
              <div ref={mapContainerRef} className="w-full h-full min-h-[380px] z-10" id="eco-leaflet-map-view" />
              
              {/* Overlay legend */}
              <div className="absolute top-3 left-3 bg-white/95 border border-border-light rounded-xl px-2.5 py-1.5 text-[9px] font-semibold text-ink font-sans shadow-md z-20 flex gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Compost</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Toxic</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> DWCC</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
