import { Upload, Wand2, Share2 } from "lucide-react";
import screenshotFlowEditor from "@/assets/screenshot-flow-editor.png";
import screenshotDashboard from "@/assets/screenshot-dashboard.png";
import screenshotParticipant from "@/assets/screenshot-participant.png";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload Your Content",
    description: "Share your existing documents, recordings, or notes. Our AI understands your unique methodology and transforms it into structured content.",
    image: screenshotFlowEditor,
    imageAlt: "Flow editor interface"
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

const HowItWorks = () => {
  return (
    <section className="py-32 bg-[#0f0f23] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="text-violet-400 text-sm font-medium tracking-wider uppercase mb-4 block">
            Simple Process
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            How It Works
          </h2>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Transform your expertise into a digital journey in three simple steps
          </p>
        </div>
        
        <div className="space-y-24 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}
            >
              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-violet-400" />
                  </div>
                  <span className="text-6xl font-bold text-violet-500/20">
                    {step.number}
                  </span>
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-4">
                  {step.title}
                </h3>
                <p className="text-lg text-white/60 leading-relaxed max-w-md mx-auto lg:mx-0">
                  {step.description}
                </p>
              </div>
              
              {/* Screenshot */}
              <div className="flex-1">
                <div className={`relative ${index === 2 ? 'max-w-[280px] mx-auto' : ''}`}>
                  <div className="absolute inset-0 bg-violet-600/20 blur-3xl rounded-full" />
                  <img 
                    src={step.image} 
                    alt={step.imageAlt}
                    className={`relative rounded-2xl shadow-2xl border border-white/10 ${index === 2 ? 'w-full' : 'w-full'}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
