import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { Link } from "wouter";

// Import blog article images
import nutritionCoachSuccess from "@/assets/nutrition-coach-success.jpg";
import digitalTherapyScience from "@/assets/digital-therapy-science.jpg";
import virtualCoachingTrust from "@/assets/virtual-coaching-trust.jpg";
import digitalMindfulness from "@/assets/digital-mindfulness.jpg";
import therapyAnalytics from "@/assets/therapy-analytics.jpg";
import contentCreation from "@/assets/content-creation.jpg";
import digitalEthics from "@/assets/digital-ethics.jpg";
import futureHealing from "@/assets/future-healing.jpg";
import digitalResilience from "@/assets/digital-resilience.jpg";

export const blogPosts = [
  {
    id: 3,
    title: "How Nutrition Coach Maria Increased Her Income by $50K with FLOW 83",
    excerpt: "Discover the step-by-step journey of how Maria transformed her nutrition practice using FLOW 83's digital platform, scaling from 1-on-1 sessions to serving hundreds of clients.",
    category: "Case Study",
    author: "FLOW 83 Success Team",
    date: "2024-01-18",
    readTime: "12 min read",
    image: nutritionCoachSuccess,
    featured: true
  },
  {
    id: 1,
    title: "The Science Behind Digital Therapeutic Journeys",
    excerpt: "Explore how structured digital interventions are revolutionizing mental health treatment and improving patient outcomes.",
    category: "Research",
    author: "Dr. Sarah Chen",
    date: "2024-01-15",
    readTime: "8 min read",
    image: digitalTherapyScience,
    featured: true
  },
  {
    id: 2,
    title: "Building Trust in Virtual Coaching Relationships",
    excerpt: "Learn essential strategies for creating meaningful connections with clients through digital platforms.",
    category: "Coaching",
    author: "Marcus Rodriguez",
    date: "2024-01-12",
    readTime: "6 min read",
    image: virtualCoachingTrust,
    featured: true
  },
  {
    id: 4,
    title: "Mindfulness in the Digital Age: Best Practices",
    excerpt: "Discover how to create effective mindfulness experiences that work in our connected world.",
    category: "Wellness",
    author: "Emma Thompson",
    date: "2024-01-10",
    readTime: "5 min read",
    image: digitalMindfulness,
    featured: false
  },
  {
    id: 5,
    title: "Measuring Progress in Digital Therapy",
    excerpt: "Understanding key metrics and analytics that matter for therapeutic outcomes.",
    category: "Analytics",
    author: "Dr. James Mitchell",
    date: "2024-01-08",
    readTime: "7 min read",
    image: therapyAnalytics,
    featured: false
  },
  {
    id: 6,
    title: "Creating Engaging Content for Self-Help Journeys",
    excerpt: "Tips and techniques for developing compelling content that keeps users engaged throughout their journey.",
    category: "Content",
    author: "Lisa Park",
    date: "2024-01-05",
    readTime: "6 min read",
    image: contentCreation,
    featured: false
  },
  {
    id: 7,
    title: "Ethical Considerations in Digital Mental Health",
    excerpt: "Important guidelines and considerations for maintaining ethical standards in digital therapeutic interventions.",
    category: "Ethics",
    author: "Dr. Ahmed Hassan",
    date: "2024-01-03",
    readTime: "9 min read",
    image: digitalEthics,
    featured: false
  },
  {
    id: 8,
    title: "The Future of Personalized Healing",
    excerpt: "How AI and machine learning are shaping the next generation of personalized therapeutic experiences.",
    category: "Technology",
    author: "Dr. Sarah Chen",
    date: "2024-01-01",
    readTime: "10 min read",
    image: futureHealing,
    featured: false
  },
  {
    id: 9,
    title: "Building Resilience Through Structured Programs",
    excerpt: "Evidence-based approaches to developing resilience and coping skills through digital interventions.",
    category: "Psychology",
    author: "Dr. James Mitchell",
    date: "2023-12-28",
    readTime: "8 min read",
    image: digitalResilience,
    featured: false
  }
];



const Blog = () => {
  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-gray-900">Flow 83 </span>
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Insights, research, and best practices from leading experts in digital therapeutics and transformative journeys
          </p>
        </section>

        {/* Featured Posts */}
        <section className="max-w-7xl mx-auto px-6 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Articles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.filter(post => post.featured).map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
                  <CardHeader>
                    <div className="w-full h-48 mb-4 overflow-hidden rounded-lg">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-violet-100 text-violet-700">{post.category}</Badge>
                    </div>
                    <CardTitle className="text-xl text-gray-900 hover:text-violet-600 transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-gray-500">{post.excerpt}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {post.author}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(post.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {post.readTime}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* All Posts */}
        <section className="max-w-7xl mx-auto px-6 py-16 bg-white/50">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">All Articles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                        <img 
                          src={post.image} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs border-violet-200 text-violet-600">
                            {post.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(post.date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-violet-600 transition-colors">
                          {post.title}
                        </h3>
                        
                        <p className="text-gray-500 text-sm mb-3">
                          {post.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {post.author}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
