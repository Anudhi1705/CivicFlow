import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { 
  MessageSquare, 
  Plus, 
  AlertCircle, 
  ShieldCheck, 
  Building, 
  Send, 
  ArrowRight,
  ArrowUpDown,
  Filter,
  User,
  Clock
} from "lucide-react";
import { Issue, IssueHistoryEvent } from "../types.ts";

interface ActivityTimelineProps {
  issue: Issue;
  onUpdate: (updatedIssue: Issue) => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ issue, onUpdate }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive Filters and Sorting State
  const [filterType, setFilterType] = useState<"all" | "comments" | "status" | "assignments">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!token) {
      setError("Please sign in to join the conversation.");
      showToast("Please sign in to join the conversation.", "info");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/issues/${issue._id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ comment: commentText.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to post comment");
      }

      const updatedIssue = await res.json();
      onUpdate(updatedIssue);
      setCommentText("");
      showToast("Your comment has been posted to the activity timeline!", "success");
    } catch (err: any) {
      const msg = err.message || "Failed to post comment";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe history array accessor
  const historyList = issue.history || [];

  // Filter history items
  const filteredEvents = historyList.filter(event => {
    if (filterType === "all") return true;
    if (filterType === "comments") return event.type === "comment";
    if (filterType === "status") return event.type === "status_change";
    if (filterType === "assignments") return event.type === "department_assignment";
    return true;
  });

  // Sort history items
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // Render event helper
  const getEventStyles = (type: string) => {
    switch (type) {
      case "creation":
        return {
          icon: <Plus size={14} className="text-blue-600" />,
          bgColor: "bg-blue-50 border-blue-200 text-blue-700",
          label: "Report Initiated"
        };
      case "status_change":
        return {
          icon: <AlertCircle size={14} className="text-amber-600" />,
          bgColor: "bg-amber-50 border-amber-200 text-amber-700",
          label: "Status Shift"
        };
      case "department_assignment":
        return {
          icon: <Building size={14} className="text-indigo-600" />,
          bgColor: "bg-indigo-50 border-indigo-200 text-indigo-700",
          label: "Dispatcher Action"
        };
      case "comment":
      default:
        return {
          icon: <MessageSquare size={14} className="text-emerald-600" />,
          bgColor: "bg-emerald-50 border-emerald-200 text-emerald-700",
          label: "Comment Added"
        };
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800 border border-green-200";
      case "in-progress":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "rejected":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border border-blue-200";
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6" id="activity-timeline-container">
      {/* Timeline Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2">
            <Clock className="text-blue-600" size={18} />
            <span>Activity & Progression Timeline</span>
            <span className="text-xs bg-slate-100 text-slate-500 font-normal px-2 py-0.5 rounded-full font-mono">
              {historyList.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Chronological record of status amendments, assignments, and comments.</p>
        </div>

        {/* Filters and Sorting buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sorting Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition-all"
            title={sortOrder === "desc" ? "Showing Newest First" : "Showing Oldest First"}
            id="timeline-sort-btn"
          >
            <ArrowUpDown size={12} />
            <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
          </button>

          {/* Type Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {(["all", "comments", "status", "assignments"] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                  filterType === type 
                    ? "bg-white text-slate-900 shadow-2xs" 
                    : "text-slate-400 hover:text-slate-700"
                }`}
                id={`timeline-filter-btn-${type}`}
              >
                {type === "all" ? "All" : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Timeline Body */}
      {sortedEvents.length === 0 ? (
        <div className="py-8 text-center text-slate-400 space-y-2">
          <Filter size={24} className="mx-auto opacity-30" />
          <p className="text-sm font-medium">No activity matching your search criteria.</p>
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 py-2 ml-3">
          {sortedEvents.map((event, idx) => {
            const styles = getEventStyles(event.type);
            const isSystem = event.actor.role === "system";
            const isAdmin = event.actor.role === "admin";
            
            return (
              <div key={event._id} className="relative group" id={`timeline-event-${event._id}`}>
                {/* Timeline Dot Indicator */}
                <span className={`absolute -left-[31px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center shadow-2xs z-10 bg-white ${styles.bgColor}`}>
                  {styles.icon}
                </span>

                {/* Event Content card */}
                <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 rounded-xl p-4 transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800 text-xs">
                        {event.actor.name}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                        isAdmin ? "bg-purple-100 text-purple-700" :
                        isSystem ? "bg-slate-200 text-slate-600" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {event.actor.role}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {styles.label}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(event.createdAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short"
                      })}
                    </span>
                  </div>

                  {/* Render specifics based on Event Type */}
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {event.type === "creation" && (
                      <p>
                        Issue submitted successfully under the <span className="font-semibold text-slate-800">{issue.category}</span> category. Status is marked as <span className="font-semibold text-slate-800 uppercase">pending</span>.
                      </p>
                    )}

                    {event.type === "status_change" && (
                      <div className="flex items-center gap-1.5 py-0.5 flex-wrap">
                        <span>Transitioned status from</span>
                        <span className={`uppercase text-[10px] px-1.5 py-0.5 rounded-sm font-semibold ${getStatusBadgeClass(event.statusBefore || "pending")}`}>
                          {event.statusBefore || "pending"}
                        </span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span className={`uppercase text-[10px] px-1.5 py-0.5 rounded-sm font-bold ${getStatusBadgeClass(event.statusAfter || "pending")}`}>
                          {event.statusAfter || "pending"}
                        </span>
                      </div>
                    )}

                    {event.type === "department_assignment" && (
                      <p>
                        Assigned to responding unit: <span className="font-bold text-slate-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{event.department}</span>
                      </p>
                    )}

                    {event.type === "comment" && (
                      <div className="mt-1 bg-white border border-slate-100 p-3 rounded-lg text-slate-700 shadow-2xs italic relative before:absolute before:-top-2 before:left-3 before:w-3 before:h-3 before:bg-white before:border-l before:border-t before:border-slate-100 before:rotate-45">
                        "{event.comment}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Comment Insertion Form */}
      {user ? (
        <form onSubmit={handlePostComment} className="border-t border-slate-100 pt-5 space-y-3" id="timeline-comment-form">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <User size={14} />
            </span>
            <span className="text-xs font-bold text-slate-700">Add a Progress Comment</span>
            <span className="text-[10px] text-slate-400 font-mono">Posting as {user.name} ({user.role})</span>
          </div>

          <div className="space-y-2">
            <textarea
              placeholder="Post a query, general comment, or specific neighborhood note..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full p-3 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl text-xs text-slate-800 h-20 resize-none leading-relaxed"
              maxLength={500}
            />
            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{error}</span>
              </p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-mono">
                {500 - commentText.length} characters left
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 font-bold rounded-lg transition-all text-xs"
                id="submit-comment-btn"
              >
                {isSubmitting ? (
                  <span>Posting...</span>
                ) : (
                  <>
                    <Send size={12} />
                    <span>Post Comment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="border-t border-slate-100 pt-5 text-center">
          <p className="text-xs text-slate-400">
            Have a question or update?{" "}
            <Link to="/signin" className="text-blue-600 font-bold hover:underline">
              Sign In
            </Link>{" "}
            to join the timeline discussion and add comments.
          </p>
        </div>
      )}
    </div>
  );
};
