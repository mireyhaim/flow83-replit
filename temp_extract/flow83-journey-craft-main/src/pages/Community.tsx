import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Star, Award, TrendingUp } from "lucide-react";
import CommunityFlowsShowcase from "@/components/CommunityFlowsShowcase";
import CommunityActivityFeed from "@/components/CommunityActivityFeed";
import communityHero from "@/assets/community-hero.jpg";

const creators = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    role: "Licensed Therapist",
    speciality: "Anxiety & Depression",
    avatar: "🧑‍⚕️",
    flowsCreated: 15,
    rating: 4.9,
    participants: 1200,
    featured: true,
    bio: "Helping people overcome anxiety through evidence-based therapeutic journeys."
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Life Coach",
    speciality: "Career Development",
    avatar: "👨‍💼",
    flowsCreated: 12,
    rating: 4.8,
    participants: 850,
    featured: true,
    bio: "Empowering professionals to navigate career transitions with confidence."
  },
  {
    id: 3,
    name: "Emma Thompson",
    role: "Wellness Practitioner",
    speciality: "Mindfulness & Meditation",
    avatar: "🧘‍♀️",
    flowsCreated: 20,
    rating: 5.0,
    participants: 2100,
    featured: true,
    bio: "Guiding individuals toward inner peace through mindful practices."
  },
  {
    id: 4,
    name: "Dr. James Mitchell",
    role: "Mental Health Counselor",
    speciality: "Trauma Recovery",
    avatar: "👨‍⚕️",
    flowsCreated: 8,
    rating: 4.9,
    participants: 450,
    featured: false,
    bio: "Supporting trauma survivors on their healing journey."
  },
  {
    id: 5,
    name: "Lisa Park",
    role: "Career Coach",
    speciality: "Leadership Development",
    avatar: "👩‍💻",
    flowsCreated: 18,
    rating: 4.7,
    participants: 960,
    featured: false,
    bio: "Developing next-generation leaders through transformative coaching."
  },
  {
    id: 6,
    name: "Dr. Ahmed Hassan",
    role: "Clinical Psychologist",
    speciality: "Grief & Loss",
    avatar: "👨‍⚕️",
    flowsCreated: 10,
    rating: 5.0,
    participants: 320,
    featured: false,
    bio: "Providing compassionate support through life's most difficult transitions."
  }
];

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
      <main>
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
              <Button size="lg" variant="spiritual">
                Join Our Community
              </Button>
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

        {/* Community Activity Feed */}
        <CommunityActivityFeed />

        {/* Join Community CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start creating transformative flows and connect with like-minded professionals
          </p>
          <Button size="lg" variant="spiritual">
            Become a Creator
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Community;