import { Sparkles, Users, Wallet, Palette, BarChart3, Settings2 } from "lucide-react";

const benefits = [
  {
    icon: Sparkles,
    title: "AI-Powered Creation",
    description: "Save hours of work with automatic journey generation from your existing content.",
    gradient: "from-violet-400 to-violet-500"
  },
  {
    icon: Users,
    title: "Reach More People",
    description: "Scale from 1:1 sessions to dozens or hundreds of clients simultaneously.",
    gradient: "from-cyan-400 to-cyan-500"
  },
  {
    icon: Wallet,
    title: "Your Money, Directly",
    description: "Connect your own payment link and get paid instantly. Your clients, your brand, your earnings — we never take a cut.",
    gradient: "from-emerald-400 to-emerald-500"
  },
  {
    icon: Palette,
    title: "Professional Look",
    description: "Beautiful, designed pages without needing a designer or developer.",
    gradient: "from-violet-400 to-fuchsia-400"
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "Monitor every participant's journey and engagement in real-time.",
    gradient: "from-fuchsia-400 to-cyan-400"
  },
  {
    icon: Settings2,
    title: "Full Control",
    description: "Edit and adjust at any moment, with no tech dependencies.",
    gradient: "from-cyan-400 to-violet-400"
  }
];

const Features = () => {
  return (
    <section className="py-32 bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-violet-200/30 blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-fuchsia-200/30 blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="text-fuchsia-600 text-sm font-medium tracking-wider uppercase mb-4 block">
            Why Choose Us
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Why Flow 83?
          </h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Everything you need to transform your expertise into a scalable digital business.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="group bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-violet-300 transition-all duration-300 hover:shadow-lg"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">
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
