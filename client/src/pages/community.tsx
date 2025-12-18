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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Meet Our Creator Community
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Connect with expert therapists, coaches, and healers who are transforming lives through personalized digital flows
              </p>
            </div>
            <div className="relative">
              <img 
                src={communityHero} 
                alt="Community of professional therapists, coaches, and wellness practitioners collaborating"
                className="w-full h-auto rounded-2xl shadow-spiritual"
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
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Community Flows Showcase */}
        <CommunityFlowsShowcase />

        {/* Join Community CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start creating transformative flows and connect with like-minded professionals
          </p>
          <Link href="/journeys/new">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-spiritual">
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
