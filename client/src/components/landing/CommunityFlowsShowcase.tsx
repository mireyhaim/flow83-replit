import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Clock } from "lucide-react";
import { Link } from "wouter";
import digitalMindfulness from "@/assets/digital-mindfulness.jpg";
import futureHealing from "@/assets/future-healing.jpg";
import digitalTherapyScience from "@/assets/digital-therapy-science.jpg";
import digitalResilience from "@/assets/digital-resilience.jpg";
import soulCareerAlignment from "@assets/generated_images/soul_career_alignment_abstract_art.png";
import burnoutToBalance from "@assets/generated_images/burnout_to_balance_healing_art.png";

const featuredFlows = [
  {
    id: 1,
    title: "איפוס חרדה ב-7 ימים",
    description: "מסע מקיף לניהול חרדה באמצעות מיינדפולנס וטכניקות נשימה",
    creator: "ד״ר שרה כהן",
    category: "בריאות הנפש",
    participants: 12500,
    likes: 342,
    duration: "7 ימים",
    thumbnail: digitalMindfulness,
    difficulty: "מתחילים"
  },
  {
    id: 2,
    title: "שינוי קריירה מוצלח",
    description: "מדריך צעד אחר צעד למעבר מוצלח לקריירה החדשה שלך",
    creator: "מרקוס רודריגז",
    category: "צמיחה מקצועית",
    participants: 8900,
    likes: 267,
    duration: "7 ימים", 
    thumbnail: futureHealing,
    difficulty: "בינוני"
  },
  {
    id: 3,
    title: "מסע ריפוי מאבל",
    description: "דרך מלאת חמלה דרך אובדן עם טכניקות טיפוליות ותמיכה קהילתית",
    creator: "ד״ר אחמד חסן",
    category: "ריפוי רגשי",
    participants: 4560,
    likes: 198,
    duration: "7 ימים",
    thumbnail: digitalTherapyScience,
    difficulty: "לכל הרמות"
  },
  {
    id: 4,
    title: "נוכחות מנהיגותית",
    description: "פיתוח כישורי מנהיגות אותנטיים ונוכחות ניהולית",
    creator: "ליסה פארק",
    category: "מנהיגות",
    participants: 23200,
    likes: 151,
    duration: "7 ימים",
    thumbnail: digitalResilience,
    difficulty: "מתקדם"
  },
  {
    id: 5,
    title: "התאמת נשמה-קריירה",
    description: "חיבור בין ייעוד, כישרונות טבעיים והכנסה לאנשי מקצוע שמרגישים מנותקים מהעבודה",
    creator: "מאיה גולדשטיין",
    category: "ייעוד",
    participants: 7340,
    likes: 289,
    duration: "7 ימים",
    thumbnail: soulCareerAlignment,
    difficulty: "לכל הרמות"
  },
  {
    id: 6,
    title: "משחיקה לאיזון",
    description: "שחזור אנרגיה, גבולות ובהירות לאנשי מקצוע ויזמים שחווים תשישות",
    creator: "ד״ר רחל טורס",
    category: "בריאות",
    participants: 15800,
    likes: 412,
    duration: "7 ימים",
    thumbnail: burnoutToBalance,
    difficulty: "לכל הרמות"
  }
];

const CommunityFlowsShowcase = () => {
  return (
    <section id="community-flows" className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
          <span className="text-gray-900">דוגמאות ל</span>
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
            פלואים שנוצרו בקהילה
          </span>
        </h2>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          גלו מסעות טרנספורמטיביים שנוצרו על ידי חברי הקהילה המומחים שלנו
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {featuredFlows.map((flow) => (
          <Link href={`/flow-demo/${flow.id}`} key={flow.id} data-testid={`link-flow-${flow.id}`}>
            <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:border-violet-200 transition-all duration-300 cursor-pointer h-full">
              <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={flow.thumbnail} 
                    alt={flow.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <CardTitle className="text-lg text-gray-900">{flow.title}</CardTitle>
                    <CardDescription className="text-gray-500">מאת {flow.creator}</CardDescription>
                  </div>
                </div>
                <Badge className="bg-violet-100 text-violet-700">{flow.category}</Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-600 mb-4">{flow.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {flow.participants}
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {flow.likes}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {flow.duration}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-violet-200 text-violet-600">
                  {flow.difficulty}
                </Badge>
              </div>
            </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CommunityFlowsShowcase;
