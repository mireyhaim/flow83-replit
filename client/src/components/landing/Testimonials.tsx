import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Life Coach",
    rating: 5,
    text: "Flow 83 transformed my coaching practice. I went from serving 10 clients a week to reaching hundreds, while maintaining the personal touch that makes my method unique.",
    avatar: "SC"
  },
  {
    name: "David Miller",
    role: "Meditation Teacher",
    rating: 5,
    text: "The AI understands my teaching style perfectly. My students feel like they're getting personalized guidance, even though I'm serving them at scale. Incredible technology.",
    avatar: "DM"
  },
  {
    name: "Rachel Torres",
    role: "Nutritionist",
    rating: 5,
    text: "I was skeptical at first, but the results speak for themselves. My 7-day detox flow has helped over 500 clients, and I earn passive income while they transform.",
    avatar: "RT"
  },
  {
    name: "Michael Brooks",
    role: "Therapist",
    rating: 5,
    text: "Finally, a platform that respects the depth of therapeutic work. The AI guides clients through my methodology with sensitivity and care. Game changer for my practice.",
    avatar: "MB"
  },
  {
    name: "Lisa Park",
    role: "Yoga Instructor",
    rating: 5,
    text: "Creating my first flow took just 30 minutes. Now I have a digital offering that complements my in-person classes and reaches students worldwide.",
    avatar: "LP"
  },
  {
    name: "James Wilson",
    role: "Executive Coach",
    rating: 5,
    text: "My corporate clients love the structured approach. Flow 83 helped me package my leadership development program into a scalable digital experience.",
    avatar: "JW"
  }
];

const Testimonials = () => {
  const { t } = useTranslation('landing');

  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-100/50 blur-[150px]" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full bg-fuchsia-100/50 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-violet-600 text-sm font-medium tracking-wider uppercase mb-4 block">
            {t('trustedByGuides')}
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            {t('whatMentorsSay')}
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            {t('joinThousands')}
          </p>
          
          {/* Overall Rating */}
          <div className="flex items-center justify-center gap-3 mt-8" data-testid="testimonials-overall-rating">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-2xl font-bold text-gray-900" data-testid="text-rating-score">4.9</span>
            <span className="text-gray-500" data-testid="text-review-count">{t('fromReviews')}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-gray-50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:border-violet-300 transition-all duration-300 hover:shadow-lg"
              data-testid={`card-testimonial-${index}`}
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              {/* Quote */}
              <p className="text-gray-600 leading-relaxed mb-6">
                "{testimonial.text}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-gray-900 font-medium">{testimonial.name}</p>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <Link href="/community#community-flows">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 h-auto rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
              data-testid="button-see-flow-examples"
            >
              {t('seeFlowExamples')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
