import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
import { Link } from "wouter";

export default function MentorTermsPage() {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir={isHebrew ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              {isHebrew ? "חזרה לדשבורד" : "Back to Dashboard"}
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-full bg-violet-100">
                <FileText className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {isHebrew ? "הסכם התקשרות למנטור" : "Mentor Agreement"}
                </h1>
                <p className="text-slate-500">
                  {isHebrew ? "פלטפורמת FLOW83" : "FLOW83 Platform"}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-500 mb-6">
              {isHebrew ? "עודכן לאחרונה: ינואר 2026" : "Last updated: January 2026"}
            </p>

            <div className="prose prose-slate max-w-none text-right" dir="rtl">
              <p className="text-slate-700 leading-relaxed mb-6">
                הסכם זה מהווה הסכם משפטי מחייב בין מפעילת פלטפורמת FLOW83 לבין המנטור, ומסדיר את תנאי השימוש, ההתקשרות, הגבייה, התשלומים והפעילות בפלטפורמה.
              </p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. הגדרות</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li><strong>"הפלטפורמה"</strong> – מערכת FLOW83, לרבות האתר, האפליקציה, הצ'אט, מנועי ה-AI, ממשקי התשלום, הארנק הווירטואלי וכל רכיב טכנולוגי נלווה.</li>
                <li><strong>"FLOW83" / "החברה"</strong> – מפעילת הפלטפורמה.</li>
                <li><strong>"המנטור"</strong> – משתמש רשום המעלה תוכן, שיטה או תהליך ומציע Flows למשתתפי קצה.</li>
                <li><strong>"משתתף"</strong> – משתמש קצה הרוכש תהליך (Flow) דרך הפלטפורמה.</li>
                <li><strong>"Flow"</strong> – תהליך דיגיטלי מונחה AI המבוסס על תוכן המנטור.</li>
                <li><strong>"הארנק הווירטואלי"</strong> – חשבון דיגיטלי בפלטפורמה בו נצברים כספי המנטור.</li>
              </ul>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. מהות השירות</h2>
              <p className="text-slate-700 mb-3">2.1 FLOW83 מספקת פלטפורמה טכנולוגית המאפשרת למנטורים להמיר ידע, שיטה או תהליך למסע דיגיטלי מונחה AI.</p>
              <p className="text-slate-700 mb-3">2.2 FLOW83 אינה מספקת שירותי טיפול, ייעוץ, אימון, ליווי רגשי או מקצועי, ואינה צד לתוכן התהליכים או לתוצאותיהם.</p>
              <p className="text-slate-700 mb-3">2.3 האחריות הבלעדית לתוכן ה-Flow, לאיכותו, לדיוקו, להתאמתו למשתתפים ולחוקיותו חלה על המנטור בלבד.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. מודל תמחור ועמלות</h2>
              <p className="text-slate-700 mb-4">המנטור בוחר במסלול תמחור בהתאם להצעת המחיר המפורסמת בפלטפורמה:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
                <li><strong>Free</strong> – ללא תשלום חודשי, 17% עמלה מכל משתתף משלם</li>
                <li><strong>Pro</strong> – ₪55 לחודש, 15% עמלה מכל משתתף משלם</li>
                <li><strong>Scale</strong> – ₪83 לחודש, 11% עמלה מכל משתתף משלם</li>
              </ul>
              <p className="text-slate-700 mb-3">3.1 העמלה נגבית אך ורק בגין תשלומים שבוצעו בפועל על ידי משתתפים.</p>
              <p className="text-slate-700 mb-3">3.2 FLOW83 רשאית לעדכן מסלולים, מחירים או מבנה עמלות, בהודעה מוקדמת דרך הפלטפורמה.</p>
              <p className="text-slate-700 mb-3">3.3 ניתן לעבור בין מסלולים בכל עת, בהתאם לתנאים המפורסמים במערכת.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. גבייה, הנפקת חשבוניות והעברת כספים</h2>
              
              <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">4.1 גבייה מהמשתתפים</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
                <li>FLOW83 מפעילה מנגנון גבייה מרכזי מהמשתתפים בתהליכים (Flows).</li>
                <li>FLOW83 גובה את התשלום מהמשתתפים.</li>
                <li>FLOW83 מנפיקה למשתתפים חשבוניות ו/או קבלות בגין התשלום.</li>
                <li>המנטור מאשר ומבין כי אינו מנפיק חשבוניות ישירות למשתתפים בגין תשלומים המבוצעים דרך הפלטפורמה.</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">4.2 העברת כספים למנטור וחשבונית מהמנטור ל-FLOW83</h3>
              <p className="text-slate-700 mb-3">בעת בקשת משיכת כספים מהארנק הווירטואלי:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
                <li>FLOW83 תעביר למנטור את הסכום המגיע לו, לאחר ניכוי העמלות החלות.</li>
                <li>כתנאי להעברת הכספים, המנטור מתחייב להנפיק ל-FLOW83 חשבונית ו/או קבלה כדין, בגין הסכום שהועבר אליו, בהתאם לדין ולסטטוס העסקי שלו.</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">4.3 אחריות מיסויית</h3>
              <p className="text-slate-700 mb-3">המנטור אחראי באופן בלעדי:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
                <li>לדיווח על הכנסותיו לרשויות המס</li>
                <li>לתשלום מס הכנסה, מע״מ (אם רלוונטי), ביטוח לאומי וכל מס, היטל או תשלום חובה אחר</li>
                <li>FLOW83 אינה אחראית לדיווח או לתשלום מיסים עבור המנטור.</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">4.4 היעדר ייעוץ מס</h3>
              <p className="text-slate-700 mb-3">FLOW83 אינה מספקת ייעוץ מס, חשבונאות או ייעוץ משפטי, ואינה אחראית לחישובי מס, סיווג הכנסות או עמידת המנטור בדרישות הדין.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. הארנק הווירטואלי ומשיכת כספים</h2>
              <p className="text-slate-700 mb-3">5.1 תשלומי המשתתפים נצברים בארנק הווירטואלי של המנטור.</p>
              <p className="text-slate-700 mb-3">5.2 המנטור רשאי להגיש בקשת משיכת כספים דרך המערכת.</p>
              <p className="text-slate-700 mb-3">5.3 העברת כספים תבוצע בתוך עד 21 ימי עסקים ממועד הגשת בקשת המשיכה.</p>
              <p className="text-slate-700 mb-3">5.4 FLOW83 רשאית לעכב או להקפיא משיכות לצורכי בקרה, החזרים, בירור תלונות או חשד להפרת תנאי ההסכם.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">6. החזרים וביטולים</h2>
              
              <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">6.1 אחריות המנטור</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
                <li>המנטור אחראי באופן בלעדי לקביעת מדיניות ההחזרים והביטולים כלפי המשתתפים ולעמידה בהוראות הדין, לרבות חוק הגנת הצרכן.</li>
                <li>המנטור מתחייב ליידע את המשתתפים מראש בדבר מדיניות ההחזרים החלה על ה-Flow.</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">6.2 יישום החזר בפועל</h3>
              <p className="text-slate-700 mb-3">ההחלטה בדבר אישור או דחיית החזר מתקבלת על ידי המנטור בלבד. FLOW83 אינה קובעת זכאות להחזר.</p>
              <p className="text-slate-700 mb-3">לצורך ביצוע ההחזר בפועל, FLOW83 רשאית:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
                <li>לבצע החזר טכני למשתתף</li>
                <li>להפיק מסמכי זיכוי</li>
                <li>לקזז את סכום ההחזר מהיתרה בארנק הווירטואלי</li>
                <li>לעכב משיכות עתידיות עד להסדרה מלאה</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">6.3 אמצעי הגנה</h3>
              <p className="text-slate-700 mb-3">במקרה של מחלוקת, תלונה או דרישה להחזר, FLOW83 רשאית להקפיא כספים או להגביל משיכות עד לבירור מלא של העניין.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">7. קניין רוחני ושימוש בתוכן</h2>
              <p className="text-slate-700 mb-3">7.1 כל הזכויות בתוכן, בשיטה ובחומרים שהמנטור מעלה לפלטפורמה שייכות למנטור.</p>
              <p className="text-slate-700 mb-3">7.2 המנטור מעניק ל-FLOW83 רישיון שימוש לא-בלעדי, ללא תמורה, לצורך:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
                <li>הפעלת ה-Flow</li>
                <li>הצגתו בפלטפורמה</li>
                <li>עיבוד התוכן לצורכי הפעלת מנועי AI</li>
                <li>שיווק כללי של השירות (ללא חשיפת תוכן מלא)</li>
              </ul>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">8. שימוש ב-AI והגבלת אחריות</h2>
              <p className="text-slate-700 mb-3">8.1 הפלטפורמה עושה שימוש במערכות אוטומטיות ובמודלי AI, לרבות שירותי צד ג', לצורך הפעלת ה-Flows.</p>
              <p className="text-slate-700 mb-3">8.2 ה-AI מהווה כלי טכנולוגי בלבד ואינו מהווה טיפול רפואי, פסיכולוגי, רגשי או ייעוץ מקצועי מכל סוג.</p>
              <p className="text-slate-700 mb-3">8.3 האחריות להתאמת התוכן, השיטה וה-Flow למשתתפים חלה על המנטור בלבד.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">9. פרטיות, נתונים ואבטחת מידע</h2>
              <p className="text-slate-700 mb-3">9.1 FLOW83 אוספת ושומרת נתונים כגון:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
                <li>פרטי חשבון (שם, דוא״ל, סיסמה)</li>
                <li>נתוני שימוש בפלטפורמה</li>
                <li>תוכן שמועלה על ידי המנטור</li>
              </ul>
              <p className="text-slate-700 mb-3">9.2 FLOW83 אינה אוספת, שומרת או מעבדת מידע רפואי, מסמכים רפואיים או מידע מוגן, ואסור למנטורים או למשתתפים להעלות מידע כזה לפלטפורמה.</p>
              <p className="text-slate-700 mb-3">9.3 הנתונים משמשים לצורכי:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
                <li>תפעול הפלטפורמה</li>
                <li>אבטחה ובקרה</li>
                <li>שיפור ביצועי המערכת</li>
              </ul>
              <p className="text-slate-700 mb-3">9.4 FLOW83 אינה מוכרת מידע אישי לצדדים שלישיים.</p>
              <p className="text-slate-700 mb-3">9.5 המנטור רשאי לפנות בכל עת לבקשה לעיון, תיקון או מחיקת נתוניו, בכפוף לחובות חוקיות ושמירת רישומים.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">10. אבטחה וזמינות שירות</h2>
              <p className="text-slate-700 mb-3">10.1 FLOW83 נוקטת באמצעי אבטחה מקובלים להגנה על המידע.</p>
              <p className="text-slate-700 mb-3">10.2 המנטור מודע לכך שאין מערכת מאובטחת ב־100%, והשימוש בפלטפורמה הוא באחריותו.</p>
              <p className="text-slate-700 mb-3">10.3 השירות ניתן במתכונת As Is, ללא התחייבות לזמינות רציפה או לפעילות ללא תקלות.</p>
              <p className="text-slate-700 mb-3">10.4 FLOW83 רשאית לשנות, לעדכן או להסיר רכיבים טכנולוגיים בכל עת.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">11. שימוש אסור</h2>
              <p className="text-slate-700 mb-3">חל איסור להשתמש בפלטפורמה לצורך:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
                <li>פעילות בלתי חוקית</li>
                <li>הטעיה או מצג שווא</li>
                <li>פגיעה במשתתפים או בצדדים שלישיים</li>
                <li>שימוש פוגעני או מניפולטיבי במערכות AI</li>
              </ul>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">12. שיפוי והגבלת אחריות</h2>
              <p className="text-slate-700 mb-3">12.1 המנטור מתחייב לשפות את FLOW83 בגין כל תביעה, דרישה, נזק או הוצאה הנובעים מתוכן, שירות או פעילות מצדו.</p>
              <p className="text-slate-700 mb-3">12.2 אחריות FLOW83, ככל שתיקבע, מוגבלת לסכום העמלות ששולמו על ידי המנטור ב-12 החודשים שקדמו לאירוע.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">13. סיום התקשרות</h2>
              <p className="text-slate-700 mb-3">13.1 המנטור רשאי להפסיק שימוש בפלטפורמה בכל עת.</p>
              <p className="text-slate-700 mb-3">13.2 FLOW83 רשאית להפסיק פעילות מנטור במקרה של הפרת תנאים.</p>
              <p className="text-slate-700 mb-3">13.3 סיום ההתקשרות אינו פוטר מהתחייבויות כספיות קיימות.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">14. העברת זכויות</h2>
              <p className="text-slate-700 mb-3">FLOW83 רשאית להעביר הסכם זה במסגרת מיזוג, רכישה, שינוי בעלות או העברת פעילות.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">15. עדכונים להסכם ולמדיניות</h2>
              <p className="text-slate-700 mb-3">FLOW83 רשאית לעדכן הסכם זה ומדיניות נלווית מעת לעת.</p>
              <p className="text-slate-700 mb-3">המשך השימוש בפלטפורמה לאחר עדכון מהווה הסכמה לתנאים המעודכנים.</p>

              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">16. דין וסמכות שיפוט</h2>
              <p className="text-slate-700 mb-3">הסכם זה כפוף לדין הישראלי.</p>
              <p className="text-slate-700 mb-3">סמכות השיפוט הבלעדית – בתי המשפט במחוז תל אביב–יפו.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
