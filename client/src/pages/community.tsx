import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Users, Star, Award, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import CommunityFlowsShowcase from "@/components/landing/CommunityFlowsShowcase";
import communityHero from "@/assets/community-hero.jpg";

const stats = [
  { icon: Users, label: "Active Creators", value: "2,500+" },
  { icon: Star, label: "Average Rating", value: "4.8" },
  { icon: Award, label: "Flows Created", value: "15,000+" },
  { icon: TrendingUp, label: "Lives Transformed", value: "250,000+" }
];

const Community = () => {
  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                <span className="text-gray-900">Meet Our </span>
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
                  Creator Community
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                Connect with expert therapists, coaches, and healers who are transforming lives through personalized digital flows
              </p>
            </div>
            <div className="relative">
              <img 
                src={communityHero} 
                alt="Community of professional therapists, coaches, and wellness practitioners collaborating"
                className="w-full h-auto rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-4">
                    <IconComponent className="w-8 h-8 text-violet-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-500">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Community Flows Showcase */}
        <CommunityFlowsShowcase />

        {/* Join Community CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-gray-900">Ready to </span>
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
              Join Our Community?
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Start creating transformative flows and connect with like-minded professionals
          </p>
          <Link href="/journeys/new">
            <Button size="lg" className="text-lg px-8 py-4 h-auto rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
              Become a Creator
            </Button>
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Community;
