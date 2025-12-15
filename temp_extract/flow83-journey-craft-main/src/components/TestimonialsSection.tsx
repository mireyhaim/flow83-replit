import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    role: "Licensed Therapist",
    content: "Building therapeutic journeys on this platform has transformed my practice. My clients love the interactive format, and I can see their progress in real-time.",
    rating: 5,
    avatar: "🧑‍⚕️"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Life Coach",
    content: "I've created 12 different coaching flows so far. The AI helps me structure my knowledge into powerful, step-by-step transformations for my clients.",
    rating: 5,
    avatar: "👨‍💼"
  },
  {
    id: 3,
    name: "Emma Thompson",
    role: "Wellness Practitioner",
    content: "The platform made it so easy to digitize my mindfulness programs. Now I can reach clients globally with personalized wellness journeys.",
    rating: 5,
    avatar: "🧘‍♀️"
  },
  {
    id: 4,
    name: "Dr. James Mitchell",
    role: "Mental Health Counselor",
    content: "My anxiety management flows have helped hundreds of clients. The platform's intuitive design makes creating professional journeys effortless.",
    rating: 5,
    avatar: "👨‍⚕️"
  },
  {
    id: 5,
    name: "Lisa Park",
    role: "Career Coach",
    content: "I've built career transition flows that guide my clients through major life changes. The engagement rates are incredible compared to traditional methods.",
    rating: 5,
    avatar: "👩‍💻"
  },
  {
    id: 6,
    name: "Dr. Ahmed Hassan",
    role: "Clinical Psychologist",
    content: "The grief support journeys I've created provide gentle, structured healing paths. Families tell me it's like having a therapist available 24/7.",
    rating: 5,
    avatar: "👨‍⚕️"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Trusted by Professionals Worldwide
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          See how therapists, coaches, and healers are transforming their practice with personalized digital flows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="gradient-card border-0 shadow-card hover:shadow-spiritual transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                "{testimonial.content}"
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;