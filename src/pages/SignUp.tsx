import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { UserPlus, Mail, Lock, User, Phone, MapPin, ArrowRight } from "lucide-react";

export const SignUp: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/citizen/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, address })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      login(data.user, data.token);
      showToast(`Welcome to CivicFlow, ${data.user.name}! Your citizen account has been successfully created.`, "success");
      navigate("/citizen");
    } catch (err: any) {
      const msg = err.message || "Failed to create account. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="signup-page" className="max-w-7xl mx-auto py-6 px-4">
      <div className="grid lg:grid-cols-12 border border-ink bg-paper overflow-hidden">
        
        {/* Left Display Hero Panel */}
        <section className="lg:col-span-7 p-8 md:p-16 flex flex-col justify-center dot-grid border-b lg:border-b-0 lg:border-r border-ink min-h-[350px] lg:min-h-[600px]">
          <span className="font-mono text-xs uppercase tracking-widest text-accent mb-6 font-bold block">
            [ BUILD THE FUTURE ]
          </span>
          <h2 className="font-serif italic font-medium text-5xl md:text-7xl xl:text-8xl tracking-tighter uppercase leading-[0.85] text-ink text-left">
            Better<br />Cities<br />Start<br />Here.
          </h2>
        </section>

        {/* Right Form Panel */}
        <section className="lg:col-span-5 bg-[#fdfdfb] p-6 md:p-10 flex flex-col justify-center text-left">
          <div className="mb-8">
            <span className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-accent block mb-2">
              Registration [01]
            </span>
            <h3 className="font-serif italic font-semibold text-3xl tracking-tight text-ink">
              Create Citizen Account
            </h3>
            <p className="text-xs text-ink/80 mt-1 font-sans font-medium">
              Join CivicFlow and improve your neighborhood.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-600 text-xs font-mono text-red-900 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-ink block">
                Full Name *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50">
                  <User size={15} strokeWidth={2} />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-9 pr-4 py-2.5 bg-paper/20 border border-ink focus:bg-paper/40 focus:outline-hidden text-xs text-ink font-bold font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-ink block">
                Email Address *
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
                  placeholder="jane@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-paper/20 border border-ink focus:bg-paper/40 focus:outline-hidden text-xs text-ink font-bold font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-ink block">
                Password *
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
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  className="w-full pl-9 pr-4 py-2.5 bg-paper/20 border border-ink focus:bg-paper/40 focus:outline-hidden text-xs text-ink font-bold font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-ink block">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50">
                  <Phone size={15} strokeWidth={2} />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full pl-9 pr-4 py-2.5 bg-paper/20 border border-ink focus:bg-paper/40 focus:outline-hidden text-xs text-ink font-bold font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-ink block">
                Home Neighborhood/Address (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50">
                  <MapPin size={15} strokeWidth={2} />
                </span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Civic Heights, CivicFlow"
                  className="w-full pl-9 pr-4 py-2.5 bg-paper/20 border border-ink focus:bg-paper/40 focus:outline-hidden text-xs text-ink font-bold font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 px-4 bg-ink text-paper border border-ink font-mono text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-ink transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              id="signup-submit-btn"
            >
              <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          </form>

          <p className="text-center font-sans text-xs text-ink/60 mt-8">
            Already have an account?{" "}
            <Link to="/signin" className="text-ink font-bold underline hover:text-accent">
              Sign In
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};
