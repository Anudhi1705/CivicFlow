import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { PlusCircle, FileText, CheckCircle2, Clock, Trash2, ArrowUp, AlertCircle, MapPin, ListFilter } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { Issue } from "../types.ts";

export const CitizenHome: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "resolved">("all");

  const fetchCitizenIssues = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/issues");
      if (!res.ok) throw new Error("Failed to load issues");
      const data: Issue[] = await res.json();
      
      // Filter issues reported by this citizen
      const myIssues = data.filter(i => i.reportedBy._id === user?._id);
      setIssues(myIssues);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/signin");
      return;
    }
    fetchCitizenIssues();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this reported issue?")) return;
    
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to delete issue");
      }

      // Refresh list
      setIssues(prev => prev.filter(i => i._id !== id));
      showToast("Issue report successfully deleted.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete issue report.", "error");
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/upvote`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to process upvote");
      const updatedIssue = await res.json();

      const hasUpvoted = updatedIssue.upvotes.includes(user?._id);
      showToast(
        hasUpvoted 
          ? "Thank you! Upvoted successfully."
          : "Upvote removed.",
        "success"
      );

      setIssues(prev => prev.map(i => i._id === id ? updatedIssue : i));
    } catch (err: any) {
      showToast(err.message || "Upvote process failed.", "error");
    }
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    if (filter === "all") return true;
    return issue.status === filter;
  });

  // Calculate statistics
  const stats = {
    total: issues.length,
    resolved: issues.filter(i => i.status === "resolved").length,
    active: issues.filter(i => i.status === "in-progress" || i.status === "pending").length
  };

  return (
    <div id="citizen-dashboard" className="space-y-8 py-4 text-left">
      {/* Welcome header */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-border-light bg-soft-bg rounded-3xl p-6 sm:p-10 shadow-[0_15px_40px_rgba(45,106,79,0.02)]">
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent bg-[#e8f5e9] text-[#1b4332] px-3 py-1 font-bold rounded-full inline-block">MUNICIPAL HUB</span>
          <h1 className="text-3xl font-sans font-bold tracking-tight text-ink">Citizen Dashboard</h1>
          <p className="text-text-light text-xs sm:text-sm font-sans font-normal">Welcome back, {user?.name}. Monitor your community contributions.</p>
        </div>
        <Link
          to="/report"
          className="flex items-center gap-2 px-5 py-3.5 bg-accent text-white rounded-xl font-sans font-bold text-xs uppercase tracking-wider hover:bg-accent/90 transition-all cursor-pointer shadow-md shadow-accent/15 shrink-0"
          id="citizen-report-issue-btn"
        >
          <PlusCircle size={15} />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Quick Statistics Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-border-light rounded-3xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] flex items-center gap-4">
          <div className="p-3 bg-soft-bg border border-border-light text-accent rounded-2xl shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-3xl font-sans font-extrabold text-ink leading-none">{stats.total}</p>
            <p className="text-[10px] font-sans font-bold text-text-light uppercase tracking-wider mt-1.5">My Total Reports</p>
          </div>
        </div>

        <div className="bg-white p-6 border border-border-light rounded-3xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] flex items-center gap-4">
          <div className="p-3 bg-soft-bg border border-border-light text-accent rounded-2xl shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-3xl font-sans font-extrabold text-ink leading-none">{stats.resolved}</p>
            <p className="text-[10px] font-sans font-bold text-text-light uppercase tracking-wider mt-1.5">Resolved Reports</p>
          </div>
        </div>

        <div className="bg-white p-6 border border-border-light rounded-3xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] flex items-center gap-4">
          <div className="p-3 bg-soft-bg border border-border-light text-accent rounded-2xl shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-3xl font-sans font-extrabold text-ink leading-none">{stats.active}</p>
            <p className="text-[10px] font-sans font-bold text-text-light uppercase tracking-wider mt-1.5">Active Cases</p>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-light pb-4">
          <h2 className="text-xl font-sans font-bold text-ink flex items-center gap-2">
            <span>My Reported Concerns</span>
            <span className="font-sans text-xs text-text-light font-semibold">({filteredIssues.length})</span>
          </h2>

          {/* Filtering Tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs bg-soft-bg border border-border-light rounded-2xl p-1 w-fit">
            {(["all", "pending", "in-progress", "resolved"] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-4 py-2.5 rounded-xl font-sans font-semibold text-xs tracking-wider transition-all uppercase cursor-pointer ${
                  filter === tab
                    ? "bg-accent text-white shadow-md shadow-accent/15"
                    : "text-text-light hover:text-ink hover:bg-white/50"
                }`}
              >
                {tab.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(n => (
              <div key={n} className="h-32 bg-white border border-border-light rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-center text-[#b71c1c] font-sans font-semibold flex items-center justify-center gap-2 text-xs">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-soft-bg border border-border-light border-dashed rounded-3xl p-12 text-center text-xs font-sans text-text-light font-medium space-y-2">
            <p>No reported concerns found matching this filter category.</p>
            <p className="text-[10px] text-text-light/70">Click "Report New Issue" above to submit a community concern.</p>
          </div>
        ) : (
          <div className="space-y-4" id="citizen-issue-list">
            {filteredIssues.map((issue) => (
              <div
                key={issue._id}
                className="bg-white border border-border-light rounded-3xl p-6 shadow-[0_12px_30px_rgba(45,106,79,0.03)] hover:shadow-[0_20px_40px_rgba(45,106,79,0.05)] hover:translate-y-[-1px] transition-all flex flex-col md:flex-row gap-6 justify-between items-start"
              >
                <div className="space-y-4 flex-1">
                  {/* Category, Status & ID */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-sans font-bold uppercase px-3 py-1 bg-soft-bg text-text-light border border-border-light rounded-full">
                      {issue.category}
                    </span>
                    <span className={`text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      issue.severity === "critical" ? "bg-rose-50 text-[#b71c1c] border-rose-100" :
                      issue.severity === "high" ? "bg-amber-50 text-[#f57f17] border-amber-100" :
                      issue.severity === "medium" ? "bg-blue-50 text-[#0d47a1] border-blue-100" :
                      "bg-slate-50 text-slate-700 border-slate-100"
                    }`}>
                      {issue.severity} Severity
                    </span>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>

                  <div className="space-y-1.5">
                    <Link to={`/issues/${issue._id}`} id={`citizen-title-link-${issue._id}`}>
                      <h3 className="text-xl font-sans font-bold text-ink hover:text-accent flex flex-wrap items-center gap-2 leading-tight">
                        <span>{issue.title}</span>
                        <span className="inline-block font-sans text-[9px] uppercase tracking-wider bg-soft-bg border border-border-light px-2.5 py-1 text-accent rounded-full font-bold">
                          TIMELINE & DISCUSSION
                        </span>
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 text-text-light text-xs font-normal">
                      <MapPin size={12} className="shrink-0" />
                      <span>{issue.location.address || "CivicFlow City"}</span>
                    </div>
                  </div>

                  <p className="text-xs text-text-light font-sans font-normal leading-relaxed max-w-3xl">
                    {issue.description}
                  </p>

                  {/* Dispatch admin feedback */}
                  {(issue.assignedToDepartment || issue.adminNotes) && (
                    <div className="bg-soft-bg border border-border-light rounded-2xl p-4 text-xs space-y-2">
                      <p className="font-sans text-[11px] uppercase tracking-wider font-bold text-[#1b4332] flex items-center gap-1.5">
                        <CheckCircle2 size={12} />
                        <span>DISPATCHER ASSIGNMENT LOG</span>
                      </p>
                      {issue.assignedToDepartment && (
                        <p className="text-ink/80 font-sans font-semibold">
                          <span className="text-text-light font-normal">Assigned Unit:</span> {issue.assignedToDepartment}
                        </p>
                      )}
                      {issue.adminNotes && (
                        <p className="text-text-light/90 leading-relaxed italic font-medium">
                          "{issue.adminNotes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Operations column */}
                <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-border-light pt-4 md:pt-0 shrink-0">
                  <div className="flex items-center gap-1 text-text-light text-[10px] font-mono">
                    <span>ID: {issue._id.split("-")[1] || issue._id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Upvote Toggle */}
                    <button
                      onClick={() => handleUpvote(issue._id)}
                      className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-border-light font-sans font-semibold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                        issue.upvotes.includes(user?._id || "")
                          ? "bg-accent text-white border-transparent shadow-md shadow-accent/15"
                          : "bg-white text-ink hover:bg-soft-bg"
                      }`}
                      id={`upvote-btn-${issue._id}`}
                    >
                      <ArrowUp size={11} />
                      <span>Upvote ({issue.upvotes.length})</span>
                    </button>

                    {/* Deletion (Only if pending status) */}
                    {issue.status === "pending" && (
                      <button
                        onClick={() => handleDelete(issue._id)}
                        className="p-2.5 border border-border-light rounded-xl bg-white text-text-light hover:bg-rose-50 hover:text-red-700 hover:border-rose-100 cursor-pointer transition-colors"
                        title="Withdraw Report"
                        id={`delete-btn-${issue._id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
