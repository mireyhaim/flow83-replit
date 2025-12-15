import FeatureCard from "@/components/FeatureCard";

const Features = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Why Join as a Guide?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your wisdom into powerful digital experiences that guide others on their spiritual and personal development journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            title="Upload Your Content"
            description="Easily upload texts, questions, meditations, videos, and any content that represents your unique approach to transformation."
          />
          
          <FeatureCard
            title="Build Structured Journeys"
            description="Create personalized multi-day processes with different themes, exercises, and progressions tailored to your methodology."
          />
          
          <FeatureCard
            title="Define Your Audience"
            description="Specify target audiences and core intentions to ensure your journeys reach the right people who need your guidance."
          />
          
          <FeatureCard
            title="AI-Enhanced Creation"
            description="Get intelligent assistance to co-create flows, optimize content sequencing, and enhance the transformational impact."
          />
          
          <FeatureCard
            title="Share Seamlessly"
            description="Distribute your journeys through personalized pages and links, making your wisdom accessible to those who seek it."
          />
          
          <FeatureCard
            title="Monetize Your Wisdom"
            description="Create sustainable income streams by sharing your transformational content and building lasting relationships with clients."
          />
        </div>
      </div>
    </section>
  );
};

export default Features;