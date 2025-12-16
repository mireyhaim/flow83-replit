import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full px-6 py-4 bg-[#0f0f23]/90 backdrop-blur-xl border-b border-white/5 fixed top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
          Flow 83
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-white/70 hover:text-white transition-colors cursor-pointer">
            Home
          </Link>
          <Link href="/pricing" className="text-white/70 hover:text-white transition-colors cursor-pointer">
            Pricing
          </Link>
          <Link href="/community" className="text-white/70 hover:text-white transition-colors cursor-pointer">
            Community
          </Link>
          <Link href="/blog" className="text-white/70 hover:text-white transition-colors cursor-pointer">
            Blog
          </Link>
          <Link href="/contact" className="text-white/70 hover:text-white transition-colors cursor-pointer">
            Contact
          </Link>
        </nav>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" data-testid="button-header-login">Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white shadow-lg shadow-violet-500/20" data-testid="button-header-get-started">
              Get Started
            </Button>
          </Link>
        </div>

        <button 
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#0f0f23]/95 backdrop-blur-xl border-b border-white/5 p-6 space-y-4">
          <Link href="/" className="block text-white/70 hover:text-white py-2">Home</Link>
          <Link href="/pricing" className="block text-white/70 hover:text-white py-2">Pricing</Link>
          <Link href="/community" className="block text-white/70 hover:text-white py-2">Community</Link>
          <Link href="/blog" className="block text-white/70 hover:text-white py-2">Blog</Link>
          <Link href="/contact" className="block text-white/70 hover:text-white py-2">Contact</Link>
          <div className="pt-4 space-y-3">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">Login</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
