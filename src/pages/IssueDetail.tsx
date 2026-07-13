import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { MapPicker } from "../components/MapPicker.tsx";
import { ActivityTimeline } from "../components/ActivityTimeline.tsx";
import { StatusBadge } from "../components/StatusBadge.tsx";
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Tag,
  Shield,
  Send,
  Building,
  Info
} from "lucide-react";
import { Issue } from "../types.ts";

export const IssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin dispatch update state
  const [adminStatus, setAdminStatus] = useState<Issue["status"]>("pending");
  const [adminDept, setAdminDept] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false);
  const [adminUpdateError, setAdminUpdateError] = useState<string | null>(null);
  const [adminUpdateSuccess, setAdminUpdateSuccess] = useState(false);

  const fetchIssueDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/issues/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("This community issue report does not exist or has been removed.");
        }
        throw new Error("Failed to retrieve issue details.");
      }
      const data: Issue = await res.json();
      setIssue(data);
      
      // Seed initial admin states
      setAdminStatus(data.status);
      setAdminDept(data.assignedToDepartment || "");
      setAdminNotes(data.adminNotes || "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetail();
  }, [id]);

  const handleUpvote = async () => {
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
      if (!res.ok) throw new Error("Failed to process upvote");
      const updatedIssue = await res.json();
      const hasUpvoted = updatedIssue.upvotes.includes(user._id);
      showToast(
        hasUpvoted 
          ? "Thank you! You have successfully upvoted this neighborhood concern."
          : "Your upvote for this neighborhood concern has been removed.",
        "success"
      );
      setIssue(updatedIssue);
    } catch (err: any) {
      showToast(err.message || "Upvote failed. Please try again.", "error");
    }
  };

  const handleAdminDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || user?.role !== "admin") return;

    setIsUpdatingAdmin(true);
    setAdminUpdateError(null);
    setAdminUpdateSuccess(false);

    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: adminStatus,
          assignedToDepartment: adminDept,
          adminNotes: adminNotes
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update dispatcher records");
      }

      const updatedIssue = await res.json();
      setIssue(updatedIssue);
      setAdminUpdateSuccess(true);
      showToast("City dispatch records and issue status updated successfully!", "success");
      setTimeout(() => setAdminUpdateSuccess(false), 3000);
    } catch (err: any) {
      setAdminUpdateError(err.message);
      showToast(err.message || "Failed to update dispatch records", "error");
    } finally {
      setIsUpdatingAdmin(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-ink border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-ink text-xs font-mono font-bold uppercase">Retrieving issue timeline and details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-4 bg-red-50 border-2 border-red-600 rounded-xs inline-flex items-center justify-center text-red-700">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-syne font-extrabold uppercase text-ink">Issue Not Found</h1>
          <p className="text-ink/60 text-xs font-mono font-bold">{error || "The requested resource could not be found."}</p>
        </div>
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 font-mono text-xs font-bold uppercase bg-white border-2 border-ink hover:bg-paper rounded-xs shadow-xs transition-all"
        >
          <ArrowLeft size={14} />
          <span>Return to Public Feed</span>
        </Link>
      </div>
    );
  }

  const isUpvotedByMe = user && issue.upvotes.includes(user._id);

  return (
    <div id="issue-detail-page" className="space-y-8 py-4 max-w-7xl mx-auto px-4 text-left">
      {/* Back Header navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 border border-border-light bg-white text-ink hover:bg-soft-bg rounded-xl px-4 py-2.5 font-sans font-semibold text-xs uppercase tracking-wide cursor-pointer transition-all self-start"
          id="back-to-feed-btn"
        >
          <ArrowLeft size={14} />
          <span>Back to Previous View</span>
        </button>
        
        <span className="text-[10px] text-accent font-mono bg-soft-bg border border-border-light px-3 py-1 font-bold rounded-full">
          [REF: {issue._id}]
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Columns - Issue details summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main info card */}
          <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-10 shadow-[0_12px_30px_rgba(45,106,79,0.03)] space-y-6">
            <div className="space-y-4">
              {/* Category, Status, Severity Header badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-sans font-bold uppercase bg-[#e8f5e9] text-[#1b4332] border border-[#d8f3dc] rounded-full px-3 py-1.5 flex items-center gap-1">
                  <Tag size={10} />
                  <span>{issue.category}</span>
                </span>
                <span className={`text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1.5 border rounded-full ${
                  issue.severity === "critical" ? "bg-rose-50 text-[#b71c1c] border-rose-100" :
                  issue.severity === "high" ? "bg-amber-50 text-[#f57f17] border-amber-100" :
                  issue.severity === "medium" ? "bg-blue-50 text-[#0d47a1] border-blue-100" :
                  "bg-slate-50 text-slate-700 border-slate-100"
                }`}>
                  {issue.severity} Priority
                </span>
                <StatusBadge status={issue.status} size="sm" />
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-ink leading-tight">
                  {issue.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-light font-sans font-normal pb-3 border-b border-border-light">
                  <span className="flex items-center gap-1">
                    <User size={13} className="text-text-light/60" />
                    <span>Reported by <strong className="font-semibold text-ink">{issue.reportedBy.name}</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-text-light/60" />
                    <span>Submitted {new Date(issue.createdAt).toLocaleDateString()}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-text-light/60" />
                    <span>Last active {new Date(issue.updatedAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-text-light font-sans leading-relaxed space-y-4 pt-2">
                <p className="whitespace-pre-wrap">{issue.description}</p>
              </div>
            </div>

            {/* Optional Attached photo representation */}
            {issue.imageUrl && (
              <div className="border border-border-light rounded-2xl overflow-hidden bg-soft-bg shadow-xs">
                <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-light p-3 bg-white border-b border-border-light">ATTACHED REPORT PHOTO</p>
                <img
                  src={issue.imageUrl}
                  alt={issue.title}
                  className="max-h-96 w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Upvote support bar */}
            <div className="flex items-center justify-between pt-5 border-t border-border-light">
              <div className="space-y-0.5 text-left">
                <p className="text-xs font-sans font-bold text-ink uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp size={13} className="text-accent" />
                  <span>Upvote Counter</span>
                </p>
                <p className="text-[10px] text-text-light font-sans font-normal">{issue.upvotes.length} residents have certified this concern.</p>
              </div>

              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-border-light font-sans font-semibold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                  isUpvotedByMe
                    ? "bg-accent text-white border-transparent shadow-md shadow-accent/15"
                    : "bg-white text-ink hover:bg-soft-bg"
                }`}
                id="detail-upvote-btn"
              >
                <span>{isUpvotedByMe ? "Upvoted ✓" : "Upvote Report"}</span>
                <span className={`px-1.5 py-0.5 border rounded-md text-[10px] ml-1 ${isUpvotedByMe ? "bg-white/20 border-white/35 text-white" : "bg-soft-bg border-border-light text-ink"}`}>
                  {issue.upvotes.length}
                </span>
              </button>
            </div>
          </div>

          {/* Location details & Map display read-only */}
          <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 space-y-4 shadow-[0_12px_30px_rgba(45,106,79,0.03)]">
            <div className="space-y-1 text-left">
              <h3 className="font-sans font-bold text-xl tracking-tight text-ink flex items-center gap-1.5 leading-tight">
                <MapPin className="text-accent" size={16} />
                <span>Geographic Location Pin</span>
              </h3>
              <p className="text-[10px] text-text-light font-sans font-normal uppercase tracking-wider">Exact coordinates and street address logged by reporter.</p>
            </div>

            <div className="bg-soft-bg border border-border-light rounded-xl p-3 text-xs font-sans font-semibold text-[#1b4332] flex items-center gap-2 text-left">
              <MapPin size={14} className="text-text-light shrink-0" />
              <span><span className="font-bold uppercase text-text-light mr-1">Address:</span> {issue.location.address || "CivicFlow District GPS Coordinate"}</span>
            </div>

            <div className="overflow-hidden border border-border-light rounded-2xl shadow-xs">
              <MapPicker
                lat={issue.location.lat}
                lng={issue.location.lng}
                address={issue.location.address}
                readOnly={true}
                onChange={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Right Column - interactive Activity timeline and Admin controls */}
        <div className="space-y-6">
          {/* Admin controller card if logged-in user is admin */}
          {user?.role === "admin" && (
            <div className="bg-soft-bg border border-border-light rounded-3xl p-6 space-y-4" id="admin-dispatch-panel">
              <div className="space-y-1 text-left">
                <h3 className="font-sans font-bold text-xl uppercase tracking-tight text-ink flex items-center gap-1.5 leading-tight">
                  <Shield className="text-accent" size={16} />
                  <span>City Dispatch Desk</span>
                </h3>
                <p className="text-[10px] text-text-light font-sans font-normal uppercase tracking-wider">Modify dispatch status, allocate departments, and submit reports.</p>
              </div>

              <form onSubmit={handleAdminDispatchSubmit} className="space-y-4 text-xs">
                {/* Status selector */}
                <div className="space-y-1 text-left">
                  <label className="font-sans text-[11px] font-bold uppercase text-text-light block mb-1">Current Status</label>
                  <select
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value as any)}
                    className="w-full px-4 py-3 border border-border-light rounded-xl bg-white text-ink font-sans text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="in-progress">In Active Repair</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Department allocation */}
                <div className="space-y-1 text-left">
                  <label className="font-sans text-[11px] font-bold uppercase text-text-light block mb-1">Assigned Department</label>
                  <select
                    value={adminDept}
                    onChange={(e) => setAdminDept(e.target.value)}
                    className="w-full px-4 py-3 border border-border-light rounded-xl bg-white text-ink font-sans text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="">Unassigned (Pending Allocation)</option>
                    <option value="Public Works - Roads Division">Public Works - Roads Division</option>
                    <option value="Environmental Services - Sanitation">Environmental Services - Sanitation</option>
                    <option value="Streetlights & Electricity Board">Streetlights & Electricity Board</option>
                    <option value="Water Supply & Sewerage Unit">Water Supply & Sewerage Unit</option>
                    <option value="CivicFlow City Parks & Forestry">CivicFlow City Parks & Forestry</option>
                  </select>
                </div>

                {/* Dispatch Notes */}
                <div className="space-y-1 text-left">
                  <label className="font-sans text-[11px] font-bold uppercase text-text-light block mb-1">Official Dispatch Notes / Comments</label>
                  <textarea
                    placeholder="Provide scheduler comments, repair times, or instructions..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-border-light rounded-xl bg-white text-ink font-sans text-xs font-normal focus:outline-hidden h-24 resize-none leading-relaxed placeholder-text-light/40"
                  />
                </div>

                {adminUpdateError && (
                  <p className="text-rose-900 bg-rose-50 border border-rose-100 rounded-xl p-3 font-sans font-semibold text-[10px] uppercase text-left">
                    {adminUpdateError}
                  </p>
                )}

                {adminUpdateSuccess && (
                  <p className="text-green-900 bg-green-50 border border-green-100 rounded-xl p-3 font-sans font-semibold text-[10px] uppercase text-left">
                    Dispatcher logs and timeline updated successfully!
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isUpdatingAdmin}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-3.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-accent/15"
                  id="admin-submit-dispatch-btn"
                >
                  {isUpdatingAdmin ? "Updating logs..." : "Apply Changes"}
                </button>
              </form>
            </div>
          )}

          {/* Interactive activity timeline component */}
          <ActivityTimeline issue={issue} onUpdate={setIssue} />
        </div>
      </div>
    </div>
  );
};
