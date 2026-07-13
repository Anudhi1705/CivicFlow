import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { MapPicker } from "../components/MapPicker.tsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { AlertCircle, CheckCircle, Clock, ShieldAlert, Edit2, CheckCircle2, ChevronRight, Filter, RefreshCw, X } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { Issue } from "../types.ts";

export const AdminHome: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate("/signin");
      return;
    }
    if (user.role !== "admin") {
      navigate("/");
    }
  }, [user]);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/Search states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit/Dispatch states
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<"pending" | "in-progress" | "resolved" | "rejected">("pending");
  const [dispatchDept, setDispatchDept] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/issues");
      if (!res.ok) throw new Error("Failed to load issues");
      const data: Issue[] = await res.json();
      setIssues(data);

      const statsRes = await fetch("/api/issues/stats", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchAdminData();
    }
  }, [user]);

  const openDispatch = (issue: Issue) => {
    setSelectedIssue(issue);
    setDispatchStatus(issue.status);
    setDispatchDept(issue.assignedToDepartment || "");
    setDispatchNotes(issue.adminNotes || "");
  };

  const closeDispatch = () => {
    setSelectedIssue(null);
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/issues/${selectedIssue._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: dispatchStatus,
          assignedToDepartment: dispatchDept.trim() || undefined,
          adminNotes: dispatchNotes.trim() || undefined
        })
      });

      if (!res.ok) throw new Error("Failed to update dispatch details");
      const updatedIssue = await res.json();

      // Update local state
      setIssues(prev => prev.map(i => i._id === selectedIssue._id ? updatedIssue : i));
      closeDispatch();
      showToast("Dispatch records and status updated successfully!", "success");
      
      // Refresh stats
      const statsRes = await fetch("/api/issues/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update dispatch details.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Processing chart data
  const getCategoryChartData = () => {
    if (!stats || !stats.byCategory) return [];
    return Object.keys(stats.byCategory).map(cat => ({
      name: cat.split(" & ")[0] || cat,
      count: stats.byCategory[cat]
    }));
  };

  const getStatusChartData = () => {
    if (!stats) return [];
    return [
      { name: "Pending", value: stats.pending, color: "#f57f17" },
      { name: "In Progress", value: stats.inProgress, color: "#2d6a4f" },
      { name: "Resolved", value: stats.resolved, color: "#d946ef" },
      { name: "Rejected", value: stats.rejected, color: "#e57373" }
    ].filter(item => item.value > 0);
  };

  // Filter Issues
  const filteredIssues = issues.filter(issue => {
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
    
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      issue.title.toLowerCase().includes(term) ||
      issue.description.toLowerCase().includes(term) ||
      issue.reportedBy.name.toLowerCase().includes(term) ||
      issue._id.toLowerCase().includes(term);

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const categories = Array.from(new Set(issues.map(i => i.category)));

  return (
    <div id="admin-dashboard" className="space-y-8 py-4 text-left">
      {/* Header and sync */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-border-light bg-soft-bg rounded-3xl p-6 sm:p-10 shadow-[0_15px_40px_rgba(45,106,79,0.02)]">
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent bg-[#e8f5e9] text-[#1b4332] px-3 py-1 font-bold rounded-full inline-block">ADMIN COMMAND DESK</span>
          <h1 className="text-3xl font-sans font-bold tracking-tight text-ink">Municipal Dispatch</h1>
          <p className="text-text-light text-xs sm:text-sm font-sans font-normal">Administrative oversight, active coordination, and work-order management.</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="flex items-center gap-1.5 border border-border-light bg-white text-ink hover:bg-soft-bg rounded-xl px-4 py-2.5 font-sans font-semibold text-xs uppercase tracking-wide cursor-pointer transition-all shrink-0"
          id="admin-sync-btn"
        >
          <RefreshCw size={13} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Admin stats counters */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 border border-border-light rounded-3xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] flex items-center gap-4">
            <div className="p-3 bg-soft-bg border border-border-light text-accent rounded-2xl shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-3xl font-sans font-extrabold text-ink leading-none">{stats.pending}</p>
              <p className="text-[10px] font-sans font-bold text-text-light uppercase tracking-wider mt-1.5">Unreviewed Cases</p>
            </div>
          </div>

          <div className="bg-white p-6 border border-border-light rounded-3xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] flex items-center gap-4">
            <div className="p-3 bg-soft-bg border border-border-light text-accent rounded-2xl shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-3xl font-sans font-extrabold text-ink leading-none">{stats.inProgress}</p>
              <p className="text-[10px] font-sans font-bold text-text-light uppercase tracking-wider mt-1.5">In Active Repair</p>
            </div>
          </div>

          <div className="bg-white p-6 border border-border-light rounded-3xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] flex items-center gap-4">
            <div className="p-3 bg-soft-bg border border-border-light text-accent rounded-2xl shrink-0">
              <CheckCircle size={18} />
            </div>
            <div>
              <p className="text-3xl font-sans font-extrabold text-ink leading-none">{stats.resolved}</p>
              <p className="text-[10px] font-sans font-bold text-text-light uppercase tracking-wider mt-1.5">Completely Fixed</p>
            </div>
          </div>

          <div className="bg-white p-6 border border-border-light rounded-3xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] flex items-center gap-4">
            <div className="p-3 bg-soft-bg border border-border-light text-accent rounded-2xl shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-3xl font-sans font-extrabold text-ink leading-none">{stats.rejected}</p>
              <p className="text-[10px] font-sans font-bold text-text-light uppercase tracking-wider mt-1.5">Rejected Claims</p>
            </div>
          </div>
        </div>
      )}

      {/* Recharts Analytics Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category distribution */}
          <div className="bg-white border border-border-light rounded-3xl p-6 space-y-4 lg:col-span-2 shadow-[0_12px_30px_rgba(45,106,79,0.03)]">
            <h3 className="font-sans font-bold text-lg text-ink">Reports by Sector</h3>
            <div className="h-64 font-sans text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getCategoryChartData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d6a4f" strokeOpacity={0.08} />
                  <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={true} stroke="#2d6a4f" />
                  <YAxis fontSize={9} tickLine={false} axisLine={true} stroke="#2d6a4f" />
                  <Tooltip cursor={{ fill: "rgba(45,106,79,0.02)" }} />
                  <Bar dataKey="count" fill="#2d6a4f" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown Circle */}
          <div className="bg-white border border-border-light rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-[0_12px_30px_rgba(45,106,79,0.03)]">
            <h3 className="font-sans font-bold text-lg text-ink">Resolution Progress</h3>
            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getStatusChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {getStatusChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-3xl font-sans font-extrabold text-ink leading-none">{issues.length}</span>
                <p className="text-[10px] font-sans font-bold text-text-light uppercase tracking-wider mt-1">Total Filed</p>
              </div>
            </div>

            {/* Custom chart legend list */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-sans font-bold text-text-light">
              {getStatusChartData().map(item => (
                <div key={item.name} className="flex items-center gap-1.5 justify-center border border-border-light rounded-xl py-1.5 px-2.5 bg-soft-bg">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="uppercase">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and registry table */}
      <div className="bg-white border border-border-light rounded-3xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] overflow-hidden space-y-4 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border-light pb-5">
          <div className="space-y-1">
            <h3 className="text-xl font-sans font-bold text-ink">CivicFlow Issue Registry</h3>
            <p className="text-xs text-text-light font-sans font-normal uppercase tracking-wider">Search and filter reported civilian claims.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <input
              type="text"
              placeholder="Search reports or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2.5 border border-border-light rounded-xl bg-white text-ink font-sans text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent w-full lg:w-56"
            />

            {/* Filter by status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-border-light rounded-xl text-xs font-sans font-semibold bg-white text-ink cursor-pointer focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="in-progress">In Active Work</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Filter by category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-border-light rounded-xl text-xs font-sans font-semibold bg-white text-ink cursor-pointer focus:outline-none"
            >
              <option value="all">All Sectors</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-12 bg-white border border-border-light rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-xs font-sans text-text-light font-medium uppercase">
            No community reports match the current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="admin-registry-table">
              <thead>
                <tr className="border-b border-border-light text-text-light font-sans text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ref ID</th>
                  <th className="py-3.5 px-4">Issue details</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Team</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light text-xs font-sans font-medium">
                {filteredIssues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-soft-bg/50 transition-colors border-b border-border-light">
                    {/* Ref ID */}
                    <td className="py-4 px-4 font-sans text-xs text-text-light font-semibold">
                      #{issue._id.split("-")[1] || issue._id}
                    </td>

                    {/* Issue details */}
                    <td className="py-4 px-4 max-w-xs md:max-w-md">
                      <div className="space-y-1">
                        <Link to={`/issues/${issue._id}`} id={`admin-title-link-${issue._id}`}>
                          <span className="text-ink font-sans font-bold text-base block truncate hover:text-accent">{issue.title}</span>
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-text-light font-sans font-normal">
                          <span>{issue.category}</span>
                          <span>•</span>
                          <span>{issue.location.address || "City Bounds"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        issue.severity === "critical" ? "bg-rose-50 text-[#b71c1c] border-rose-100" :
                        issue.severity === "high" ? "bg-amber-50 text-[#f57f17] border-amber-100" :
                        issue.severity === "medium" ? "bg-blue-50 text-[#0d47a1] border-blue-100" :
                        "bg-slate-50 text-slate-700 border-slate-100"
                      }`}>
                        {issue.severity}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="py-4 px-4 text-ink font-sans font-semibold">
                      {issue.reportedBy.name}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <StatusBadge status={issue.status} size="sm" />
                    </td>

                    {/* Assigned Department */}
                    <td className="py-4 px-4 font-sans text-xs font-semibold text-text-light max-w-32 truncate uppercase">
                      {issue.assignedToDepartment || "Unallocated"}
                    </td>

                    {/* Dispatch Button */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => openDispatch(issue)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-sans font-semibold uppercase tracking-wide border border-border-light bg-white hover:bg-soft-bg text-ink rounded-xl transition-all cursor-pointer animate-fade-in"
                        id={`dispatch-btn-${issue._id}`}
                      >
                        <Edit2 size={11} />
                        <span>Dispatch</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over or Popup Dispatch Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-border-light rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col p-8 space-y-6 text-left animate-scale-up shadow-2xl">
            <div className="flex justify-between items-start border-b border-border-light pb-4">
              <div>
                <span className="text-[10px] font-sans uppercase text-text-light font-bold tracking-wider">Dispatch Operations Control</span>
                <h3 className="text-xl font-sans font-bold text-ink">Issue #{selectedIssue._id.split("-")[1] || selectedIssue._id}</h3>
              </div>
              <button
                onClick={closeDispatch}
                className="p-2 border border-border-light bg-white text-text-light hover:bg-soft-bg rounded-xl cursor-pointer transition-colors"
                id="close-dispatch-btn"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-6 flex-1 text-xs">
              {/* Detailed Issue Brief */}
              <div className="bg-soft-bg border border-border-light rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center gap-4">
                  <span className="font-sans font-bold text-base text-ink">{selectedIssue.title}</span>
                  <span className="text-[10px] text-text-light font-sans font-semibold uppercase shrink-0">{new Date(selectedIssue.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-text-light font-sans font-normal leading-relaxed">{selectedIssue.description}</p>
                <div className="text-[10px] font-sans font-semibold text-text-light/80 flex flex-wrap gap-4 uppercase border-t border-border-light pt-2.5">
                  <span>Author: <strong className="text-ink">{selectedIssue.reportedBy.name}</strong> ({selectedIssue.reportedBy.email})</span>
                  <span>Est Location: <strong className="text-ink">{selectedIssue.location.address || "CivicFlow"}</strong></span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs area */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-sans text-xs font-bold uppercase text-text-light block mb-2">Work Status Order</label>
                    <select
                      value={dispatchStatus}
                      onChange={(e: any) => setDispatchStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-border-light rounded-xl bg-white text-ink font-sans text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="pending">Pending Review (Redispached)</option>
                      <option value="in-progress">In Active Work (In Progress)</option>
                      <option value="resolved">Resolved (Complete)</option>
                      <option value="rejected">Rejected (Discarded)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-sans text-xs font-bold uppercase text-text-light block mb-2">Assign Municipal Department</label>
                    <input
                      type="text"
                      value={dispatchDept}
                      onChange={(e) => setDispatchDept(e.target.value)}
                      placeholder="e.g., Public Works - Roads Unit"
                      className="w-full px-4 py-3 border border-border-light rounded-xl bg-white text-ink font-sans text-xs font-semibold focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-sans text-xs font-bold uppercase text-text-light block mb-2">Resolution/Action Comments</label>
                    <textarea
                      rows={3}
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                      placeholder="e.g., Repair crew has been scheduled. Equipment dispatch ordered."
                      className="w-full px-4 py-3 border border-border-light rounded-xl bg-white text-ink font-sans text-xs font-normal focus:outline-hidden leading-relaxed placeholder-text-light/40"
                    />
                  </div>
                </div>

                {/* Coordinates review map */}
                <div className="border border-border-light rounded-2xl p-4 bg-soft-bg shadow-xs flex flex-col justify-between">
                  <span className="font-sans text-[10px] uppercase tracking-wider font-bold text-text-light block mb-3">
                    GEOLOCATION TELEMETRY MAP
                  </span>
                  <div className="flex-1 overflow-hidden border border-border-light rounded-xl">
                    <MapPicker
                      lat={selectedIssue.location.lat}
                      lng={selectedIssue.location.lng}
                      address={selectedIssue.location.address}
                      onChange={() => {}}
                      readOnly={true}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
                <button
                  type="button"
                  onClick={closeDispatch}
                  className="px-5 py-3 border border-border-light rounded-xl bg-white hover:bg-soft-bg text-ink font-sans font-bold text-xs uppercase tracking-wide cursor-pointer transition-all"
                  id="dispatch-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-sans font-bold text-xs uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-accent/15"
                  id="dispatch-save-btn"
                >
                  {isUpdating ? "Saving..." : "Save Dispatch Directives"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
