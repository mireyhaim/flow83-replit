import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-200 fixed top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="cursor-pointer hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="Flow83" className="h-8" />
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            Home
          </Link>
          <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            How It Works
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            Pricing
          </Link>
          <Link href="/community" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            Community
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            Contact
          </Link>
        </nav>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100" data-testid="button-header-login">Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 rounded-full" data-testid="button-header-get-started">
              Get Started
            </Button>
          </Link>
        </div>

        <button 
          className="md:hidden text-gray-600 hover:text-gray-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 p-6 space-y-4">
          <Link href="/" className="block text-gray-600 hover:text-gray-900 py-2">Home</Link>
          <Link href="/how-it-works" className="block text-gray-600 hover:text-gray-900 py-2">How It Works</Link>
          <Link href="/pricing" className="block text-gray-600 hover:text-gray-900 py-2">Pricing</Link>
          <Link href="/community" className="block text-gray-600 hover:text-gray-900 py-2">Community</Link>
          <Link href="/contact" className="block text-gray-600 hover:text-gray-900 py-2">Contact</Link>
          <div className="pt-4 space-y-3">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100">Login</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="w-full bg-violet-600 hover:bg-violet-700 rounded-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
