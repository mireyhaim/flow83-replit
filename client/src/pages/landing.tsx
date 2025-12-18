import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/landing/Footer";
import { useEffect } from "react";

const LandingPage = () => {
  useEffect(() => {
    document.body.classList.add("overflow-x-hidden");
    return () => document.body.classList.remove("overflow-x-hidden");
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f7ff] font-sans selection:bg-violet-500/20 selection:text-violet-300">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
