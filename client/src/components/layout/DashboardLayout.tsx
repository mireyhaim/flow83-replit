import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, PenTool, LogOut, Plus, User, Menu, X, MessageCircle } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
    { icon: PenTool, label: "Flows", href: "/journeys" },
    { icon: MessageCircle, label: "Feedback", href: "/feedback" },
    { icon: User, label: "My Profile", href: "/profile" },
  ];

  const NavContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="Flow83" className="h-10" />
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 text-slate-400 hover:text-slate-600"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
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
                  ? "bg-violet-50 text-violet-700 border border-indigo-100" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "text-violet-600" : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-2">
        <Link 
          href="/journeys/new"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-all w-full justify-center shadow-sm"
        >
          <Plus size={18} />
          New Flow
        </Link>
        <a 
          href="/api/logout"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 w-full transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </a>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="Flow83" className="h-9" />
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-700"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "md:hidden fixed top-0 left-0 h-full w-72 bg-white z-40 flex flex-col transform transition-transform duration-300 ease-in-out shadow-xl",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-200 flex-col fixed h-full z-10">
        <NavContent />
      </aside>

      <main className="flex-1 md:ml-60 min-h-screen bg-slate-50 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
