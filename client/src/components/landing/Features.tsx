import { Sparkles, Users, DollarSign, Palette, BarChart3, Settings2 } from "lucide-react";

const benefits = [
  {
    icon: Sparkles,
    title: "AI-Powered Creation",
    description: "Save hours of work with automatic journey generation from your existing content.",
    gradient: "from-violet-500 to-violet-600"
  },
  {
    icon: Users,
    title: "Reach More People",
    description: "Scale from 1:1 sessions to dozens or hundreds of clients simultaneously.",
    gradient: "from-cyan-500 to-cyan-600"
  },
  {
    icon: DollarSign,
    title: "Passive Income",
    description: "Create sustainable income from what you already know and teach.",
    gradient: "from-emerald-500 to-emerald-600"
  },
  {
    icon: Palette,
    title: "Professional Look",
    description: "Beautiful, designed pages without needing a designer or developer.",
    gradient: "from-fuchsia-500 to-fuchsia-600"
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "Monitor every participant's journey and engagement in real-time.",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    icon: Settings2,
    title: "Full Control",
    description: "Edit and adjust at any moment, with no tech dependencies.",
    gradient: "from-rose-500 to-pink-600"
  }
];

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
            Why Choose Us
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Why Flow 83?
          </h2>
          <p className="text-xl text-white/50 max-w-3xl mx-auto">
            Everything you need to transform your expertise into a scalable digital business.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="group bg-[#1a1a2e]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all duration-300 hover:bg-[#1a1a2e]/60"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-white/50 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
