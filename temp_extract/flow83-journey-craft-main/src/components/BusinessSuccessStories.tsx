import { Card, CardContent } from "@/components/ui/card";
import nutritionCoachImage from "@/assets/nutrition-coach-success.jpg";
import therapyAnalyticsImage from "@/assets/therapy-analytics.jpg";
import emmaCoachingImage from "@/assets/emma-thompson-coaching.jpg";

const successStories = [
  {
    id: 1,
    name: "Sarah Chen",
    business: "Wellness & Nutrition Coaching",
    image: nutritionCoachImage,
    story: "After implementing Flow83's digital workflows, my nutrition coaching practice saw a 340% increase in client retention and $127K additional revenue in just 8 months.",
    metrics: {
      revenue: "+$127K",
      growth: "340%",
      timeframe: "8 months"
    }
  },
  {
    id: 2,
    name: "Dr. Michael Rodriguez",
    business: "Digital Therapy Practice", 
    image: therapyAnalyticsImage,
    story: "Flow83's structured journeys helped me scale my therapy practice digitally. Client engagement increased 280% and my monthly revenue grew from $8K to $31K.",
    metrics: {
      revenue: "$8K → $31K",
      growth: "280%",
      timeframe: "6 months"
    }
  },
  {
    id: 3,
    name: "Emma Thompson",
    business: "Life & Business Coaching",
    image: emmaCoachingImage,
    story: "The personalized digital flows allowed me to serve 5x more clients while maintaining quality. My coaching business revenue jumped from $45K to $180K annually.",
    metrics: {
      revenue: "$45K → $180K",
      growth: "400%",
      timeframe: "3 months"
    }
  }
];

const BusinessSuccessStories = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Real Results, Real Revenue Growth
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how Flow83 users transformed their businesses with digital workflows that drive measurable sales growth
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {successStories.map((story) => (
            <Card key={story.id} className="bg-card/80 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img 
                    src={story.image} 
                    alt={`${story.name}'s success story`}
                    className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                    {story.metrics.growth} Growth
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {story.name}
                    </h3>
                    <p className="text-primary font-medium text-sm">
                      {story.business}
                    </p>
                  </div>

                  <blockquote className="text-muted-foreground italic mb-6 text-sm leading-relaxed">
                    "{story.story}"
                  </blockquote>

                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {story.metrics.revenue}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Revenue Impact
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-foreground">
                        {story.metrics.timeframe}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Time to Results
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-6">
            Join hundreds of professionals growing their revenue with Flow83
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Average 285% revenue increase</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Results within 6-12 months</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>No technical skills required</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessSuccessStories;