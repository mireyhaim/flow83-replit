import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full px-6 py-4 bg-white/95 backdrop-blur-xl border-b border-slate-200 fixed top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-indigo-600 cursor-pointer hover:text-indigo-700 transition-colors">
          Flow 83
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
            Home
          </Link>
          <Link href="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
            Pricing
          </Link>
          <Link href="/community" className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
            Community
          </Link>
          <Link href="/blog" className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
            Blog
          </Link>
          <Link href="/contact" className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
            Contact
          </Link>
        </nav>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100" data-testid="button-header-login">Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="button-header-get-started">
              Get Started
            </Button>
          </Link>
        </div>

        <button 
          className="md:hidden text-slate-600 hover:text-slate-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-6 space-y-4">
          <Link href="/" className="block text-slate-600 hover:text-slate-900 py-2">Home</Link>
          <Link href="/pricing" className="block text-slate-600 hover:text-slate-900 py-2">Pricing</Link>
          <Link href="/community" className="block text-slate-600 hover:text-slate-900 py-2">Community</Link>
          <Link href="/blog" className="block text-slate-600 hover:text-slate-900 py-2">Blog</Link>
          <Link href="/contact" className="block text-slate-600 hover:text-slate-900 py-2">Contact</Link>
          <div className="pt-4 space-y-3">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-100">Login</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
