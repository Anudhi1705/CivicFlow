import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { LogOut, Building2, HelpCircle } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
      isActive(path)
        ? "text-accent border-b-2 border-accent pb-1"
        : "text-ink/75 hover:text-ink hover:border-b hover:border-ink pb-1"
    }`;

  return (
    <header id="app-navbar" className="bg-paper border-b border-ink sticky top-0 z-40 py-6 px-4 sm:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-3 items-center">
        {/* Left Side: Navigation Links */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/feed" className={navLinkClass("/feed")}>
            Feed
          </Link>
          <Link to="/wards" className={navLinkClass("/wards")}>
            Wards
          </Link>
          <Link to="/ecohub" className={navLinkClass("/ecohub")}>
            EcoHub
          </Link>
        </div>

        {/* Center: Cormorant Garamond Logo */}
        <div className="text-center">
          <Link to="/" className="font-serif text-2xl sm:text-3xl italic font-semibold text-ink tracking-tight select-none">
            CivicFlow
          </Link>
        </div>

        {/* Right Side: Auth / Actions */}
        <div className="flex items-center justify-end font-mono text-[10px] sm:text-xs tracking-widest font-bold">
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] font-bold text-ink uppercase">{user.name}</span>
                <span className="text-[8px] font-mono tracking-widest text-accent font-extrabold">
                  {user.role}
                </span>
              </div>
              
              <Link 
                to={user.role === "admin" ? "/admin" : "/citizen"} 
                className="border border-ink px-2 py-1 sm:px-3 sm:py-1.5 hover:bg-ink hover:text-paper transition-all uppercase"
              >
                Dash
              </Link>

              <button
                onClick={handleLogout}
                className="p-1 text-ink/75 hover:text-red-700 transition-all cursor-pointer"
                title="Sign Out"
                id="navbar-signout-btn"
              >
                <LogOut size={14} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-6">
              <Link
                to="/signin"
                className="text-ink hover:text-accent transition-all"
                id="navbar-signin-btn"
              >
                SIGN IN
              </Link>
              <Link
                to="/signup"
                className="border border-ink px-3 py-1 sm:px-4 sm:py-1.5 hover:bg-ink hover:text-paper transition-all"
                id="navbar-signup-btn"
              >
                JOIN
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
