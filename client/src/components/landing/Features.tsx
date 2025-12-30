import { Sparkles, Users, Wallet, Palette, BarChart3, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const Features = () => {
  const { t } = useTranslation('landing');

  const benefits = [
    {
      icon: Sparkles,
      title: t('featureAICreation'),
      description: t('featureAICreationDesc'),
      gradient: "from-violet-400 to-violet-500"
    },
    {
      icon: Users,
      title: t('featureReachMore'),
      description: t('featureReachMoreDesc'),
      gradient: "from-cyan-400 to-cyan-500"
    },
    {
      icon: Wallet,
      title: t('featureYourMoney'),
      description: t('featureYourMoneyDesc'),
      gradient: "from-emerald-400 to-emerald-500"
    },
    {
      icon: Palette,
      title: t('featureProfessional'),
      description: t('featureProfessionalDesc'),
      gradient: "from-violet-400 to-fuchsia-400"
    },
    {
      icon: BarChart3,
      title: t('featureTrackProgress'),
      description: t('featureTrackProgressDesc'),
      gradient: "from-fuchsia-400 to-cyan-400"
    },
    {
      icon: Settings2,
      title: t('featureFullControl'),
      description: t('featureFullControlDesc'),
      gradient: "from-cyan-400 to-violet-400"
    }
  ];

  return (
    <section className="py-32 bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-violet-200/30 blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-fuchsia-200/30 blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="text-fuchsia-600 text-sm font-medium tracking-wider uppercase mb-4 block">
            {t('whyChooseUs')}
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            {t('whyFlow83')}
          </h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            {t('whyFlow83Desc')}
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
