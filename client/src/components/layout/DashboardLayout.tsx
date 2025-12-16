import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, PenTool, LogOut, Plus, User } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
    { icon: PenTool, label: "Journeys", href: "/journeys" },
    { icon: User, label: "My Profile", href: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border/40 bg-background flex flex-col fixed h-full z-10">
        <div className="p-5 flex items-center">
          <Link href="/" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
            Flow 83
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 space-y-2">
          <Link 
            href="/journeys/new"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full justify-center"
          >
            <Plus size={18} />
            New Journey
          </Link>
          <a 
            href="/api/logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-56 min-h-screen bg-muted/30">
        <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
