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
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
          Flow 83
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-900"
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
                  ? "bg-gradient-to-r from-violet-100 to-fuchsia-100 text-gray-900 border border-violet-200" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition-all w-full justify-center shadow-lg shadow-violet-500/20"
        >
          <Plus size={18} />
          New Flow
        </Link>
        <a 
          href="/api/logout"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </a>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 flex font-sans">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Flow 83
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-900"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-30"
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
      <aside className="hidden md:flex w-60 bg-gray-50 border-r border-gray-200 flex-col fixed h-full z-10">
        <NavContent />
      </aside>

      <main className="flex-1 md:ml-60 min-h-screen bg-white pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
