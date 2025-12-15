import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CallToAction from "@/components/CallToAction";
import TestimonialsSection from "@/components/TestimonialsSection";
import ExampleJourneys from "@/components/ExampleJourneys";
import BusinessSuccessStories from "@/components/BusinessSuccessStories";
import Footer from "@/components/Footer";


const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <TestimonialsSection />
        <BusinessSuccessStories />
        <ExampleJourneys />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
