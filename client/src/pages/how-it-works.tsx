import { useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Upload, Wand2, Share2, Globe, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { Link } from "wouter";
import screenshotFlowEditor from "@/assets/screenshot-flow-editor.png";
import screenshotDashboard from "@/assets/screenshot-dashboard.png";
import screenshotParticipant from "@/assets/screenshot-participant.png";
import screenshotUploadContent from "@/assets/screenshot-upload-content.png";
import screenshotAiJourney from "@/assets/screenshot-ai-journey.png";
import screenshotAiJourney2 from "@/assets/screenshot-ai-journey-2.png";
import screenshotParticipantChat from "@/assets/screenshot-participant-chat.png";
import screenshotParticipantMobile from "@/assets/screenshot-participant-mobile.png";
import videoMarketingSite from "@/assets/video-marketing-site.mp4";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload Your Content",
    description: "Share your existing documents, recordings, or notes. Our AI understands your unique methodology and transforms it into structured content.",
    image: screenshotUploadContent,
    imageAlt: "Upload content interface"
  },
  {
    icon: Wand2,
    number: "02", 
    title: "AI Creates Your Journey",
    description: "Watch as AI transforms your content into a structured 3 or 7-day transformational experience with daily goals, exercises, and personalized guidance.",
    image: screenshotAiJourney,
    imageAlt: "AI generated journey overview",
    image2: screenshotAiJourney2,
    image2Alt: "Day content editor with goals and tasks"
  },
  {
    icon: Globe,
    number: "03",
    title: "We Create Your Marketing Site",
    description: "Get a beautiful, ready-to-share landing page for your Flow. Participants can purchase and start their journey immediately. Both the site and the entire experience are fully mobile-friendly.",
    video: videoMarketingSite,
    image: screenshotParticipant,
    imageAlt: "Marketing landing page"
  },
  {
    icon: CreditCard,
    number: "04",
    title: "Your Clients, Your Money",
    description: "Connect your Stripe account and you're set. When clients purchase your journey, the payment goes directly to you — no middlemen, no commission, no waiting. You own your business, we just power it.",
    image: screenshotParticipant,
    imageAlt: "Direct payment flow"
  },
  {
    icon: Share2,
    number: "05",
    title: "Share & Earn",
    description: "Publish your journey with a shareable link. Participants experience your wisdom through an AI-powered chat that speaks in your voice.",
    image: screenshotParticipantChat,
    imageAlt: "Participant chat experience",
    image2: screenshotParticipantMobile,
    image2Alt: "Mobile participant chat experience"
  }
];

const ImageCarousel = ({ images }: { images: { src: string; alt: string }[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-violet-200/50 blur-3xl rounded-full" />
      <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-gray-200 aspect-[4/3]">
        <img 
          src={images[currentIndex].src} 
          alt={images[currentIndex].alt}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
      </div>
      <div className="absolute inset-y-0 left-0 flex items-center">
        <button
          onClick={goPrev}
          className="w-10 h-10 -ml-5 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-violet-50 transition-colors border border-gray-200"
        >
          <ChevronLeft className="w-5 h-5 text-violet-600" />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={goNext}
          className="w-10 h-10 -mr-5 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-violet-50 transition-colors border border-gray-200"
        >
          <ChevronRight className="w-5 h-5 text-violet-600" />
        </button>
      </div>
      <div className="flex justify-center gap-2 mt-4">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-violet-600' : 'bg-violet-200'}`}
          />
        ))}
      </div>
    </div>
  );
};

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Header />
      <main className="pt-20">
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                <span className="text-gray-900">How It </span>
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
                  Works
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Transform your expertise into a digital journey in three simple steps
              </p>
            </div>
            
            <div className="space-y-24 max-w-6xl mx-auto">
              {steps.map((step, index) => (
                <div 
                  key={step.number}
                  className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}
                >
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-3 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                        <step.icon className="w-7 h-7 text-violet-600" />
                      </div>
                      <span className="text-6xl font-bold text-violet-200">
                        {step.number}
                      </span>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto lg:mx-0">
                      {step.description}
                    </p>
                  </div>
                  
                  <div className="flex-1">
                    {step.video ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-violet-200/50 blur-3xl rounded-full" />
                        <div className="relative rounded-2xl shadow-2xl border border-gray-200 overflow-hidden aspect-[4/3]">
                          <video 
                            src={step.video}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            style={{ marginTop: '-18px' }}
                          />
                        </div>
                      </div>
                    ) : step.image2 ? (
                      <ImageCarousel 
                        images={[
                          { src: step.image, alt: step.imageAlt },
                          { src: step.image2, alt: step.image2Alt || "" }
                        ]} 
                      />
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-0 bg-violet-200/50 blur-3xl rounded-full" />
                        <div className="relative rounded-2xl shadow-2xl border border-gray-200 overflow-hidden aspect-[4/3]">
                          <img 
                            src={step.image} 
                            alt={step.imageAlt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-20">
              <Link href="/journeys/new">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 h-auto rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                  data-testid="button-create-flow"
                >
                  Create Your Flow
                </Button>
              </Link>
              <Link href="/community#community-flows">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-4 h-auto rounded-full border-violet-200 text-violet-600 hover:bg-violet-50"
                  data-testid="button-see-examples"
                >
                  See Examples
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
