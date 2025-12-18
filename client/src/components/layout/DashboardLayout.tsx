import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, PenTool, LogOut, Plus, User, Search, Bell, Menu, X, MessageCircle } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
    { icon: PenTool, label: "Flows", href: "/journeys" },
    { icon: MessageCircle, label: "Feedback", href: "/feedback" },
    { icon: User, label: "My Profile", href: "/profile" },
    { icon: Bell, label: "Notifications", href: "/settings/notifications" },
  ];

  const NavContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
          Flow 83
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 text-white/60 hover:text-white"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-4 mb-4 hidden md:block">
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
              onClick={() => setMobileMenuOpen(false)}
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
          onClick={() => setMobileMenuOpen(false)}
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
    </>
  );

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white flex font-sans">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-[#1a1a2e]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Flow 83
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-white/60 hover:text-white"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "md:hidden fixed top-0 left-0 h-full w-72 bg-[#1a1a2e] z-40 flex flex-col transform transition-transform duration-300 ease-in-out",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#1a1a2e]/80 backdrop-blur-xl border-r border-white/5 flex-col fixed h-full z-10">
        <NavContent />
      </aside>

      <main className="flex-1 md:ml-60 min-h-screen bg-[#0f0f23] pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
