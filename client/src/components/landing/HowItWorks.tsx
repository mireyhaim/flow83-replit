import { Upload, Wand2, Share2 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload Your Content",
    description: "Share your existing documents, recordings, or notes. Our AI understands your unique methodology.",
    color: "violet"
  },
  {
    icon: Wand2,
    number: "02", 
    title: "AI Creates Your Journey",
    description: "Watch as AI transforms your content into a structured 7-day transformational experience.",
    color: "fuchsia"
  },
  {
    icon: Share2,
    number: "03",
    title: "Share & Earn",
    description: "Publish your journey and start helping clients while building a sustainable income stream.",
    color: "cyan"
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="relative group"
            >
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/4 right-0 translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-white/20 to-transparent z-0" />
              )}
              
              <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-3xl p-8 h-full relative z-10 hover:border-white/20 transition-all duration-300 group-hover:bg-[#1a1a2e]/80">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
                  step.color === 'violet' ? 'from-violet-500/20 to-violet-600/10' :
                  step.color === 'fuchsia' ? 'from-fuchsia-500/20 to-fuchsia-600/10' :
                  'from-cyan-500/20 to-cyan-600/10'
                } flex items-center justify-center mb-6`}>
                  <step.icon className={`w-7 h-7 ${
                    step.color === 'violet' ? 'text-violet-400' :
                    step.color === 'fuchsia' ? 'text-fuchsia-400' :
                    'text-cyan-400'
                  }`} />
                </div>
                
                <span className={`text-5xl font-bold ${
                  step.color === 'violet' ? 'text-violet-500/20' :
                  step.color === 'fuchsia' ? 'text-fuchsia-500/20' :
                  'text-cyan-500/20'
                } absolute top-6 right-8`}>
                  {step.number}
                </span>
                
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-white/50 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
