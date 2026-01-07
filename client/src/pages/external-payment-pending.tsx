import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, CheckCircle, Loader2, CreditCard, AlertCircle } from "lucide-react";

export default function ExternalPaymentPendingPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentOpened, setPaymentOpened] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // Verification form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    idNumber: ""
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    idNumber?: string;
  }>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
    const url = params.get("paymentUrl");
    if (url) {
      setPaymentUrl(decodeURIComponent(url));
    }
  }, []);

  const handleOpenPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
      setPaymentOpened(true);
    }
  };

  const handleConfirmPayment = () => {
    setShowVerificationForm(true);
    setVerificationError(null);
  };

  const validateForm = () => {
    const errors: typeof formErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = "שדה חובה";
    }
    
    if (!formData.email.trim()) {
      errors.email = "שדה חובה";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "כתובת אימייל לא תקינה";
    }
    
    if (!formData.idNumber.trim()) {
      errors.idNumber = "שדה חובה";
    } else if (!/^\d{9}$/.test(formData.idNumber)) {
      errors.idNumber = "תעודת זהות חייבת להכיל 9 ספרות";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitVerification = async () => {
    if (!token || !validateForm()) return;
    
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const res = await fetch(`/api/payment/external-verify/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          idNumber: formData.idNumber.trim()
        })
      });
      const data = await res.json();
      
      if (data.success && data.accessToken) {
        navigate(`/p/${data.accessToken}`);
      } else if (data.error === "identity_mismatch") {
        setVerificationError("הפרטים שהזנת לא תואמים לפרטי ההרשמה. אנא בדוק ונסה שוב.");
      } else {
        setVerificationError("אירעה שגיאה. אנא נסה שוב.");
      }
    } catch (error) {
      setVerificationError("אירעה שגיאה. אנא נסה שוב.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setVerificationError(null);
  };

  if (!token || !paymentUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExternalLink className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">שגיאה בתהליך התשלום</h1>
          <p className="text-gray-600 mb-6">
            לא נמצאו פרטי התשלום. נא לחזור ולנסות שוב.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-purple-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-pink-200 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="text-center max-w-md relative bg-white rounded-2xl p-8 shadow-xl">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          {paymentOpened ? 'אישור התשלום' : 'תשלום'}
        </h1>
        
        <div className="space-y-6">
          {!paymentOpened ? (
            <div className="text-right bg-gray-50 rounded-xl p-4">
              <p className="text-gray-600 mb-4">
                לחץ על הכפתור למטה לפתיחת עמוד התשלום
              </p>
              
              <Button 
                onClick={handleOpenPayment}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
                data-testid="button-open-payment"
              >
                <ExternalLink className="w-5 h-5 ml-2" />
                לתשלום
              </Button>
            </div>
          ) : (
            <>
              <div className="text-right bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p className="text-green-700 font-medium">עמוד התשלום נפתח</p>
                </div>
              </div>

              {!showVerificationForm ? (
                <div className="text-right bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 mb-4">
                    לאחר שהשלמת את התשלום, לחץ על הכפתור המתאים:
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleConfirmPayment}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="lg"
                      data-testid="button-confirm-payment"
                    >
                      <CheckCircle className="w-5 h-5 ml-2" />
                      שילמתי - התחל את ה-Flow
                    </Button>
                    
                    <Button 
                      onClick={handleOpenPayment}
                      variant="outline"
                      className="w-full"
                      size="lg"
                      data-testid="button-reopen-payment"
                    >
                      <ExternalLink className="w-5 h-5 ml-2" />
                      פתח שוב את עמוד התשלום
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-right bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 mb-4">
                    הזן את הפרטים שלך להתחברות לתהליך:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-right block text-gray-700">
                        שם ושם משפחה
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="ישראל ישראלי"
                        className={`text-right ${formErrors.name ? "border-red-500" : ""}`}
                        data-testid="input-verify-name"
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm">{formErrors.name}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-right block text-gray-700">
                        אימייל
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="israel@example.com"
                        className={`text-right ${formErrors.email ? "border-red-500" : ""}`}
                        dir="ltr"
                        data-testid="input-verify-email"
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-sm">{formErrors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="idNumber" className="text-right block text-gray-700">
                        תעודת זהות
                      </Label>
                      <Input
                        id="idNumber"
                        value={formData.idNumber}
                        onChange={(e) => handleInputChange("idNumber", e.target.value.replace(/\D/g, "").slice(0, 9))}
                        placeholder="123456789"
                        className={`text-right ${formErrors.idNumber ? "border-red-500" : ""}`}
                        dir="ltr"
                        data-testid="input-verify-id"
                      />
                      {formErrors.idNumber && (
                        <p className="text-red-500 text-sm">{formErrors.idNumber}</p>
                      )}
                    </div>

                    {verificationError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-700 text-sm">{verificationError}</p>
                      </div>
                    )}
                    
                    <div className="space-y-3 pt-2">
                      <Button 
                        onClick={handleSubmitVerification}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        size="lg"
                        disabled={isVerifying}
                        data-testid="button-submit-verification"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                            מאמת...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 ml-2" />
                            התחבר לתהליך
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        onClick={() => setShowVerificationForm(false)}
                        variant="ghost"
                        className="w-full text-gray-500"
                        size="sm"
                        data-testid="button-back-to-payment"
                      >
                        חזרה
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-500">
          התשלום מתבצע דרך ספק התשלומים של המנטור
        </p>
      </div>
    </div>
  );
}
