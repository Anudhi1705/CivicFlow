import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { KeyRound, Mail, Lock, Sparkles, Building, ArrowRight, User } from "lucide-react";

export const SignIn: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<"citizen" | "admin">("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = role === "admin" ? "/api/auth/admin/signin" : "/api/auth/citizen/signin";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Sign in failed");
      }

      login(data.user, data.token);
      showToast(`Welcome back, ${data.user.name}! Successfully signed in as ${data.user.role}.`, "success");
      
      // Redirect based on role
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/citizen");
      }
    } catch (err: any) {
      const msg = err.message || "Something went wrong. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const autofillAdmin = () => {
    setRole("admin");
    setEmail("admin@civicflow.gov");
    setPassword("admin123");
    setError(null);
  };

  const autofillCitizen = () => {
    setRole("citizen");
    setEmail("jane@example.com");
    setPassword("password");
    setError("Note: Registered citizens can sign in here. For quick testing, you can sign up a new account!");
  };

  return (
    <div id="signin-page" className="max-w-7xl mx-auto py-6 px-4">
      <div className="grid lg:grid-cols-12 border border-ink bg-paper overflow-hidden">
        
        {/* Left Display Hero Panel */}
        <section className="lg:col-span-7 p-8 md:p-16 flex flex-col justify-center dot-grid border-b lg:border-b-0 lg:border-r border-ink min-h-[300px] lg:min-h-[600px]">
          <span className="font-mono text-xs uppercase tracking-widest text-accent mb-6 font-bold block">
            [ PORTAL HUB ]
          </span>
          <h2 className="font-serif italic font-medium text-5xl md:text-7xl xl:text-8xl tracking-tighter uppercase leading-[0.85] text-ink text-left">
            Better<br />Cities<br />Start<br />Here.
          </h2>
        </section>

        {/* Right Form Panel */}
        <section className="lg:col-span-5 bg-[#fdfdfb] p-6 md:p-10 flex flex-col justify-center text-left">
          <div className="mb-6">
            <span className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-accent block mb-2">
              Authentication [02]
            </span>
            <h3 className="font-serif italic font-semibold text-3xl tracking-tight text-ink">
              Sign In to CivicFlow
            </h3>
            <p className="text-xs text-ink/80 mt-1 font-sans font-medium">
              Access your neighborhood workspace and submit municipal dispatches.
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 border border-ink p-1 bg-paper mb-6">
            <button
              type="button"
              onClick={() => { setRole("citizen"); setError(null); }}
              className={`py-2 text-xs font-mono uppercase font-extrabold tracking-wider transition-all cursor-pointer ${
                role === "citizen"
                  ? "bg-ink text-paper"
                  : "text-ink/60 hover:text-ink hover:bg-ink/5"
              }`}
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => { setRole("admin"); setError(null); }}
              className={`py-2 text-xs font-mono uppercase font-extrabold tracking-wider transition-all cursor-pointer ${
                role === "admin"
                  ? "bg-ink text-paper"
                  : "text-ink/60 hover:text-ink hover:bg-ink/5"
              }`}
            >
              Admin
            </button>
          </div>

          {error && (
            <div className={`mb-6 p-4 border text-xs font-mono font-semibold ${
              error.includes("Note:") 
                ? "bg-amber-50/50 border-amber-600 text-amber-900" 
                : "bg-red-50 border-red-600 text-red-900"
            }`}>
              {error}
            </div>
          )}

          {/* Demo Quick Fills */}
          <div className="bg-paper/30 border border-ink/20 p-4 space-y-2.5 mb-6">
            <p className="text-[10px] font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
              <Sparkles size={12} className="text-accent" strokeWidth={2} />
              <span>Developer Sandbox Presets</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={autofillAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase bg-white border border-ink hover:bg-paper text-ink transition-all cursor-pointer"
              >
                <Building size={11} strokeWidth={2} />
                <span>Fill Admin Demo</span>
              </button>
              <button
                type="button"
                onClick={autofillCitizen}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase bg-white border border-ink hover:bg-paper text-ink transition-all cursor-pointer"
              >
                <User size={11} strokeWidth={2} />
                <span>Fill Citizen Demo</span>
              </button>
            </div>
            <p className="text-[9px] text-ink/60 font-sans font-medium leading-normal">
              Preload authorization headers to immediately access either citizen reporting dashboards or Chief Administrator panels.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-ink block">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50">
                  <Mail size={15} strokeWidth={2} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-paper/20 border border-ink focus:bg-paper/40 focus:outline-hidden text-xs text-ink font-bold font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-ink block">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50">
                  <Lock size={15} strokeWidth={2} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-paper/20 border border-ink focus:bg-paper/40 focus:outline-hidden text-xs text-ink font-bold font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 px-4 bg-ink text-paper border border-ink font-mono text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-ink transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              id="signin-submit-btn"
            >
              <span>{isLoading ? "Signing In..." : "Sign In"}</span>
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          </form>

          {role === "citizen" && (
            <p className="text-center font-sans text-xs text-ink/60 mt-8">
              New to CivicFlow?{" "}
              <Link to="/signup" className="text-ink font-bold underline hover:text-accent">
                Create an account
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
};
