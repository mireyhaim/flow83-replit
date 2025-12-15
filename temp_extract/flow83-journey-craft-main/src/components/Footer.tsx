import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Twitter, Linkedin, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-background to-muted/50 border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Flow 83
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              create personalized digital journeys that transform lives through wisdom and AI.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 bg-muted rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-muted rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-muted rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-6">
            <h3 className="font-semibold text-foreground text-lg">Platform</h3>
            <nav className="flex flex-col space-y-3">
              <Link to="/create" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                <span className="group-hover:translate-x-1 transition-transform">Create Journey</span>
              </Link>
              <Link to="/community" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                <span className="group-hover:translate-x-1 transition-transform">Community</span>
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                <span className="group-hover:translate-x-1 transition-transform">Pricing</span>
              </Link>
              <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                <span className="group-hover:translate-x-1 transition-transform">Blog</span>
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                <span className="group-hover:translate-x-1 transition-transform">Contact</span>
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="font-semibold text-foreground text-lg">Get in Touch</h3>
            <div className="space-y-4">
              <a href="mailto:hello@flow83.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group">
                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span>hello@flow83.com</span>
              </a>
              <a href="tel:+15551234567" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group">
                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span>+1 (555) 123-4567</span>
              </a>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="p-2 bg-muted rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 Flow 83. All rights reserved. Built with ❤️ for transformative journeys.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookie-policy" className="text-muted-foreground hover:text-primary transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;