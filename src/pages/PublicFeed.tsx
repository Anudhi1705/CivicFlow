import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { Compass, ArrowUp, AlertCircle, MapPin, Search, ListFilter, Tag, ArrowRight, Map, Grid } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge.tsx";
import { CivicMapView } from "../components/CivicMapView.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { Issue } from "../types.ts";

export const PublicFeed: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/issues");
      if (!res.ok) throw new Error("Failed to load public feed");
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

  const handleUpvote = async (id: string) => {
    if (!user) {
      showToast("Please sign in or create an account to upvote neighborhood issues.", "info");
      return;
    }

    try {
      const res = await fetch(`/api/issues/${id}/upvote`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to register upvote");
      const updatedIssue = await res.json();

      const hasUpvoted = updatedIssue.upvotes.includes(user._id);
      showToast(
        hasUpvoted 
          ? "Thank you! Upvoted successfully."
          : "Upvote removed.",
        "success"
      );

      setIssues(prev => prev.map(i => i._id === id ? updatedIssue : i));
    } catch (err: any) {
      showToast(err.message || "Failed to process upvote.", "error");
    }
  };

  // Extract unique categories
  const categories = Array.from(new Set(issues.map(i => i.category)));

  // Filter
  const filteredIssues = issues.filter(issue => {
    const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      issue.title.toLowerCase().includes(query) ||
      issue.description.toLowerCase().includes(query) ||
      issue.reportedBy.name.toLowerCase().includes(query) ||
      (issue.location.address && issue.location.address.toLowerCase().includes(query));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div id="public-feed-page" className="space-y-8 py-4 text-left">
      {/* Background Line Texture overlay */}
      <div className="absolute inset-0 line-texture pointer-events-none -z-10" />

      {/* Page Header */}
      <div className="relative border border-border-light bg-soft-bg rounded-3xl p-8 sm:p-12 mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Compass size={160} className="text-accent animate-spin-slow" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-[10px] font-bold font-mono text-accent bg-[#e8f5e9] text-[#1b4332] px-3 py-1 flex items-center gap-1.5 w-fit uppercase tracking-widest rounded-full">
            <Compass size={12} className="animate-pulse" />
            <span>CivicFlow Ward • Live Registry</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-sans font-bold text-ink leading-tight">
            CivicFlow Public Board.
          </h1>
          <p className="text-text-light text-xs sm:text-sm leading-relaxed font-sans font-normal mt-3">
            Explore issues reported by CivicFlow residents, upvote neighborhood priorities to authorize public dispatches, and audit work orders in real-time.
          </p>
        </div>
      </div>

      {/* Search & Filter Header Bar */}
      <div className="bg-soft-bg border border-border-light p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search keyword, location, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-border-light rounded-xl text-xs text-ink font-sans font-normal focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Tag size={13} className="text-text-light" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-border-light text-xs bg-white text-ink rounded-xl font-sans font-semibold cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
            >
              <option value="all">All Sectors</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <ListFilter size={13} className="text-text-light" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-border-light text-xs bg-white text-ink rounded-xl font-sans font-semibold cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="in-progress">In Active Repair</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs (Modern Pill-tab layout) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-soft-bg border border-border-light rounded-2xl w-fit">
        <button
          onClick={() => setViewMode("grid")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-sans font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            viewMode === "grid"
              ? "bg-accent text-white shadow-md shadow-accent/15"
              : "text-text-light hover:text-ink hover:bg-white/50"
          }`}
          id="tab-grid-view"
        >
          <Grid size={13} />
          <span>Ledger List ({filteredIssues.length})</span>
        </button>
        <button
          onClick={() => setViewMode("map")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-sans font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            viewMode === "map"
              ? "bg-accent text-white shadow-md shadow-accent/15"
              : "text-text-light hover:text-ink hover:bg-white/50"
          }`}
          id="tab-map-view"
        >
          <Map size={13} />
          <span>Interactive Grid Map</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-48 bg-white border border-border-light rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-100 rounded-2xl text-center text-[#b71c1c] flex items-center justify-center gap-2 text-xs font-sans font-semibold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : viewMode === "map" ? (
        <div className="border border-border-light rounded-3xl overflow-hidden shadow-sm">
          <CivicMapView issues={filteredIssues} onUpvote={handleUpvote} />
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-soft-bg border border-border-light border-dashed rounded-3xl p-12 text-center text-xs font-sans text-text-light font-medium">
          <p>No dispatches matching the filter parameters found.</p>
          <p className="text-[10px] text-text-light/70 mt-1">Modify your sector search term or check all statuses.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <div
              key={issue._id}
              className="bg-white border border-border-light rounded-3xl p-6 shadow-[0_12px_30px_rgba(45,106,79,0.03)] hover:shadow-[0_20px_40px_rgba(45,106,79,0.06)] hover:translate-y-[-2px] transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-sans font-bold uppercase px-3 py-1 bg-soft-bg text-text-light border border-border-light rounded-full">
                      {issue.category}
                    </span>
                    <span className={`text-[10px] font-sans font-bold capitalize px-3 py-1 rounded-full border ${
                      issue.severity === "critical" ? "bg-rose-50 text-[#b71c1c] border-rose-100" :
                      issue.severity === "high" ? "bg-amber-50 text-[#f57f17] border-amber-100" :
                      issue.severity === "medium" ? "bg-blue-50 text-[#0d47a1] border-blue-100" :
                      "bg-slate-50 text-slate-700 border-slate-100"
                    }`}>
                      {issue.severity}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Link to={`/issues/${issue._id}`} id={`feed-title-link-${issue._id}`}>
                      <h3 className="font-sans font-bold text-xl text-ink hover:text-accent transition-colors leading-tight line-clamp-1">
                        {issue.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 text-text-light text-xs font-medium">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{issue.location.address || "CivicFlow City"}</span>
                    </div>
                  </div>

                  <p className="text-xs text-text-light font-sans font-normal leading-relaxed line-clamp-3">
                    {issue.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-border-light">
                  {/* Status Indicator Bar */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-[10px] font-semibold text-text-light">Status</span>
                      <StatusBadge status={issue.status} size="sm" />
                    </div>
                    
                    <Link 
                      to={`/issues/${issue._id}`} 
                      className="text-xs font-sans font-bold text-accent hover:underline flex items-center gap-0.5"
                      id={`feed-timeline-link-${issue._id}`}
                    >
                      <span>Timeline</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>

                  {/* Divider and Upvotes */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-sans uppercase font-bold text-text-light leading-none">Reported by</span>
                      <span className="text-xs font-bold text-ink mt-0.5">{issue.reportedBy.name}</span>
                    </div>

                    {/* Upvote utility */}
                    <button
                      onClick={() => handleUpvote(issue._id)}
                      className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-border-light font-sans font-semibold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                        user && issue.upvotes.includes(user._id)
                          ? "bg-accent text-white border-transparent shadow-md shadow-accent/15"
                          : "bg-white text-ink hover:bg-soft-bg"
                      }`}
                      id={`feed-upvote-btn-${issue._id}`}
                    >
                      <ArrowUp size={11} />
                      <span>Upvote ({issue.upvotes.length})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
