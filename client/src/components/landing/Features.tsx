import { Sparkles, Target, Users, Zap, Share2, DollarSign } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload Your Content",
    description: "Easily upload texts, meditations, videos, and any content that represents your unique approach.",
    gradient: "from-violet-500 to-violet-600"
  },
  {
    icon: Target,
    title: "Build Structured Journeys",
    description: "Create personalized multi-day processes with themes, exercises, and progressions.",
    gradient: "from-fuchsia-500 to-fuchsia-600"
  },
  {
    icon: Users,
    title: "Define Your Audience",
    description: "Specify target audiences to ensure your journeys reach the right people.",
    gradient: "from-cyan-500 to-cyan-600"
  },
  {
    icon: Zap,
    title: "AI-Enhanced Creation",
    description: "Get intelligent assistance to optimize content and enhance transformational impact.",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    icon: Share2,
    title: "Share Seamlessly",
    description: "Distribute through personalized pages and links, making your wisdom accessible.",
    gradient: "from-emerald-500 to-emerald-600"
  },
  {
    icon: DollarSign,
    title: "Monetize Your Wisdom",
    description: "Create sustainable income streams by sharing your transformational content.",
    gradient: "from-rose-500 to-pink-600"
  }
];

import { Upload } from "lucide-react";

const Features = () => {
  return (
    <section className="py-32 bg-[#0f0f23] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="text-fuchsia-400 text-sm font-medium tracking-wider uppercase mb-4 block">
            Everything You Need
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Why Join as a Guide?
          </h2>
          <p className="text-xl text-white/50 max-w-3xl mx-auto">
            Transform your wisdom into powerful digital experiences that guide others on their journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-[#1a1a2e]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all duration-300 hover:bg-[#1a1a2e]/60"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-white/50 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
