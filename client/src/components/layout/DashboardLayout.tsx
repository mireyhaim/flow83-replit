import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, BookOpen, PenTool, Users, Settings, LogOut, ChevronRight } from "lucide-react";
import logo from "@assets/generated_images/minimalist_abstract_logo_for_flow_83.png";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
    { icon: BookOpen, label: "Method", href: "/method" },
    { icon: PenTool, label: "Journeys", href: "/journeys" },
    // { icon: Users, label: "Participants", href: "/participants" }, // Not in MVP scope but good for visuals
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/50">
          <img src={logo} alt="Flow 83" className="w-8 h-8 object-contain dark:invert" />
          <span className="font-semibold text-lg tracking-tight">Flow 83</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}>
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 w-full transition-colors">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen bg-background">
        <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
