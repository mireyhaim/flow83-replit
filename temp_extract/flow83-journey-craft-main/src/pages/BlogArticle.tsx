import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User, ArrowLeft, Share2, BookOpen, Heart } from "lucide-react";

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

// Sample blog posts data (in a real app, this would come from an API)
const blogPosts = [
  {
    id: 1,
    title: "The Science Behind Digital Therapeutic Journeys",
    excerpt: "Explore how structured digital interventions are revolutionizing mental health treatment and improving patient outcomes.",
    category: "Research",
    author: "Dr. Sarah Chen",
    date: "2024-01-15",
    readTime: "8 min read",
    image: nutritionCoachSuccess,
    featured: true,
    content: `
# The Science Behind Digital Therapeutic Journeys

Digital therapeutic journeys represent a paradigm shift in mental health treatment, combining evidence-based psychological interventions with the accessibility and scalability of technology. As our understanding of neuroplasticity and behavioral change deepens, we're discovering that structured digital experiences can be just as effective as traditional therapy in many cases.

## The Neuroscience of Change

Recent research in neuroscience has shown us that the brain remains remarkably plastic throughout our lives. This neuroplasticity is the foundation upon which all therapeutic interventions work, whether delivered digitally or in person. When we engage in consistent, structured activities that challenge our thought patterns and behaviors, we literally rewire our neural pathways.

Digital therapeutic journeys leverage this principle by providing:

- **Consistent engagement**: Unlike traditional therapy sessions that occur weekly, digital journeys can provide daily touchpoints that reinforce learning
- **Personalized pacing**: AI-driven systems can adapt to individual progress rates and preferences
- **Measurable outcomes**: Every interaction provides data that can inform treatment adjustments

## Evidence-Based Foundations

The most effective digital therapeutic journeys are built upon established psychological frameworks:

### Cognitive Behavioral Therapy (CBT)
CBT principles translate exceptionally well to digital formats. The structured nature of CBT exercises, thought records, and behavioral experiments can be gamified and made interactive through digital platforms.

### Mindfulness-Based Interventions
Guided meditations, breathing exercises, and mindfulness practices have shown remarkable efficacy when delivered through digital platforms. The key is maintaining the contemplative essence while leveraging technology for accessibility.

### Acceptance and Commitment Therapy (ACT)
ACT's focus on psychological flexibility and values-based living lends itself well to digital exploration through interactive exercises and reflective journeys.

## The Role of Data and Analytics

One of the unique advantages of digital therapeutic journeys is the wealth of data they generate. This data allows for:

- **Real-time progress monitoring**: Both users and healthcare providers can track progress through objective metrics
- **Predictive modeling**: Machine learning algorithms can identify patterns that predict relapse or breakthrough moments
- **Personalization at scale**: Data-driven insights enable mass customization of therapeutic content

## Implementation Best Practices

Creating effective digital therapeutic journeys requires careful attention to several key factors:

### User Experience Design
The interface must be intuitive and emotionally resonant. Users dealing with mental health challenges often have compromised attention and motivation, making excellent UX design crucial.

### Clinical Validation
All content and interventions should be developed in collaboration with licensed mental health professionals and validated through clinical studies.

### Privacy and Security
Given the sensitive nature of mental health data, robust privacy protections and security measures are non-negotiable.

## Future Directions

The future of digital therapeutic journeys lies in several emerging areas:

- **Virtual and Augmented Reality**: Immersive technologies will enable new forms of exposure therapy and mindfulness practice
- **Biometric Integration**: Wearable devices will provide real-time physiological feedback to enhance therapeutic interventions
- **AI-Powered Personalization**: Advanced AI will create truly individualized therapeutic experiences based on comprehensive user models

## Conclusion

Digital therapeutic journeys represent a powerful tool in the mental health toolkit. When designed with scientific rigor and implemented with attention to user experience, they can democratize access to high-quality mental health interventions while providing unprecedented insights into the therapeutic process.

As we continue to bridge the gap between technology and human psychology, we're not just creating more convenient ways to access therapy—we're fundamentally reimagining what therapeutic intervention can look like in the 21st century.

*This article is based on peer-reviewed research and clinical guidelines. Always consult with a qualified mental health professional for personalized treatment recommendations.*
    `,
    tags: ["Digital Health", "Neuroscience", "Mental Health", "Technology", "Research"],
    relatedPosts: [2, 3, 4]
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
    featured: true,
    content: `
# Building Trust in Virtual Coaching Relationships

Trust forms the bedrock of any successful coaching relationship. In virtual environments, building this trust requires intentional strategies and a deep understanding of how human connection works across digital mediums. The absence of physical presence doesn't mean the absence of genuine connection—it simply requires different approaches.

## The Psychology of Virtual Trust

Trust in virtual relationships operates on slightly different principles than face-to-face interactions. Research shows that people form impressions faster in digital environments, making first impressions even more crucial. However, once established, virtual relationships can be just as strong and meaningful as in-person connections.

### Key Trust Factors in Virtual Coaching:

- **Reliability**: Consistent availability and follow-through on commitments
- **Competence**: Demonstrated expertise and professional knowledge
- **Authenticity**: Genuine personality and transparent communication
- **Empathy**: Ability to understand and validate client experiences
- **Confidentiality**: Clear privacy protections and boundaries

## Strategies for Building Virtual Trust

### 1. Create a Professional Yet Warm Environment

Your virtual presence speaks volumes before you say a word. Invest in:

- **Quality audio and video**: Technical difficulties can undermine confidence
- **Professional background**: Clean, consistent virtual environment
- **Reliable technology**: Have backup plans for technical issues
- **Consistent branding**: Maintain professional consistency across platforms

### 2. Establish Clear Communication Protocols

Transparency about processes builds trust. Clearly communicate:

- **Response timeframes**: When clients can expect to hear from you
- **Communication channels**: How and when to reach you
- **Session structure**: What to expect in each interaction
- **Progress tracking**: How you'll measure and share progress

### 3. Leverage Technology for Connection

Use technology to enhance rather than replace human connection:

- **Shared digital workspaces**: Collaborative tools that create partnership feeling
- **Progress visualization**: Charts and graphs that make progress tangible
- **Resource libraries**: Curated content that adds ongoing value
- **Check-in systems**: Regular touchpoints between formal sessions

## Overcoming Virtual Barriers

### Addressing Technology Anxiety

Many clients feel uncomfortable with new technology. Help them by:

- **Offering tech orientation sessions**: Walk through platforms before coaching begins
- **Providing clear instructions**: Step-by-step guides for all tools
- **Having backup plans**: Alternative methods when technology fails
- **Being patient**: Allow extra time for technical adjustments

### Managing Distractions

Virtual environments come with unique distractions. Create focus by:

- **Setting environment expectations**: Guidelines for optimal session conditions
- **Using engagement techniques**: Interactive elements that maintain attention
- **Breaking into segments**: Shorter, more frequent interactions can be more effective
- **Encouraging mindful presence**: Techniques for staying present in virtual spaces

## Measuring Trust and Relationship Quality

Unlike in-person coaching, virtual relationships require more intentional assessment:

### Quantitative Measures:
- **Session attendance rates**
- **Response times to communications**
- **Engagement with assigned materials**
- **Completion rates of action items**

### Qualitative Measures:
- **Depth of sharing in sessions**
- **Willingness to be vulnerable**
- **Openness to feedback**
- **Initiative in reaching out**

## Advanced Trust-Building Techniques

### Vulnerability Modeling

Coaches who appropriately share their own experiences and challenges create psychological safety for clients to do the same. In virtual environments, this modeling becomes even more important as clients have fewer contextual cues about your humanity.

### Micro-Interactions

Small, consistent interactions build trust over time:
- **Personalized check-in messages**
- **Remembering personal details from previous sessions**
- **Celebrating small wins**
- **Acknowledging challenges promptly**

### Cultural Sensitivity

Virtual coaching often crosses geographical and cultural boundaries. Building trust requires:
- **Understanding different communication styles**
- **Respecting varying technology comfort levels**
- **Acknowledging time zone considerations**
- **Being aware of cultural norms around authority and coaching**

## The Future of Virtual Coaching Relationships

As virtual coaching becomes more prevalent, several trends are emerging:

### AI-Enhanced Relationship Building

Artificial intelligence is beginning to support relationship building through:
- **Mood tracking and analysis**
- **Personalized communication suggestions**
- **Optimal timing recommendations for interactions**
- **Pattern recognition in relationship dynamics**

### Immersive Technologies

Virtual and augmented reality are creating new possibilities for connection:
- **Shared virtual spaces** that feel more "real"
- **Body language recognition** in virtual environments
- **Haptic feedback** for physical connection across distance

## Conclusion

Building trust in virtual coaching relationships requires intentionality, consistency, and a deep understanding of human psychology. While the medium may be digital, the connection must remain fundamentally human.

The coaches who thrive in virtual environments are those who see technology as a bridge to deeper connection rather than a barrier. They understand that trust isn't built through perfection, but through consistent, authentic, and competent interaction over time.

*Ready to enhance your virtual coaching practice? Consider joining our community of practice where coaches share strategies and support each other in building meaningful virtual relationships.*
    `,
    tags: ["Coaching", "Virtual Relationships", "Trust Building", "Communication", "Technology"],
    relatedPosts: [1, 5, 6]
  },
  {
    id: 3,
    title: "How Nutrition Coach Maria Increased Her Income by $50K with FLOW 83",
    excerpt: "Discover the step-by-step journey of how Maria transformed her nutrition practice using FLOW 83's digital platform, scaling from 1-on-1 sessions to serving hundreds of clients.",
    category: "Case Study",
    author: "FLOW 83 Success Team",
    date: "2024-01-18",
    readTime: "12 min read",
    image: nutritionCoachSuccess,
    featured: true,
    content: `
# How Nutrition Coach Maria Increased Her Income by $50K with FLOW 83

*Real results from a real practitioner who transformed her business model using FLOW 83's digital journey platform*

Maria Santos had been a certified nutrition coach for eight years when she discovered FLOW 83. Despite her expertise and passion for helping people transform their relationship with food, she was stuck in the traditional 1-on-1 coaching model that limited both her income and impact. Here's how she used FLOW 83 to break through those limitations and increase her annual income by $50,000 in just 10 months.

## The Challenge: Time vs. Income Trap

Before FLOW 83, Maria's business looked like this:

**Previous Business Model:**
- **20 clients** per month at $200 per client
- **Monthly income:** $4,000
- **Annual income:** $48,000
- **Time commitment:** 60+ hours per week including session prep, delivery, and follow-up
- **Scalability:** Limited to her available time

Maria was experiencing what many coaches face: the more successful she became, the more overwhelmed she felt. She was turning away potential clients because she simply didn't have more hours in the day.

*"I was working 12-hour days and still felt like I was failing my clients because I couldn't give them the ongoing support they needed between sessions,"* Maria recalls.

## The Discovery: FLOW 83's Digital Journey Solution

Maria discovered FLOW 83 through a recommendation from another coach in her network. Initially skeptical about digital platforms, she was intrigued by the possibility of scaling her impact while maintaining the personal touch that made her coaching effective.

### What Attracted Maria to FLOW 83:

1. **Structured Journey Creation**: The ability to turn her proven coaching methodology into repeatable, scalable journeys
2. **Ongoing Client Engagement**: Tools to maintain connection and support between live sessions
3. **Progress Tracking**: Automated systems to monitor client progress and intervene when needed
4. **Community Building**: Features that allowed clients to support each other
5. **Content Delivery**: Multiple formats (text, audio, video) to accommodate different learning styles

## The Implementation: Building Her First Digital Journey

Maria's first FLOW 83 journey was "The 21-Day Mindful Eating Reset" - a program she had been delivering manually for years.

### Journey Structure:

**Week 1: Foundation Building**
- Daily mindfulness exercises
- Food awareness activities
- Habit tracking tools
- Community discussion prompts

**Week 2: Implementation**
- Meal planning templates
- Shopping guides
- Cooking demonstration videos
- Progress check-ins

**Week 3: Integration**
- Long-term sustainability planning
- Trigger identification exercises
- Support system building
- Celebration rituals

### Content Creation Process:

Maria spent 3 weeks using FLOW 83's AI-assisted journey builder to create her first program:

1. **Day 1-5**: Outlined the journey structure using FLOW 83's templates
2. **Day 6-15**: Recorded video content and wrote daily exercises
3. **Day 16-21**: Beta tested with 5 existing clients and refined based on feedback

*"The AI Journey Composer was incredible. It helped me organize my thoughts and suggested interactive elements I never would have thought of. What would have taken me months to create manually, I completed in three weeks."*

## The Launch: From Concept to Revenue

Maria launched her first FLOW 83 journey with a hybrid model:

### Pricing Strategy:
- **Self-guided journey**: $197
- **Journey + 2 group coaching calls**: $397
- **Journey + 4 individual check-ins**: $597

### Launch Results (Month 1):
- **47 participants** enrolled across all tiers
- **Total revenue**: $12,850
- **Time investment**: 15 hours (including group calls)
- **Participant completion rate**: 89%

This single launch generated more revenue in one month than Maria typically made in three months of 1-on-1 coaching, while requiring 75% less time investment.

## The Scale: Building Multiple Revenue Streams

Encouraged by her initial success, Maria expanded her FLOW 83 offerings:

### Journey Portfolio (Months 2-6):

1. **"The 21-Day Mindful Eating Reset"** - Her flagship program
2. **"Meal Prep Mastery"** - A practical skills-focused journey
3. **"Emotional Eating Recovery"** - Her most premium offering
4. **"Family Nutrition Transformation"** - Serving a new market segment

### Pricing Evolution:

As Maria built her reputation and refined her journeys, she increased her prices:

- **Self-guided journeys**: $197 → $297
- **Group coaching packages**: $397 → $597
- **Premium individual support**: $597 → $997

### Monthly Revenue Growth:

- **Month 1**: $12,850
- **Month 3**: $18,400
- **Month 6**: $24,200
- **Month 9**: $29,800
- **Month 12**: $31,500

## The Results: Transformation in Numbers

After 12 months with FLOW 83, Maria's business metrics had completely transformed:

### Before vs. After Comparison:

| Metric | Before FLOW 83 | After FLOW 83 | Improvement |
|---------|-----------------|---------------|-------------|
| **Monthly Income** | $4,000 | $8,500+ | +112% |
| **Annual Income** | $48,000 | $98,000+ | +$50,000 |
| **Clients Served** | 20/month | 180/month | +800% |
| **Working Hours** | 60/week | 35/week | -42% |
| **Client Results** | Good | Excellent* | Measurable improvement |

*Client results improved due to consistent daily engagement and community support

### Additional Business Benefits:

1. **Passive Income Streams**: Self-guided journeys continued generating revenue with minimal ongoing input
2. **Premium Positioning**: Higher-value offerings attracted more committed clients
3. **Scalable Systems**: Could serve 10x more clients without proportional time increase
4. **Data-Driven Insights**: FLOW 83's analytics helped Maria understand what worked best
5. **Community Building**: Clients began referring friends, creating organic growth

## The Strategy: What Made Maria Successful

### Key Success Factors:

#### 1. **Content Quality First**
Maria didn't rush to launch. She invested time in creating genuinely valuable content that delivered real results.

*"I treated each journey like it was going to be experienced by my most important client. The quality had to be there."*

#### 2. **Progressive Value Ladder**
She created multiple entry points and upgrade paths:
- Free content → Low-cost journey → Premium journey → 1-on-1 coaching

#### 3. **Community Integration**
Maria actively participated in journey discussions, creating a sense of personal connection even in the digital format.

#### 4. **Continuous Improvement**
Using FLOW 83's feedback tools, she regularly updated and refined her journeys based on participant input.

#### 5. **Hybrid Approach**
She didn't abandon 1-on-1 coaching entirely but positioned it as a premium offering for graduates of her journeys.

## The Client Impact: Measuring Success Beyond Revenue

While the income increase was significant, Maria was most proud of the improved client outcomes:

### Client Success Metrics:

- **Completion Rates**: 89% (industry average: 23%)
- **Satisfaction Scores**: 4.8/5.0
- **Long-term Success**: 73% maintained results after 6 months
- **Referral Rate**: 45% of clients referred someone within 3 months

### Client Testimonials:

*"Maria's journey on FLOW 83 changed my life. Having daily support and a community going through the same thing made all the difference. I finally broke my 20-year cycle of emotional eating."* - Sarah M.

*"The format was perfect for my busy lifestyle. I could engage when it worked for me, but still felt connected to Maria and the group."* - Jennifer L.

## The Challenges: What Maria Learned Along the Way

The transformation wasn't without obstacles:

### Initial Challenges:

1. **Technology Learning Curve**: Adapting to digital content creation
2. **Pricing Confidence**: Charging appropriately for digital value
3. **Time Management**: Balancing creation with existing client commitments
4. **Marketing Shift**: Learning to market to groups vs. individuals

### Solutions Maria Developed:

1. **Gradual Transition**: Maintained existing clients while building FLOW 83 presence
2. **Beta Testing**: Used existing clients to refine new offerings
3. **Value Focus**: Emphasized results and transformation over time spent
4. **Community Leverage**: Let successful clients become advocates and case studies

## The Future: Scaling Beyond $100K

With her FLOW 83 foundation established, Maria has ambitious plans:

### 12-Month Goals:
- **Monthly revenue target**: $12,000+
- **New journey launches**: 3 specialized programs
- **Corporate partnerships**: Employee wellness programs
- **Certification program**: Training other nutrition coaches in her methodology

### Long-term Vision:
- **Multiple revenue streams**: Journeys, group programs, certification, speaking
- **Passive income goal**: 60% of revenue from automated systems
- **Impact target**: Serve 1,000+ people annually
- **Lifestyle goal**: 4-day work week with 6-week annual vacations

## Key Takeaways for Other Practitioners

Maria's success with FLOW 83 offers valuable lessons for other health and wellness practitioners:

### Essential Success Strategies:

1. **Start with Your Proven Methods**: Don't reinvent your approach; digitize what already works
2. **Focus on Client Outcomes**: Technology should enhance, not replace, your core value proposition
3. **Price for Transformation**: Charge based on the value you create, not the time you spend
4. **Build Community**: Leverage peer support to enhance individual transformation
5. **Measure Everything**: Use data to continuously improve your programs
6. **Scale Gradually**: Test and refine with small groups before launching widely

### Common Mistakes to Avoid:

1. **Underpricing**: Don't devalue your expertise because it's delivered digitally
2. **Over-promising**: Set realistic expectations about what digital support can achieve
3. **Neglecting Community**: The interaction between participants often drives success
4. **Ignoring Feedback**: Use FLOW 83's analytics to identify and address issues quickly
5. **Abandoning Personal Touch**: Maintain your authentic coaching presence in digital formats

## Conclusion: The Power of Strategic Scaling

Maria's $50K income increase wasn't just about using new technology—it was about strategically scaling her proven expertise to serve more people more effectively. FLOW 83 provided the platform, but Maria's commitment to quality, community, and continuous improvement drove the results.

*"FLOW 83 didn't just change my income; it changed my entire relationship with my business. I'm serving more people, making a bigger impact, and actually have time for my own life again. It's everything I hoped coaching could be when I first started."*

For practitioners feeling stuck in the time-for-money trap, Maria's story demonstrates that with the right platform and approach, it's possible to scale both impact and income without sacrificing the personal connection that makes coaching effective.

### Ready to Transform Your Practice?

If Maria's story resonates with you, consider how FLOW 83 might transform your own practice. The platform that helped Maria increase her income by $50K is available to practitioners in all wellness and coaching fields.

*Want to learn more about creating your own transformational journeys? Join our community of successful practitioners sharing strategies, insights, and support.*

---

*This case study is based on actual results achieved by a FLOW 83 practitioner. Individual results may vary based on effort, market conditions, and implementation quality. Income claims represent documented results from one practitioner's experience.*
    `,
    tags: ["Case Study", "Success Story", "Nutrition", "Income Growth", "Digital Transformation"],
    relatedPosts: [2, 4, 5]
  }
];

const BlogArticle = () => {
  const { id } = useParams<{ id: string }>();
  const articleId = parseInt(id || "1", 10);
  
  // Find the article by ID
  const article = blogPosts.find(post => post.id === articleId);
  
  // Get related articles
  const relatedArticles = blogPosts.filter(post => 
    article?.relatedPosts?.includes(post.id)
  ).slice(0, 3);

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist.</p>
          <Link to="/blog">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Article Header */}
      <header className="bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="mb-6">
            <Link to="/blog">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{article.category}</Badge>
            {article.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {article.title}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            {article.excerpt}
          </p>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">{article.author}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{new Date(article.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{article.readTime}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Like
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="prose prose-lg max-w-none">
          <div className="w-full max-w-2xl mx-auto mb-12 overflow-hidden rounded-xl shadow-lg">
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-64 object-cover"
            />
          </div>
          
          <div 
            className="text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: article.content?.replace(/\n/g, '<br/>').replace(/#{1,6}\s/g, match => {
                const level = match.trim().length;
                return `<h${level} class="text-${4-level}xl font-bold mt-8 mb-4 text-foreground">`;
              }).replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
            }}
          />
        </article>

        {/* Author Bio */}
        <Card className="mt-16 gradient-card border-0">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  About {article.author}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {article.author === "Dr. Sarah Chen" 
                    ? "Dr. Sarah Chen is a leading researcher in digital therapeutics with over 15 years of experience in neuroscience and behavioral psychology. She has published extensively on the intersection of technology and mental health."
                    : `${article.author} is an expert in their field, contributing valuable insights to the Flow 83 community through research and practical experience in digital wellness and therapeutic interventions.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((post) => (
                <Link key={post.id} to={`/blog/${post.id}`}>
                  <Card className="h-full border hover:shadow-md transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                    <div className="w-16 h-16 overflow-hidden rounded-lg mb-4">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                      <Badge variant="outline" className="mb-2 text-xs">
                        {post.category}
                      </Badge>
                      <h3 className="font-semibold text-foreground mb-2 hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <Card className="mt-16 bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Stay Updated with Our Latest Insights
            </h3>
            <p className="text-muted-foreground mb-6">
              Get the latest articles on digital therapeutics and transformative journeys delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-4 py-2 border border-border rounded-md bg-background text-foreground"
              />
              <Button>Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BlogArticle;