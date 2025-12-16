import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, PenTool, LogOut, Plus, User, Search, Bell } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
    { icon: PenTool, label: "Flows", href: "/journeys" },
    { icon: User, label: "My Profile", href: "/profile" },
    { icon: Bell, label: "Notifications", href: "/settings/notifications" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white flex font-sans">
      <aside className="w-60 bg-[#1a1a2e]/80 backdrop-blur-xl border-r border-white/5 flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            Flow 83
          </Link>
        </div>

        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <Search size={16} className="text-white/40" aria-hidden="true" />
            <input 
              type="text" 
              placeholder="Search..." 
              aria-label="Search flows and content"
              className="bg-transparent border-none outline-none text-sm text-white/70 placeholder:text-white/30 w-full"
              data-testid="input-dashboard-search"
            />
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/30" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "text-violet-400" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-2">
          <Link 
            href="/journeys/new"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition-all w-full justify-center shadow-lg shadow-violet-500/20"
          >
            <Plus size={18} />
            New Flow
          </Link>
          <a 
            href="/api/logout"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white w-full transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </a>
        </div>
      </aside>

      <main className="flex-1 ml-60 min-h-screen bg-[#0f0f23]">
        <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
