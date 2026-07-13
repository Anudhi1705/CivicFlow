import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { LandingPage } from "./pages/LandingPage.tsx";
import { SignIn } from "./pages/SignIn.tsx";
import { SignUp } from "./pages/SignUp.tsx";
import { CitizenHome } from "./pages/CitizenHome.tsx";
import { ReportIssue } from "./pages/ReportIssue.tsx";
import { AdminHome } from "./pages/AdminHome.tsx";
import { PublicFeed } from "./pages/PublicFeed.tsx";
import { IssueDetail } from "./pages/IssueDetail.tsx";
import { EcoHub } from "./pages/EcoHub.tsx";
import { WardBoard } from "./pages/WardBoard.tsx";

// Helper components for routing guards
const CitizenRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-slate-400 font-mono text-xs">Verifying session...</div>;
  if (!user || user.role !== "citizen") return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-slate-400 font-mono text-xs">Verifying session...</div>;
  if (!user || user.role !== "admin") return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-ink font-sans">
      
      {/* Responsive Header for Mobile / Tablet */}
      <header className="lg:hidden bg-accent text-white p-4 flex items-center justify-between border-b border-border-light select-none shrink-0">
        <Link to="/" className="font-sans font-bold text-lg tracking-tight hover:text-accent-light transition-colors">
          CivicFlow
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/feed"
            className={`font-mono text-[10px] uppercase tracking-wider font-bold ${
              isActive("/feed") ? "text-white underline underline-offset-4" : "text-white/70 hover:text-white"
            }`}
          >
            Feed
          </Link>
          <Link
            to="/wards"
            className={`font-mono text-[10px] uppercase tracking-wider font-bold ${
              isActive("/wards") ? "text-white underline underline-offset-4" : "text-white/70 hover:text-white"
            }`}
          >
            Wards
          </Link>
          <Link
            to="/ecohub"
            className={`font-mono text-[10px] uppercase tracking-wider font-bold ${
              isActive("/ecohub") ? "text-white underline underline-offset-4" : "text-white/70 hover:text-white"
            }`}
          >
            EcoHub
          </Link>
          {user ? (
            <Link
              to={user.role === "admin" ? "/admin" : "/citizen"}
              className="font-mono text-[10px] bg-white/20 px-2 py-1 rounded text-white font-bold"
            >
              Dash
            </Link>
          ) : (
            <Link
              to="/signin"
              className="font-mono text-[10px] bg-white/20 px-2 py-1 rounded text-white font-bold"
            >
              Login
            </Link>
          )}
        </nav>
      </header>

      {/* Elegant Nav Rail Sidebar for Desktop (80px wide) */}
      <aside className="hidden lg:flex w-20 bg-accent text-white flex-col items-center py-8 justify-between select-none shrink-0 h-screen sticky top-0 border-r border-border-light">
        
        {/* Top Logo and Navigation */}
        <div className="flex flex-col items-center gap-12 w-full">
          {/* Circular/Rounded Logo */}
          <Link to="/" title="CivicFlow Home" className="group">
            <div className="w-10 h-10 bg-accent-light/20 hover:bg-accent-light/45 text-white rounded-xl flex items-center justify-center transition-all">
              <span className="font-sans font-extrabold text-sm tracking-tighter">CF</span>
            </div>
          </Link>

          {/* Rotated Nav Items */}
          <nav className="flex flex-col gap-14 items-center pt-4 w-full">
            <Link
              to="/ecohub"
              className={`font-mono text-[10px] font-bold uppercase tracking-widest transition-all [writing-mode:vertical-lr] rotate-180 py-2 hover:text-white ${
                isActive("/ecohub") ? "text-white scale-105" : "text-white/50"
              }`}
            >
              Eco Hub
            </Link>
            <Link
              to="/wards"
              className={`font-mono text-[10px] font-bold uppercase tracking-widest transition-all [writing-mode:vertical-lr] rotate-180 py-2 hover:text-white ${
                isActive("/wards") ? "text-white scale-105" : "text-white/50"
              }`}
            >
              Ward Map
            </Link>
            <Link
              to="/feed"
              className={`font-mono text-[10px] font-bold uppercase tracking-widest transition-all [writing-mode:vertical-lr] rotate-180 py-2 hover:text-white ${
                isActive("/feed") ? "text-white scale-105" : "text-white/50"
              }`}
            >
              News Feed
            </Link>
          </nav>
        </div>

        {/* Bottom Profile / Auth Area */}
        <div className="flex flex-col items-center gap-6 w-full px-2 border-t border-white/10 pt-6">
          {user ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <Link
                to={user.role === "admin" ? "/admin" : "/citizen"}
                title="Go to Dashboard"
                className="w-8 h-8 rounded-full bg-accent-light text-accent font-bold text-xs flex items-center justify-center hover:opacity-90 transition-all uppercase"
              >
                {user.name.slice(0, 2)}
              </Link>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/60 hover:text-red-300 transition-colors cursor-pointer"
              >
                Exit
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Link
                to="/signin"
                className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent-light hover:text-white transition-colors"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area (taking remaining width) */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-6 sm:p-12 lg:p-20 relative overflow-y-auto bg-white">
          {/* Background overlay line-texture */}
          <div className="absolute inset-0 line-texture pointer-events-none -z-10" />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/feed" element={<PublicFeed />} />
            <Route path="/wards" element={<WardBoard />} />
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route path="/ecohub" element={<EcoHub />} />
            
            {/* Protected Citizen Routes */}
            <Route
              path="/citizen"
              element={
                <CitizenRoute>
                  <CitizenHome />
                </CitizenRoute>
              }
            />
            <Route
              path="/report"
              element={
                <CitizenRoute>
                  <ReportIssue />
                </CitizenRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminHome />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Elegant design footer strip */}
        <footer className="bg-white border-t border-border-light py-5 px-6 sm:px-12 lg:px-20 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-[10px] tracking-wider uppercase text-text-light">
          <div>CIVICFLOW DISTRICT — CIVIL LEDGER & ENVIRONMENTAL PORTAL</div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded bg-accent animate-pulse" />
            <span>V2.0.4 NAMMA KASA SYSTEM CORE</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
