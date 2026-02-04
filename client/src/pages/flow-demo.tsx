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
import soulCareerAlignment from "@assets/generated_images/soul_career_alignment_abstract_art.png";
import burnoutToBalance from "@assets/generated_images/burnout_to_balance_healing_art.png";

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
    title: "איפוס חרדה ב-7 ימים",
    description: "מסע מקיף לניהול חרדה באמצעות מיינדפולנס וטכניקות נשימה",
    creator: "ד״ר שרה כהן",
    category: "בריאות הנפש",
    participants: 12500,
    likes: 342,
    duration: "7 ימים",
    thumbnail: digitalMindfulness,
    difficulty: "מתחילים",
    goal: "לעזור למשתתפים לפתח כלים מעשיים לניהול חרדה ולמצוא שקט פנימי",
    audience: "כל מי שחווה חרדה, לחץ או עומס בחיי היומיום",
    outcome: "בסיום הפלואו, למשתתפים יהיה ארגז כלים אישי של תרגילי נשימה, תרגולי מיינדפולנס וטכניקות קוגניטיביות לניהול חרדה ביעילות",
    days: [
      { title: "הבנת החרדה שלך", description: "למד לזהות את הטריגרים לחרדה ולהבין איך היא מתבטאת בגוף ובנפש" },
      { title: "כוחה של הנשימה", description: "שלוט בשלוש טכניקות נשימה שמרגיעות את מערכת העצבים מיידית" },
      { title: "מודעות קשובה", description: "תרגל מודעות לרגע הנוכחי כדי לשבור את מעגל המחשבות החרדתיות" },
      { title: "מסגור מחדש של מחשבות", description: "למד לזהות ולאתגר דפוסי חשיבה שליליים" },
      { title: "חיבור גוף-נפש", description: "גלה איך מתח פיזי קשור לחרדה ולמד טכניקות שחרור" },
      { title: "בניית חוסן", description: "צור שגרות יומיות שתומכות בבריאות הנפשית ומונעות הצטברות חרדה" },
      { title: "ארגז הכלים האישי שלך", description: "שלב את כל הטכניקות לתוכנית אישית לניהול חרדה" }
    ]
  },
  "2": {
    title: "שינוי קריירה מוצלח",
    description: "מדריך צעד אחר צעד למעבר מוצלח לקריירה החדשה שלך",
    creator: "מרקוס רודריגז",
    category: "צמיחה מקצועית",
    participants: 8900,
    likes: 267,
    duration: "7 ימים",
    thumbnail: futureHealing,
    difficulty: "בינוני",
    goal: "להנחות אנשי מקצוע דרך מעבר קריירה מוצלח עם בהירות וביטחון",
    audience: "אנשי מקצוע השוקלים שינוי קריירה או מחפשים עבודה יותר מספקת",
    outcome: "למשתתפים יהיה כיוון קריירה ברור, מיתוג אישי מעודכן ותוכנית פעולה למימוש המעבר",
    days: [
      { title: "הערכת קריירה", description: "הערך את המצב הנוכחי שלך וזהה מה מניע את הרצון שלך לשינוי" },
      { title: "ערכים ועדיפויות", description: "הבהר מה הכי חשוב לך בקריירה האידיאלית" },
      { title: "מיפוי מיומנויות", description: "מפה את הכישורים שלך שניתנים להעברה וזהה פערים לטיפול" },
      { title: "חקירת אפשרויות", description: "חקור והעריך מסלולי קריירה פוטנציאליים שמתאימים למטרות שלך" },
      { title: "מיתוג אישי", description: "עדכן את הסיפור שלך, קורות החיים והנוכחות המקוונת לכיוון החדש" },
      { title: "אסטרטגיית נטוורקינג", description: "בנה קשרים בתעשייה היעד דרך פנייה אסטרטגית" },
      { title: "תכנון פעולה", description: "צור לוח זמנים ואבני דרך ריאליסטיים למעבר הקריירה" }
    ]
  },
  "3": {
    title: "מסע ריפוי מאבל",
    description: "דרך מלאת חמלה דרך אובדן עם טכניקות טיפוליות ותמיכה קהילתית",
    creator: "ד״ר אחמד חסן",
    category: "ריפוי רגשי",
    participants: 4560,
    likes: 198,
    duration: "7 ימים",
    thumbnail: digitalTherapyScience,
    difficulty: "לכל הרמות",
    goal: "לספק תמיכה עדינה וכלים מעשיים לניווט בתהליך האבל",
    audience: "כל מי שחווה אובדן ומחפש הנחיה מלאת חמלה דרך האבל",
    outcome: "המשתתפים יפתחו מנגנוני התמודדות בריאים וימצאו משמעות ותקווה תוך כיבוד האובדן",
    days: [
      { title: "כיבוד האובדן שלך", description: "צור מרחב בטוח להכרה ולביטוי האבל שלך" },
      { title: "הבנת האבל", description: "למד על תהליך האבל ולמה אין דרך 'נכונה' להתאבל" },
      { title: "חמלה עצמית", description: "תרגל טיפול עצמי וחסד בזמן הקשה הזה" },
      { title: "עיבוד רגשות", description: "חקור דרכים בריאות לביטוי ושחרור רגשות קשים" },
      { title: "שמירת זיכרון", description: "צור דרכים משמעותיות לכבד ולזכור את יקירך" },
      { title: "מציאת תמיכה", description: "בנה רשת תמיכה ולמד לבקש עזרה כשצריך" },
      { title: "להמשיך קדימה", description: "גלה איך לשאת את האהבה שלך קדימה תוך חיבוק החיים מחדש" }
    ]
  },
  "4": {
    title: "נוכחות מנהיגותית",
    description: "פיתוח כישורי מנהיגות אותנטיים ונוכחות ניהולית",
    creator: "ליסה פארק",
    category: "מנהיגות",
    participants: 23200,
    likes: 151,
    duration: "7 ימים",
    thumbnail: digitalResilience,
    difficulty: "מתקדם",
    goal: "לעזור למנהיגים מתפתחים לפתח נוכחות והשפעה אותנטית",
    audience: "מנהלים, ראשי צוותים ואנשי מקצוע שנכנסים לתפקידי מנהיגות",
    outcome: "המשתתפים יקרינו ביטחון, יתקשרו בהשפעה ויעוררו את הצוותים שלהם ביעילות",
    days: [
      { title: "הגדרת סגנון המנהיגות שלך", description: "זהה את נקודות החוזק המנהיגותיות הייחודיות והקול האותנטי שלך" },
      { title: "תקשורת ניהולית", description: "שלוט באמנות התקשורת הברורה, הבטוחה והמשכנעת" },
      { title: "שפת גוף ונוכחות", description: "למד להקרין ביטחון דרך תקשורת לא מילולית" },
      { title: "חשיבה אסטרטגית", description: "פתח את היכולת לראות את התמונה הגדולה ולקבל החלטות אסטרטגיות" },
      { title: "בניית אמון", description: "צור בטיחות פסיכולוגית וזכה באמון ובכבוד הצוות שלך" },
      { title: "שיחות קשות", description: "נווט בדיונים מאתגרים בחן ובישירות" },
      { title: "השראה לאחרים", description: "הניע והעצמה את הצוות שלך להשיג תוצאות יוצאות דופן" }
    ]
  },
  "5": {
    title: "התאמת נשמה-קריירה",
    description: "חיבור בין ייעוד, כישרונות טבעיים והכנסה לאנשי מקצוע שמרגישים מנותקים מהעבודה",
    creator: "מאיה גולדשטיין",
    category: "ייעוד",
    participants: 7340,
    likes: 289,
    duration: "7 ימים",
    thumbnail: soulCareerAlignment,
    difficulty: "לכל הרמות",
    goal: "לחבר מחדש את העצמי האמיתי שלך עם הכישרונות הטבעיים ולהפוך זאת להכנסה משמעותית",
    audience: "אנשי מקצוע שמצליחים כלפי חוץ אבל מרגישים מנותקים מבפנים, שחשים שהכישרונות שלהם לא מנוצלים והעבודה לא משקפת מי שהם באמת",
    outcome: "המשתתפים יקבלו בהירות לגבי הייעוד שלהם, יתחברו מחדש לחוזקות הטבעיות ויגלו איך להתאים את הקריירה לעצמי האותנטי",
    days: [
      { title: "עצירה והקשבה", description: "צור מרחב להאטה, לחקור איפה אתה היום ולהקשיב לאותות פנימיים שאולי התעלמת מהם" },
      { title: "גילוי מחדש של הכישרונות הטבעיים", description: "התחבר מחדש לחוזקות המולדות שלך — מה שבא לך טבעי, לפני שהציפיות עיצבו את הדרך" },
      { title: "ערכים וייעוד", description: "חקור מה באמת חשוב לך מתחת להישגים ולפרודוקטיביות, ובנה תחושת כיוון עמוקה יותר" },
      { title: "שחרור חסימות קריירה וכסף", description: "זהה ושחרר אמונות מגבילות כמו 'אני לא יכול להתפרנס ממה שאני אוהב' או 'מאוחר מדי לשנות'" },
      { title: "תרגום ייעוד למציאות", description: "חקור איך הייעוד והכישרונות שלך יכולים לקבל צורה — תפקידים, פרויקטים או כיוונים ללא לחץ" },
      { title: "התגלמות בזהות מקצועית חדשה", description: "צעד לתוך זהות פנימית חדשה שבה העבודה שלך מתיישרת עם מי שאתה באמת" },
      { title: "אינטגרציה והתחייבות", description: "עגן את התובנות שלך והתחייב לצעד אחד מיושר עם בהירות, ביטחון ושקט פנימי" }
    ]
  },
  "6": {
    title: "משחיקה לאיזון",
    description: "שחזור אנרגיה, גבולות ובהירות לאנשי מקצוע ויזמים שחווים תשישות",
    creator: "ד״ר רחל טורס",
    category: "בריאות",
    participants: 15800,
    likes: 412,
    duration: "7 ימים",
    thumbnail: burnoutToBalance,
    difficulty: "לכל הרמות",
    goal: "לעזור לך להאט, לשחזר אנרגיה ולבנות מחדש יחס בריא יותר עם העבודה",
    audience: "אנשי מקצוע ויזמים שממשיכים גם כשהם מותשים — אלה שמתפקדים, מספקים ואכפת להם עמוקות, אבל מרגישים מרוקנים נפשית ורגשית",
    outcome: "המשתתפים יפתחו גבולות ברי-קיימא, יתחברו מחדש לאותות הגוף וייצרו קצב עבודה שמכבד את האנרגיה והמגבלות שלהם",
    days: [
      { title: "הכרה בשחיקה", description: "הכר בכנות היכן אתה מרוקן — רגשית, מנטלית או פיזית — והחלף שיפוט עצמי במודעות" },
      { title: "זיהוי דפוסים מרוקנים", description: "חקור דפוסים שיוצרים עומס יתר: אחריות יתר, רצון לרצות, זמינות מתמדת, עבודה רגשית" },
      { title: "גבולות בלי אשמה", description: "בחן את היחס שלך לגבולות ולמד לראות אותם כמעשי כבוד עצמי, לא אנוכיות" },
      { title: "התחברות מחדש לגוף ולאנרגיה", description: "התמקד בהארקה, נשימה ומודעות פיזית כדי להתחבר מחדש ולמלא את מאגרי האנרגיה" },
      { title: "מסגור מחדש של היחס לעבודה", description: "אתגר אמונות כמו 'הערך שלי שווה לפרודוקטיביות שלי' ו'אם אאט, אכשל'" },
      { title: "יצירת קצב יומי תומך", description: "עצב שינויים קטנים וריאליסטיים — קצב עבודה שמכבד את האנרגיה, המיקוד והמגבלות שלך" },
      { title: "בהירות ואיזון בר-קיימא", description: "הגדר איך תגן על האנרגיה שלך, זהה סימני אזהרה מוקדמים והגב אחרת מעכשיו" }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">הפלואו לא נמצא</h1>
          <Link href="/">
            <Button className="rounded-full bg-violet-600 hover:bg-violet-700">
              חזרה לדף הבית
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
          <Link href="/community#community-flows" className="inline-flex items-center text-violet-600 hover:text-violet-700 mb-8" data-testid="link-back">
            <ArrowLeft className="w-4 h-4 ml-2" />
            חזרה לפלואים
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
                <p className="text-gray-500 mb-3">מאת {flow.creator}</p>
                <p className="text-gray-600 text-lg">{flow.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center">
                <Users className="w-4 h-4 ml-2" />
                {flow.participants.toLocaleString()} משתתפים
              </div>
              <div className="flex items-center">
                <Heart className="w-4 h-4 ml-2" />
                {flow.likes} לייקים
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 ml-2" />
                {flow.duration}
              </div>
              <Badge variant="outline" className="border-violet-200 text-violet-600">
                {flow.difficulty}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">מטרה</h3>
                <p className="text-gray-600 text-sm">{flow.goal}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">למי זה מתאים?</h3>
                <p className="text-gray-600 text-sm">{flow.audience}</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
              מה תחוו בכל יום
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
                <h3 className="font-semibold text-gray-900 mb-2">בסיום הפלואו הזה</h3>
                <p className="text-gray-600">{flow.outcome}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center shadow-lg" data-testid="card-cta">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              צרו פלואים כאלה עם Flow 83
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              הפכו את המומחיות שלכם למסעות טרנספורמטיביים. הבינה המלאכותית שלנו עוזרת לכם לבנות פלואים מותאמים אישית שמנחים את הלקוחות שלכם צעד אחר צעד.
            </p>
            <Button 
              asChild
              className="text-lg px-8 py-4 h-auto rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
              data-testid="button-start-creating"
            >
              <Link href="/dashboard">התחילו ליצור את הפלואו שלכם</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
