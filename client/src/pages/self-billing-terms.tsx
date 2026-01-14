import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, FileText, Scale, AlertTriangle, CreditCard, Building2, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function SelfBillingTermsPage() {
  const { i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const isHebrew = i18n.language === 'he';

  const handleBack = () => {
    setLocation('/payments');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50" dir={isHebrew ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
          data-testid="button-back-payments"
        >
          {isHebrew ? (
            <>
              <ArrowRight className="h-4 w-4 ml-2" />
              חזרה לתשלומים
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payments
            </>
          )}
        </Button>

        <Card className="mb-8">
          <CardHeader className="bg-violet-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Scale className="h-8 w-8" />
              {isHebrew ? "הסכם Self-Billing (חשבונית עצמית)" : "Self-Billing Agreement"}
            </CardTitle>
            <p className="text-violet-100 mt-2">
              {isHebrew 
                ? "תנאים והתחייבויות לשימוש במערכת התשלומים של Flow 83"
                : "Terms and obligations for using the Flow 83 payment system"}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {isHebrew ? (
              <div className="prose prose-slate max-w-none p-6 text-right" data-testid="terms-content-hebrew">
                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <FileText className="h-5 w-5" />
                    1. הגדרות
                  </h2>
                  <ul className="list-disc pr-6 space-y-2 text-slate-700">
                    <li><strong>"הפלטפורמה"</strong> - מערכת Flow 83 המופעלת על ידי החברה.</li>
                    <li><strong>"המנטור"</strong> - משתמש רשום בפלטפורמה המציע שירותי הנחיה והדרכה באמצעות יצירת מסעות (Flows).</li>
                    <li><strong>"המשתתף"</strong> - משתמש קצה הרוכש ומשתתף במסע שנוצר על ידי המנטור.</li>
                    <li><strong>"Self-Billing"</strong> - הסדר חשבוניות עצמיות בו הפלטפורמה מפיקה חשבוניות בשם המנטור עבור תשלומים שהתקבלו.</li>
                    <li><strong>"הארנק הווירטואלי"</strong> - חשבון דיגיטלי בפלטפורמה בו נצברים כספי המנטור מתשלומי משתתפים.</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <CreditCard className="h-5 w-5" />
                    2. הסדר Self-Billing
                  </h2>
                  <div className="bg-violet-50 p-4 rounded-lg border border-violet-200 mb-4">
                    <p className="text-slate-700 mb-3">
                      בהסכמה לתנאים אלו, המנטור מאשר ל-Flow 83:
                    </p>
                    <ul className="list-disc pr-6 space-y-2 text-slate-700">
                      <li>להפיק חשבוניות בשמו עבור תשלומים שהתקבלו ממשתתפים.</li>
                      <li>להפיק חשבוניות Self-Billing בשמו כלפי Flow 83 בזמן משיכת כספים מהארנק הווירטואלי.</li>
                      <li>לנהל את מספור החשבוניות ואת הרישום החשבונאי בהתאם לדרישות החוק.</li>
                    </ul>
                  </div>
                  <p className="text-slate-600 text-sm">
                    הסדר זה פועל בהתאם להוראות רשות המיסים בישראל בנוגע לחשבוניות עצמיות וחשבוניות מס.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <Building2 className="h-5 w-5" />
                    3. חובות המנטור
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">3.1 רישום עסקי תקין</h3>
                      <p className="text-slate-700">
                        המנטור מצהיר ומתחייב כי הוא בעל רישום עסקי תקף בישראל (עוסק מורשה או עוסק פטור), 
                        וכי כל הפרטים שמסר לפלטפורמה הם נכונים, מלאים ומעודכנים.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">3.2 דיווח ותשלום מיסים</h3>
                      <p className="text-slate-700">
                        <strong>המנטור הוא האחראי הבלעדי</strong> לדיווח על הכנסותיו לרשויות המס, 
                        לתשלום מס הכנסה, מע"מ (במידה ורלוונטי), ביטוח לאומי וכל מס או היטל אחר החל על הכנסותיו.
                        Flow 83 אינה אחראית לדיווח או לתשלום מיסים עבור המנטור.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">3.3 תקינות השירות</h3>
                      <p className="text-slate-700">
                        המנטור אחראי באופן בלעדי לאיכות, תוכן ותקינות השירותים וה-Flows שהוא מציע למשתתפים.
                        המנטור מתחייב לספק את השירות כפי שהובטח למשתתפים.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">3.4 שמירת רישומים</h3>
                      <p className="text-slate-700">
                        המנטור מתחייב לשמור עותקים של כל החשבוניות והמסמכים הקשורים לפעילותו בפלטפורמה 
                        למשך 7 שנים לפחות, בהתאם לדרישות החוק בישראל.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <AlertTriangle className="h-5 w-5" />
                    4. הגבלת אחריות והעברת אחריות
                  </h2>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                    <p className="font-semibold text-amber-800 mb-2">סעיף חשוב - יש לקרוא בעיון:</p>
                    <ul className="list-disc pr-6 space-y-3 text-slate-700">
                      <li>
                        <strong>Flow 83 משמשת כפלטפורמת תיווך בלבד</strong> ואינה צד לעסקאות בין המנטור למשתתפים.
                      </li>
                      <li>
                        <strong>המנטור הוא האחראי הבלעדי</strong> לכל התחייבות, מצג, הבטחה או שירות שהוא מציע למשתתפים.
                      </li>
                      <li>
                        <strong>Flow 83 אינה אחראית</strong> לאיכות השירות, לתוצאות המסע, לשביעות רצון המשתתפים 
                        או לכל נזק ישיר או עקיף שייגרם למשתתף או לצד שלישי כתוצאה מהשירותים של המנטור.
                      </li>
                      <li>
                        <strong>בכל מקרה של תביעה, דרישה או טענה</strong> מצד משתתף או צד שלישי בקשר לשירותי המנטור, 
                        המנטור מתחייב לשפות את Flow 83 על כל נזק, הוצאה או הפסד שייגרמו לה.
                      </li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <CreditCard className="h-5 w-5" />
                    5. תשלומים ומשיכות
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">5.1 תשלומים מצד שלישי</h3>
                      <p className="text-slate-700">
                        המנטור מאשר ומבין כי תשלומי המשתתפים עוברים דרך ספקי תשלום צד שלישי (כגון PayPal, Stripe או אחרים).
                        Flow 83 אינה אחראית לתקלות, עיכובים או בעיות מצד ספקי התשלום.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">5.2 משיכת כספים</h3>
                      <p className="text-slate-700">
                        המנטור רשאי למשוך כספים מהארנק הווירטואלי בכפוף לתנאים הבאים:
                      </p>
                      <ul className="list-disc pr-6 mt-2 space-y-1 text-slate-700">
                        <li>סכום מינימלי למשיכה: ₪100</li>
                        <li>המנטור מילא פרטי עסק תקינים ואושר הסכם ה-Self-Billing</li>
                        <li>העברה בנקאית תבוצע בתוך 5-7 ימי עסקים</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">5.3 חשבוניות</h3>
                      <p className="text-slate-700">
                        בכל משיכת כספים, הפלטפורמה תפיק חשבונית Self-Billing בשם המנטור. 
                        החשבונית תכלול את פרטי העסק של המנטור ותישמר במערכת.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <Shield className="h-5 w-5" />
                    6. החזרים וביטולים
                  </h2>
                  <p className="text-slate-700 mb-3">
                    המנטור אחראי באופן בלעדי לטיפול בבקשות להחזרים או ביטולים מצד משתתפים. 
                    על המנטור לפעול בהתאם לחוק הגנת הצרכן ולמדיניות ההחזרים שהוגדרה על ידו.
                  </p>
                  <p className="text-slate-700">
                    Flow 83 רשאית, לפי שיקול דעתה הבלעדי, לעכב או להקפיא כספים בארנק הווירטואלי 
                    במקרים של חשד להונאה, הפרת תנאי שימוש או תלונות חוזרות ממשתתפים.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <Scale className="h-5 w-5" />
                    7. דין וסמכות שיפוט
                  </h2>
                  <p className="text-slate-700">
                    הסכם זה כפוף לחוקי מדינת ישראל. כל מחלוקת בקשר להסכם זה תידון בבתי המשפט המוסמכים במחוז תל אביב-יפו.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    8. שינויים בהסכם
                  </h2>
                  <p className="text-slate-700">
                    Flow 83 שומרת לעצמה את הזכות לעדכן את תנאי הסכם זה מעת לעת. 
                    הודעה על שינויים מהותיים תישלח למנטור באמצעות דוא"ל או הודעה במערכת.
                    המשך השימוש בפלטפורמה לאחר עדכון התנאים מהווה הסכמה לתנאים המעודכנים.
                  </p>
                </section>

                <section className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-slate-600 text-sm">
                    <strong>עדכון אחרון:</strong> ינואר 2026
                  </p>
                  <p className="text-slate-600 text-sm mt-1">
                    בשאלות או הבהרות ניתן לפנות אלינו בכתובת: support@flow83.com
                  </p>
                </section>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none p-6" data-testid="terms-content-english">
                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <FileText className="h-5 w-5" />
                    1. Definitions
                  </h2>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li><strong>"Platform"</strong> - The Flow 83 system operated by the Company.</li>
                    <li><strong>"Mentor"</strong> - A registered user on the Platform offering guidance and coaching services through Flows.</li>
                    <li><strong>"Participant"</strong> - An end user who purchases and participates in a Flow created by the Mentor.</li>
                    <li><strong>"Self-Billing"</strong> - An invoicing arrangement where the Platform issues invoices on behalf of the Mentor for payments received.</li>
                    <li><strong>"Virtual Wallet"</strong> - A digital account on the Platform where the Mentor's funds from participant payments accumulate.</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <CreditCard className="h-5 w-5" />
                    2. Self-Billing Arrangement
                  </h2>
                  <div className="bg-violet-50 p-4 rounded-lg border border-violet-200 mb-4">
                    <p className="text-slate-700 mb-3">
                      By agreeing to these terms, the Mentor authorizes Flow 83 to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-700">
                      <li>Issue invoices on their behalf for payments received from participants.</li>
                      <li>Issue Self-Billing invoices on their behalf to Flow 83 when withdrawing funds from the virtual wallet.</li>
                      <li>Manage invoice numbering and accounting records in accordance with legal requirements.</li>
                    </ul>
                  </div>
                  <p className="text-slate-600 text-sm">
                    This arrangement operates in accordance with Israeli Tax Authority regulations regarding self-billing invoices and tax invoices.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <Building2 className="h-5 w-5" />
                    3. Mentor Obligations
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">3.1 Valid Business Registration</h3>
                      <p className="text-slate-700">
                        The Mentor represents and warrants that they have a valid business registration in Israel 
                        (Osek Murshe or Osek Patur), and that all information provided to the Platform is accurate, complete, and up to date.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">3.2 Tax Reporting and Payment</h3>
                      <p className="text-slate-700">
                        <strong>The Mentor is solely responsible</strong> for reporting their income to tax authorities, 
                        for paying income tax, VAT (if applicable), national insurance, and any other tax or levy applicable to their income.
                        Flow 83 is not responsible for reporting or paying taxes on behalf of the Mentor.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">3.3 Service Quality</h3>
                      <p className="text-slate-700">
                        The Mentor is solely responsible for the quality, content, and validity of the services and Flows they offer to participants.
                        The Mentor commits to providing the service as promised to participants.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">3.4 Record Retention</h3>
                      <p className="text-slate-700">
                        The Mentor commits to retaining copies of all invoices and documents related to their activity on the Platform 
                        for at least 7 years, in accordance with Israeli law requirements.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <AlertTriangle className="h-5 w-5" />
                    4. Limitation and Transfer of Liability
                  </h2>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                    <p className="font-semibold text-amber-800 mb-2">Important Section - Please Read Carefully:</p>
                    <ul className="list-disc pl-6 space-y-3 text-slate-700">
                      <li>
                        <strong>Flow 83 serves as an intermediary platform only</strong> and is not a party to transactions between the Mentor and participants.
                      </li>
                      <li>
                        <strong>The Mentor is solely responsible</strong> for all obligations, representations, promises, or services they offer to participants.
                      </li>
                      <li>
                        <strong>Flow 83 is not responsible</strong> for service quality, journey outcomes, participant satisfaction, 
                        or any direct or indirect damage caused to a participant or third party as a result of the Mentor's services.
                      </li>
                      <li>
                        <strong>In any case of claim, demand, or allegation</strong> from a participant or third party regarding the Mentor's services, 
                        the Mentor agrees to indemnify Flow 83 for any damage, expense, or loss incurred.
                      </li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <CreditCard className="h-5 w-5" />
                    5. Payments and Withdrawals
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">5.1 Third-Party Payments</h3>
                      <p className="text-slate-700">
                        The Mentor acknowledges and understands that participant payments pass through third-party payment providers (such as PayPal, Stripe, or others).
                        Flow 83 is not responsible for malfunctions, delays, or issues from payment providers.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">5.2 Fund Withdrawal</h3>
                      <p className="text-slate-700">
                        The Mentor may withdraw funds from the virtual wallet subject to the following conditions:
                      </p>
                      <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-700">
                        <li>Minimum withdrawal amount: ₪100</li>
                        <li>The Mentor has completed valid business details and approved the Self-Billing agreement</li>
                        <li>Bank transfer will be processed within 5-7 business days</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">5.3 Invoices</h3>
                      <p className="text-slate-700">
                        For each fund withdrawal, the Platform will issue a Self-Billing invoice in the Mentor's name. 
                        The invoice will include the Mentor's business details and will be stored in the system.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <Shield className="h-5 w-5" />
                    6. Refunds and Cancellations
                  </h2>
                  <p className="text-slate-700 mb-3">
                    The Mentor is solely responsible for handling refund or cancellation requests from participants. 
                    The Mentor must act in accordance with consumer protection laws and their defined refund policy.
                  </p>
                  <p className="text-slate-700">
                    Flow 83 may, at its sole discretion, hold or freeze funds in the virtual wallet 
                    in cases of suspected fraud, terms of service violations, or repeated complaints from participants.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    <Scale className="h-5 w-5" />
                    7. Governing Law and Jurisdiction
                  </h2>
                  <p className="text-slate-700">
                    This agreement is subject to the laws of the State of Israel. Any dispute regarding this agreement shall be adjudicated in the competent courts in the Tel Aviv-Jaffa district.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-violet-800 mb-4">
                    8. Changes to Agreement
                  </h2>
                  <p className="text-slate-700">
                    Flow 83 reserves the right to update the terms of this agreement from time to time. 
                    Notice of material changes will be sent to the Mentor via email or system notification.
                    Continued use of the Platform after terms update constitutes agreement to the updated terms.
                  </p>
                </section>

                <section className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-slate-600 text-sm">
                    <strong>Last Updated:</strong> January 2026
                  </p>
                  <p className="text-slate-600 text-sm mt-1">
                    For questions or clarifications, please contact us at: support@flow83.com
                  </p>
                </section>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={handleBack}
            className="bg-violet-600 hover:bg-violet-700"
            data-testid="button-back-to-payments"
          >
            {isHebrew ? "חזרה לדף התשלומים" : "Back to Payments Page"}
          </Button>
        </div>
      </div>
    </div>
  );
}
