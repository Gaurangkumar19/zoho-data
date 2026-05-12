import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Database, Upload, Search } from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Database },
  { to: "/search", label: "Search", icon: Search },
  { to: "/upload", label: "Upload", icon: Upload },
];

export function AppLayout() {
  const loc = useLocation();
  return (
    <div className="flex min-h-screen dark-background relative">
      {/* 3D Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large left shape */}
        <div 
          className="bg-shape-3d animate-float-slow"
          style={{
            width: '500px',
            height: '500px',
            top: '-100px',
            left: '-150px',
            animationDelay: '0s'
          }}
        />
        {/* Medium top-right shape */}
        <div 
          className="bg-shape-3d animate-float-slow"
          style={{
            width: '350px',
            height: '350px',
            top: '50px',
            right: '-100px',
            animationDelay: '-4s'
          }}
        />
        {/* Small bottom-right shape */}
        <div 
          className="bg-shape-3d animate-float-fast"
          style={{
            width: '250px',
            height: '250px',
            bottom: '100px',
            right: '100px',
            animationDelay: '-2s'
          }}
        />
        {/* Extra small shape */}
        <div 
          className="bg-shape-3d animate-float-fast"
          style={{
            width: '180px',
            height: '180px',
            bottom: '250px',
            left: '20%',
            animationDelay: '-6s'
          }}
        />
      </div>

      <aside className="hidden md:flex w-64 flex-col text-sidebar-foreground relative overflow-hidden z-20"
        style={{
          background: "linear-gradient(180deg, rgba(5, 18, 26, 0.95) 0%, rgba(10, 31, 46, 0.98) 100%)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-40 opacity-60 pointer-events-none"
          style={{ background: "radial-gradient(400px 200px at 30% 0%, rgba(0, 212, 255, 0.3), transparent 70%)" }}
        />
        <div className="relative px-6 py-6 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg animate-pulse-glow-teal">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-teal-glow">ZOHO DATA</h1>
              <p className="text-[10px] uppercase tracking-widest text-cyan-200/50">Deal Inventory</p>
            </div>
          </div>
        </div>
        <nav className="relative flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }, index) => {
            const active = to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 shadow-md shadow-cyan-500/20 border border-cyan-500/30"
                    : "text-cyan-100/70 hover:bg-cyan-500/10 hover:text-cyan-100 hover:translate-x-1"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="relative px-5 py-4 border-t border-cyan-500/20 text-[11px] text-cyan-200/40">
          v1.0
        </div>
      </aside>
      <main className="flex-1 min-w-0 relative z-10">
        <header className="md:hidden flex items-center gap-3 border-b border-cyan-500/20 bg-slate-900/90 text-cyan-100 px-4 py-3 overflow-x-auto z-20 relative">
          <span className="font-bold text-teal-glow">ZOHO DATA</span>
          {nav.map(({ to, label }) => (
            <Link key={to} to={to} className="text-xs px-2 py-1 rounded hover:bg-cyan-500/10 transition-colors">
              {label}
            </Link>
          ))}
        </header>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
