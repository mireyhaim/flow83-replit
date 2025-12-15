import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const Header = () => {
  return (
    <header className="w-full px-6 py-4 bg-background/80 backdrop-blur-sm border-b fixed top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity">
          Flow 83
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-foreground hover:text-primary transition-colors cursor-pointer">
            Home
          </Link>
          <Link href="/pricing" className="text-foreground hover:text-primary transition-colors cursor-pointer">
            Pricing
          </Link>
          <Link href="/community" className="text-foreground hover:text-primary transition-colors cursor-pointer">
            Community
          </Link>
          <Link href="/blog" className="text-foreground hover:text-primary transition-colors cursor-pointer">
            Blog
          </Link>
          <Link href="/contact" className="text-foreground hover:text-primary transition-colors cursor-pointer">
            Contact
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-spiritual">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
