import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Clock, CheckCircle, ArrowLeft, Sparkles } from "lucide-react";
import { useParams, Link } from "wouter";
import digitalMindfulness from "@/assets/digital-mindfulness.jpg";
import futureHealing from "@/assets/future-healing.jpg";
import digitalTherapyScience from "@/assets/digital-therapy-science.jpg";
import digitalResilience from "@/assets/digital-resilience.jpg";

const flowsData: Record<string, {
  title: string;
  description: string;
  creator: string;
  category: string;
  participants: number;
  likes: number;
  duration: string;
  thumbnail: string;
  difficulty: string;
  goal: string;
  audience: string;
  outcome: string;
  days: { title: string; description: string }[];
}> = {
  "1": {
    title: "7-Day Anxiety Reset",
    description: "A comprehensive journey to manage anxiety through mindfulness and breathing techniques",
    creator: "Dr. Sarah Chen",
    category: "Mental Health",
    participants: 1250,
    likes: 342,
    duration: "7 days",
    thumbnail: digitalMindfulness,
    difficulty: "Beginner",
    goal: "Help participants develop practical tools to manage anxiety and find inner calm",
    audience: "Anyone experiencing anxiety, stress, or overwhelm in their daily life",
    outcome: "By the end of this flow, participants will have a personal toolkit of breathing exercises, mindfulness practices, and cognitive techniques to manage anxiety effectively",
    days: [
      { title: "Understanding Your Anxiety", description: "Learn to identify your anxiety triggers and understand how anxiety manifests in your body and mind" },
      { title: "The Power of Breath", description: "Master three breathing techniques that instantly calm your nervous system" },
      { title: "Mindful Awareness", description: "Practice present-moment awareness to break the cycle of anxious thoughts" },
      { title: "Thought Reframing", description: "Learn to recognize and challenge negative thought patterns" },
      { title: "Body-Mind Connection", description: "Discover how physical tension relates to anxiety and learn release techniques" },
      { title: "Building Resilience", description: "Create daily routines that support mental wellness and prevent anxiety buildup" },
      { title: "Your Personal Toolkit", description: "Integrate all techniques into a personalized anxiety management plan" }
    ]
  },
  "2": {
    title: "Career Pivot Masterclass",
    description: "Step-by-step guide to successfully transition to your dream career",
    creator: "Marcus Rodriguez",
    category: "Career Growth",
    participants: 890,
    likes: 267,
    duration: "14 days",
    thumbnail: futureHealing,
    difficulty: "Intermediate",
    goal: "Guide professionals through a successful career transition with clarity and confidence",
    audience: "Professionals considering a career change or seeking more fulfilling work",
    outcome: "Participants will have a clear career direction, updated personal brand, and actionable plan to make their transition",
    days: [
      { title: "Career Assessment", description: "Evaluate your current situation and identify what's driving your desire for change" },
      { title: "Values & Priorities", description: "Clarify what matters most to you in your ideal career" },
      { title: "Skills Inventory", description: "Map your transferable skills and identify gaps to address" },
      { title: "Exploring Options", description: "Research and evaluate potential career paths that align with your goals" },
      { title: "Personal Branding", description: "Update your story, resume, and online presence for your new direction" },
      { title: "Networking Strategy", description: "Build connections in your target industry through strategic outreach" },
      { title: "Action Planning", description: "Create a realistic timeline and milestones for your career transition" }
    ]
  },
  "3": {
    title: "Grief Healing Journey",
    description: "A compassionate path through loss with therapeutic techniques and community support",
    creator: "Dr. Ahmed Hassan",
    category: "Emotional Healing",
    participants: 456,
    likes: 198,
    duration: "21 days",
    thumbnail: digitalTherapyScience,
    difficulty: "All Levels",
    goal: "Provide gentle support and practical tools for navigating the grief process",
    audience: "Anyone experiencing loss and seeking compassionate guidance through their grief",
    outcome: "Participants will develop healthy coping mechanisms and find meaning and hope while honoring their loss",
    days: [
      { title: "Honoring Your Loss", description: "Create a safe space to acknowledge and express your grief" },
      { title: "Understanding Grief", description: "Learn about the grief process and why there's no 'right' way to grieve" },
      { title: "Self-Compassion", description: "Practice self-care and kindness during this difficult time" },
      { title: "Processing Emotions", description: "Explore healthy ways to express and release difficult feelings" },
      { title: "Memory Keeping", description: "Create meaningful ways to honor and remember your loved one" },
      { title: "Finding Support", description: "Build a support network and learn to ask for help when needed" },
      { title: "Moving Forward", description: "Discover how to carry your love forward while embracing life again" }
    ]
  },
  "4": {
    title: "Leadership Presence Blueprint",
    description: "Develop authentic leadership skills and executive presence",
    creator: "Lisa Park",
    category: "Leadership",
    participants: 632,
    likes: 151,
    duration: "10 days",
    thumbnail: digitalResilience,
    difficulty: "Advanced",
    goal: "Help emerging leaders develop authentic presence and influence",
    audience: "Managers, team leads, and professionals stepping into leadership roles",
    outcome: "Participants will project confidence, communicate with impact, and inspire their teams effectively",
    days: [
      { title: "Defining Your Leadership Style", description: "Identify your unique leadership strengths and authentic voice" },
      { title: "Executive Communication", description: "Master the art of clear, confident, and compelling communication" },
      { title: "Body Language & Presence", description: "Learn to project confidence through nonverbal communication" },
      { title: "Strategic Thinking", description: "Develop the ability to see the big picture and make strategic decisions" },
      { title: "Building Trust", description: "Create psychological safety and earn your team's trust and respect" },
      { title: "Difficult Conversations", description: "Navigate challenging discussions with grace and directness" },
      { title: "Inspiring Others", description: "Motivate and empower your team to achieve exceptional results" }
    ]
  }
};

export default function FlowDemo() {
  const { id } = useParams<{ id: string }>();
  const flow = flowsData[id || "1"];

  if (!flow) {
    return (
      <div className="min-h-screen bg-[#f8f7ff]">
        <Header />
        <main className="pt-20 max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Flow not found</h1>
          <Link href="/">
            <Button className="rounded-full bg-violet-600 hover:bg-violet-700">
              Back to Home
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Header />
      <main className="pt-20">
        <section className="max-w-4xl mx-auto px-6 py-12">
          <Link href="/" className="inline-flex items-center text-violet-600 hover:text-violet-700 mb-8" data-testid="link-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg mb-8" data-testid="card-flow-overview">
            <div className="flex items-start gap-6 mb-6">
              <img 
                src={flow.thumbnail} 
                alt={flow.title}
                className="w-24 h-24 rounded-2xl object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900" data-testid="text-flow-title">{flow.title}</h1>
                  <Badge className="bg-violet-100 text-violet-700">{flow.category}</Badge>
                </div>
                <p className="text-gray-500 mb-3">by {flow.creator}</p>
                <p className="text-gray-600 text-lg">{flow.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {flow.participants.toLocaleString()} participants
              </div>
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                {flow.likes} likes
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {flow.duration}
              </div>
              <Badge variant="outline" className="border-violet-200 text-violet-600">
                {flow.difficulty}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Goal</h3>
                <p className="text-gray-600 text-sm">{flow.goal}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Who is this for?</h3>
                <p className="text-gray-600 text-sm">{flow.audience}</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
              What You'll Experience Each Day
            </span>
          </h2>

          <div className="space-y-4 mb-8">
            {flow.days.map((day, index) => (
              <Card key={index} className="bg-white border border-gray-200 hover:border-violet-200 hover:shadow-md transition-all" data-testid={`card-day-${index + 1}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-violet-600">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{day.title}</h3>
                      <p className="text-gray-600 text-sm">{day.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-2xl p-6 mb-12" data-testid="card-outcome">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">By the End of This Flow</h3>
                <p className="text-gray-600">{flow.outcome}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center shadow-lg" data-testid="card-cta">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Create Flows Like This with Flow 83
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Turn your expertise into transformative journeys. Our AI helps you build personalized flows that guide your clients step by step.
            </p>
            <Button 
              asChild
              className="text-lg px-8 py-4 h-auto rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
              data-testid="button-start-creating"
            >
              <Link href="/dashboard">Start Creating Your Flow</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
