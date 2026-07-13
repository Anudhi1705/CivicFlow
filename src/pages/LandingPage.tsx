import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Issue } from "../types.ts";

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const res = await fetch("/api/issues");
        if (res.ok) {
          const data: Issue[] = await res.json();
          setRecentIssues(data.slice(0, 3));
          
          const total = data.length;
          const resolved = data.filter(i => i.status === "resolved").length;
          const active = data.filter(i => i.status === "in-progress").length;
          const pending = data.filter(i => i.status === "pending").length;
          setStats({ total, resolved, active, pending });
        }
      } catch (err) {
        console.error("Error fetching landing data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  // Pad numbers with leading zeros (e.g. 004), matching the requested design exactly
  const formatStat = (num: number) => {
    return String(num).padStart(3, "0");
  };

  // Safe status label formatter
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resolved": return "Resolved";
      case "in-progress": return "In Progress";
      case "pending": return "Pending Review";
      case "new": return "Pending Review";
      case "rejected": return "Closed / Rejected";
      default: return "Pending Review";
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-between" id="landing-container">
      {/* Background Line Texture overlay */}
      <div className="absolute inset-0 line-texture pointer-events-none -z-10" />

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 border-b border-border-light">
        
        {/* Left Column: Hero Text */}
        <section className="lg:col-span-7 p-8 sm:p-12 lg:p-16 lg:border-r border-border-light flex flex-col justify-between text-left">
          <div className="space-y-6 sm:space-y-8 max-w-xl">
            <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-accent">
              [CIVICFLOW DISTRICT / 01]
            </span>
            
            <h1 className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight text-ink tracking-tight">
              Better Cities<br />
              Start Here.
            </h1>
            
            <p className="text-sm sm:text-base text-text-light leading-relaxed font-sans font-normal">
              CivicFlow is the modern ecological portal for citizens to instantly file municipal reports, track circular economy initiatives, and contribute to local sustainability.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to={user ? "/report" : "/signup"}
                className="px-8 py-4 bg-accent text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-xl shadow-lg shadow-accent/10 hover:bg-ink hover:translate-y-[-1px] transition-all text-center"
                id="cta-report-btn"
              >
                Report Issue
              </Link>
              <Link
                to="/feed"
                className="px-8 py-4 bg-white text-ink font-sans text-xs font-semibold uppercase tracking-wider rounded-xl border border-border-light shadow-sm hover:bg-soft-bg hover:translate-y-[-1px] transition-all text-center"
                id="cta-feed-btn"
              >
                Public Ledger
              </Link>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="stats-strip mt-12 pt-8 border-t border-border-light flex flex-wrap gap-x-12 gap-y-6">
            <div className="stat-block">
              <span className="text-[10px] font-mono uppercase text-text-light font-bold block leading-none mb-1">Total Ledger</span>
              <span className="font-sans font-bold text-4xl text-ink block leading-none mt-1">{formatStat(stats.total || 4)}</span>
            </div>
            <div className="stat-block">
              <span className="text-[10px] font-mono uppercase text-text-light font-bold block leading-none mb-1">Operational</span>
              <span className="font-sans font-bold text-4xl text-ink block leading-none mt-1">{formatStat(stats.resolved || 1)}</span>
            </div>
            <div className="stat-block">
              <span className="text-[10px] font-mono uppercase text-text-light font-bold block leading-none mb-1">Eco Priority</span>
              <span className="font-sans font-bold text-4xl text-accent block leading-none mt-1">92%</span>
            </div>
          </div>
        </section>

        {/* Right Column: Dynamic Reports List */}
        <section className="lg:col-span-5 p-8 sm:p-12 lg:p-16 bg-soft-bg/50 flex flex-col justify-start text-left">
          <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-accent mb-10 block">
            LATEST MUNICIPAL ENTRIES
          </span>

          {isLoading ? (
            <div className="space-y-8 animate-pulse">
              {[1, 2, 3].map(n => (
                <div key={n} className="border border-border-light p-6 bg-white space-y-3 rounded-2xl shadow-sm">
                  <div className="h-4 bg-ink/10 w-1/3 rounded-xs" />
                  <div className="h-6 bg-ink/10 w-2/3 rounded-xs" />
                  <div className="h-4 bg-ink/10 w-full rounded-xs" />
                </div>
              ))}
            </div>
          ) : recentIssues.length === 0 ? (
            // Custom elegant Cards matching exact new style
            <div className="space-y-8">
              <div className="relative border border-border-light p-6 bg-white rounded-2xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] hover:shadow-[0_20px_40px_rgba(45,106,79,0.06)] hover:translate-y-[-2px] transition-all text-left">
                <span className="absolute -top-3 left-4 bg-ink text-white font-mono text-[9px] uppercase px-2.5 py-0.5 tracking-wider font-bold rounded-full">Critical</span>
                <h3 className="font-sans font-bold text-lg text-ink mt-2 mb-1">Leaking Main: Maple</h3>
                <p className="text-xs text-text-light leading-relaxed font-sans font-normal mb-4">
                  Water is bubbling up through the asphalt on Maple Avenue near House #452. Flows are constant.
                </p>
                <div className="border-t border-border-light pt-3 flex justify-between items-center text-[10px] font-mono text-text-light">
                  <span className="truncate max-w-[70%] font-semibold">Water & Sewer</span>
                  <Link to="/feed" className="text-accent font-bold hover:underline transition-all">
                    Logs →
                  </Link>
                </div>
              </div>

              <div className="relative border border-border-light p-6 bg-white rounded-2xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] hover:shadow-[0_20px_40px_rgba(45,106,79,0.06)] hover:translate-y-[-2px] transition-all text-left">
                <span className="absolute -top-3 left-4 bg-ink text-white font-mono text-[9px] uppercase px-2.5 py-0.5 tracking-wider font-bold rounded-full">Medium</span>
                <h3 className="font-sans font-bold text-lg text-ink mt-2 mb-1">Streetlight Dark</h3>
                <p className="text-xs text-text-light leading-relaxed font-sans font-normal mb-4">
                  The streetlight directly in front of the public library entrance has been dark for over a week.
                </p>
                <div className="border-t border-border-light pt-3 flex justify-between items-center text-[10px] font-mono text-text-light">
                  <span className="truncate max-w-[70%] font-semibold">Electrical</span>
                  <Link to="/feed" className="text-accent font-bold hover:underline transition-all">
                    Logs →
                  </Link>
                </div>
              </div>

              <div className="relative border border-border-light p-6 bg-white rounded-2xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] hover:shadow-[0_20px_40px_rgba(45,106,79,0.06)] hover:translate-y-[-2px] transition-all text-left">
                <span className="absolute -top-3 left-4 bg-accent text-white font-mono text-[9px] uppercase px-2.5 py-0.5 tracking-wider font-bold rounded-full">In Progress</span>
                <h3 className="font-sans font-bold text-lg text-ink mt-2 mb-1">Oak St Pothole</h3>
                <p className="text-xs text-text-light leading-relaxed font-sans font-normal mb-4">
                  A very large pothole has formed near the intersection of Oak Street and 5th Avenue. Dangerous.
                </p>
                <div className="border-t border-border-light pt-3 flex justify-between items-center text-[10px] font-mono text-text-light">
                  <span className="truncate max-w-[70%] font-semibold">Roads</span>
                  <Link to="/feed" className="text-accent font-bold hover:underline transition-all">
                    Logs →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {recentIssues.map((issue) => (
                <div key={issue._id} className="relative border border-border-light p-6 bg-white rounded-2xl shadow-[0_12px_30px_rgba(45,106,79,0.03)] hover:shadow-[0_20px_40px_rgba(45,106,79,0.06)] hover:translate-y-[-2px] transition-all text-left">
                  <span className="absolute -top-3 left-4 bg-ink text-white font-mono text-[9px] uppercase px-2.5 py-0.5 tracking-wider font-bold rounded-full">
                    {issue.severity}
                  </span>
                  <h3 className="font-sans font-bold text-lg text-ink mt-2 mb-1">{issue.title}</h3>
                  <p className="text-xs text-text-light leading-relaxed font-sans font-normal mb-4 line-clamp-3">
                    {issue.description}
                  </p>
                  <div className="border-t border-border-light pt-3 flex justify-between items-center text-[10px] font-mono text-text-light">
                    <span className="truncate max-w-[70%] font-semibold">{issue.category}</span>
                    <Link to={`/issues/${issue._id}`} className="text-accent font-bold hover:underline transition-all">
                      Logs →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
