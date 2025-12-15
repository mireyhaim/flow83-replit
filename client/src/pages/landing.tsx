import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/landing/Footer";
import { useEffect } from "react";

const LandingPage = () => {
  // Add some simple entry animations on mount
  useEffect(() => {
    document.body.classList.add("overflow-x-hidden");
    return () => document.body.classList.remove("overflow-x-hidden");
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary">
      <Header />
      <main>
        <Hero />
        <Features />
        {/* Testimonials and BusinessSuccessStories skipped for MVP speed, can add later */}
        {/* ExampleJourneys skipped for MVP */}
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
