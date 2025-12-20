import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Upload, Wand2, Share2 } from "lucide-react";
import { Link } from "wouter";
import screenshotFlowEditor from "@/assets/screenshot-flow-editor.png";
import screenshotDashboard from "@/assets/screenshot-dashboard.png";
import screenshotParticipant from "@/assets/screenshot-participant.png";
import screenshotUploadContent from "@/assets/screenshot-upload-content.png";

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
    image: screenshotDashboard,
    imageAlt: "Mentor dashboard with analytics"
  },
  {
    icon: Share2,
    number: "03",
    title: "Share & Earn",
    description: "Publish your journey with a shareable link. Participants experience your wisdom through an AI-powered chat that speaks in your voice.",
    image: screenshotParticipant,
    imageAlt: "Participant chat experience"
  }
];

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
                    <div className={`relative ${index === 2 ? 'max-w-[280px] mx-auto' : ''}`}>
                      <div className="absolute inset-0 bg-violet-200/50 blur-3xl rounded-full" />
                      <img 
                        src={step.image} 
                        alt={step.imageAlt}
                        className={`relative rounded-2xl shadow-2xl border border-gray-200 ${index === 2 ? 'w-full' : 'w-full'}`}
                      />
                    </div>
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
