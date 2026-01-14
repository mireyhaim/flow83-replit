import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Scale } from "lucide-react";
import { useLocation } from "wouter";

export default function SelfBillingTermsPage() {
  const { i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const isHebrew = i18n.language === 'he';

  const handleBack = () => {
    setLocation('/payments');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
          data-testid="button-back-payments"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          חזרה לתשלומים
        </Button>

        <Card className="mb-8">
          <CardHeader className="bg-violet-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Scale className="h-8 w-8" />
              הסכם Self-Billing
            </CardTitle>
            <p className="text-violet-100 mt-2">
              תנאים והתחייבויות לשימוש במערכת התשלומים של Flow 83
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="prose prose-slate max-w-none p-6 text-right" data-testid="terms-content-hebrew">
              <p className="text-sm text-slate-500 mb-6">עודכן לאחרונה: ינואר 2026</p>
              
              <p className="text-slate-700 mb-8 font-medium">
                הסכם זה מהווה חלק בלתי נפרד מתנאי השימוש של פלטפורמת Flow 83 ומהווה הסכם מחייב בין המנטור לבין מפעילת הפלטפורמה.
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-violet-800 mb-4">1. הגדרות</h2>
                <ul className="list-disc pr-6 space-y-2 text-slate-700">
                  <li><strong>"הפלטפורמה"</strong> – מערכת Flow 83, לרבות האתר, האפליקציה, ממשקי התשלום, הארנק הווירטואלי וכל רכיב טכנולוגי נלווה.</li>
                  <li><strong>"Flow 83" / "החברה"</strong> – הגוף המפעיל את הפלטפורמה.</li>
                  <li><strong>"המנטור"</strong> – משתמש רשום בפלטפורמה המציע שירותי הנחיה, ליווי, הדרכה או תוכן דיגיטלי באמצעות יצירת מסעות (Flows).</li>
                  <li><strong>"המשתתף"</strong> – משתמש קצה הרוכש ומשתתף במסע שנוצר על ידי המנטור.</li>
                  <li><strong>"Self-Billing"</strong> – הסדר חשבונאי במסגרתו הפלטפורמה מפיקה חשבוניות ו/או מסמכים חשבונאיים בשם המנטור ובהתאם לנתוניו.</li>
                  <li><strong>"הארנק הווירטואלי"</strong> – חשבון דיגיטלי בפלטפורמה בו נצברים כספים המיועדים למנטור בגין תשלומי משתתפים.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-violet-800 mb-4">2. מהות ההסדר והסכמה עקרונית</h2>
                <div className="space-y-3 text-slate-700">
                  <p><strong>2.1</strong> בהסכמתו להסכם זה, המנטור מאשר ומסכים כי Flow 83 תפעל כמפיקה ומנהלת של מסמכים חשבונאיים עבורו במסגרת הסדר Self-Billing.</p>
                  <p><strong>2.2</strong> המנטור מאשר כי הוא מבין שהפלטפורמה מפיקה מסמכים חשבונאיים בשמו, אך אינה הופכת לצד לעסקאות בינו לבין המשתתפים.</p>
                  <p><strong>2.3</strong> הסדר זה מבוסס על הוראות הדין בישראל בנוגע לחשבוניות עצמיות, והוא ייושם בכפוף לדין החל.</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-violet-800 mb-4">3. ייפוי כוח חשבונאי</h2>
                <div className="space-y-3 text-slate-700">
                  <p><strong>3.1</strong> המנטור מעניק בזאת ל-Flow 83 ייפוי כוח מפורש, בלתי חוזר ומוגבל מטרה, לפעול בשמו ולמענו לצורך:</p>
                  <ul className="list-disc pr-8 space-y-1">
                    <li>הפקת חשבוניות ו/או קבלות למשתתפים</li>
                    <li>הפקת חשבוניות Self-Billing כלפי Flow 83</li>
                    <li>הפקת מסמכי זיכוי, תיקון או ביטול חשבונאי</li>
                    <li>ניהול מספור חשבוניות ורישום חשבונאי</li>
                  </ul>
                  <p><strong>3.2</strong> ייפוי כוח זה יעמוד בתוקפו כל עוד מתקיימת פעילות כספית, יתרה בארנק הווירטואלי או חוב פתוח בין הצדדים.</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-violet-800 mb-4">4. הצהרות והתחייבויות המנטור</h2>
                <div className="space-y-4 text-slate-700">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">4.1 רישום עסקי ונתונים</h3>
                    <p className="mb-2">המנטור מצהיר כי:</p>
                    <ul className="list-disc pr-8 space-y-1">
                      <li>הוא בעל רישום עסקי תקף בישראל (עוסק פטור / עוסק מורשה / חברה)</li>
                      <li>כל הפרטים שמסר (ח״פ/ת״ז, כתובת, סטטוס מע״מ, פרטי בנק) מדויקים, מלאים ומעודכנים</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">4.2 שינוי סטטוס</h3>
                    <p>המנטור מתחייב לעדכן את Flow 83 לאלתר בכל שינוי בסטטוס העסקי שלו.</p>
                    <p className="text-amber-700">אי-עדכון ייחשב כהפרת ההסכם ויאפשר הקפאת כספים.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">4.3 אחריות למסים</h3>
                    <p>המנטור הוא האחראי הבלעדי לדיווח ותשלום כל המסים החלים עליו, לרבות:</p>
                    <p>מס הכנסה, מע״מ, ביטוח לאומי וכל היטל אחר.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">4.4 איכות השירות</h3>
                    <p>המנטור אחראי באופן בלעדי לתוכן, לאיכות, לאמינות ולחוקיות השירותים וה-Flows שהוא מציע.</p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-violet-800 mb-4">5. תשלומים, ארנק וירטואלי ומשיכות</h2>
                <div className="space-y-3 text-slate-700">
                  <p><strong>5.1</strong> תשלומי משתתפים ייגבו באמצעות ספקי תשלום צד שלישי או מערכות מאושרות בפלטפורמה.</p>
                  <p><strong>5.2</strong> הסכומים ייצברו בארנק הווירטואלי של המנטור.</p>
                  <p><strong>5.3</strong> משיכת כספים תתאפשר בכפוף ל:</p>
                  <ul className="list-disc pr-8 space-y-1">
                    <li>סכום מינימלי: ₪100</li>
                    <li>פרטי עסק תקינים</li>
                    <li>אישור הסכם זה</li>
                  </ul>
                  <p><strong>5.4</strong> משיכה תבוצע בתחילת החודש העוקב.</p>
                  <p><strong>5.5</strong> בעת כל משיכה תופק חשבונית Self-Billing בשם המנטור ותישמר במערכת.</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-violet-800 mb-4">6. החזרים, ביטולים וקיזוזים</h2>
                <div className="space-y-3 text-slate-700">
                  <p><strong>6.1</strong> המנטור אחראי בלעדית לטיפול בבקשות החזר מצד משתתפים.</p>
                  <p><strong>6.2</strong> במקרה של החזר לאחר הפקת חשבונית:</p>
                  <ul className="list-disc pr-8 space-y-1">
                    <li>Flow 83 רשאית להפיק מסמך זיכוי</li>
                    <li>לקזז את הסכום מיתרות עתידיות</li>
                    <li>לעכב משיכות עד להסדרת העניין</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-violet-800 mb-4">7. הקפאה, הפסקת שירות ובקרה</h2>
                <div className="space-y-3 text-slate-700">
                  <p><strong>7.1</strong> Flow 83 רשאית, לפי שיקול דעתה הבלעדי:</p>
                  <ul className="list-disc pr-8 space-y-1">
                    <li>להקפיא כספים</li>
                    <li>להשעות או להפסיק שירות</li>
                    <li>לדרוש מסמכי אימות (KYC-lite)</li>
                  </ul>
                  <p><strong>7.2</strong> זאת בין היתר במקרים של:</p>
                  <ul className="list-disc pr-8 space-y-1">
                    <li>חשד להונאה</li>
                    <li>הפרת תנאים</li>
                    <li>תלונות חוזרות</li>
                    <li>שימוש אסור או בלתי חוקי</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8 bg-red-50 p-4 rounded-lg border border-red-200">
                <h2 className="text-xl font-bold text-red-800 mb-4">8. שימוש אסור והלבנת הון</h2>
                <div className="space-y-3 text-slate-700">
                  <p>המנטור מתחייב שלא להשתמש בפלטפורמה לצורך פעילות אסורה, לרבות:</p>
                  <ul className="list-disc pr-8 space-y-1">
                    <li>הלבנת הון</li>
                    <li>מכירת שירותים אסורים</li>
                    <li>הטעיית צרכנים</li>
                  </ul>
                  <p className="font-semibold text-red-700">Flow 83 רשאית לדווח לרשויות בהתאם לחוק.</p>
                </div>
              </section>

              <section className="mb-8 bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h2 className="text-xl font-bold text-amber-800 mb-4">9. הגבלת אחריות ושיפוי</h2>
                <div className="space-y-3 text-slate-700">
                  <p><strong>9.1</strong> Flow 83 אינה צד לעסקאות בין המנטור למשתתפים.</p>
                  <p><strong>9.2</strong> המנטור מתחייב לשפות את Flow 83 בגין כל נזק, תביעה או הוצאה הנובעים מהשירותים שסיפק.</p>
                  <p><strong>9.3</strong> אחריות Flow 83, ככל שתיקבע, מוגבלת לסכום העמלות ששולמו על ידי המנטור ב-12 החודשים שקדמו לאירוע.</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-violet-800 mb-4">10. דין וסמכות שיפוט</h2>
                <div className="space-y-2 text-slate-700">
                  <p>הסכם זה כפוף לדין הישראלי בלבד.</p>
                  <p>סמכות השיפוט הבלעדית נתונה לבתי המשפט במחוז תל אביב-יפו.</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-violet-800 mb-4">11. שינויים בהסכם</h2>
                <div className="space-y-2 text-slate-700">
                  <p>Flow 83 רשאית לעדכן הסכם זה מעת לעת.</p>
                  <p>המשך שימוש בפלטפורמה מהווה הסכמה לתנאים המעודכנים.</p>
                </div>
              </section>

              <section className="bg-slate-100 p-4 rounded-lg">
                <h2 className="text-xl font-bold text-violet-800 mb-4">12. יצירת קשר</h2>
                <p className="text-slate-700">לשאלות והבהרות:</p>
                <p className="text-slate-700">📧 support@flow83.com</p>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={handleBack}
            className="bg-violet-600 hover:bg-violet-700"
            data-testid="button-back-to-payments"
          >
            חזרה לדף התשלומים
          </Button>
        </div>
      </div>
    </div>
  );
}
