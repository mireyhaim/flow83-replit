import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const ContactUs = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('landing');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      toast({
        title: t('contactPage.successTitle'),
        description: t('contactPage.successDescription'),
      });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Header />
      <main className="container mx-auto px-6 py-16 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              <span className="text-gray-900">{t('contactPage.title')} </span>
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
                {t('contactPage.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('contactPage.subtitle')}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-violet-600" />
                    {t('contactPage.sendMessage')}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {t('contactPage.formDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t('contactPage.firstName')}</Label>
                        <Input
                          id="firstName"
                          placeholder={t('contactPage.firstNamePlaceholder')}
                          required
                          data-testid="input-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t('contactPage.lastName')}</Label>
                        <Input
                          id="lastName"
                          placeholder={t('contactPage.lastNamePlaceholder')}
                          required
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('contactPage.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('contactPage.emailPlaceholder')}
                        required
                        data-testid="input-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('contactPage.subject')}</Label>
                      <Select required>
                        <SelectTrigger data-testid="select-subject">
                          <SelectValue placeholder={t('contactPage.subjectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">{t('contactPage.subjectGeneral')}</SelectItem>
                          <SelectItem value="technical">{t('contactPage.subjectTechnical')}</SelectItem>
                          <SelectItem value="billing">{t('contactPage.subjectBilling')}</SelectItem>
                          <SelectItem value="partnership">{t('contactPage.subjectPartnership')}</SelectItem>
                          <SelectItem value="feedback">{t('contactPage.subjectFeedback')}</SelectItem>
                          <SelectItem value="bug">{t('contactPage.subjectBug')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t('contactPage.message')}</Label>
                      <Textarea
                        id="message"
                        placeholder={t('contactPage.messagePlaceholder')}
                        className="min-h-[120px]"
                        required
                        data-testid="input-message"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full text-lg px-8 py-4 h-auto rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
                      size="lg"
                      disabled={isSubmitting}
                      data-testid="button-send-message"
                    >
                      {isSubmitting ? t('contactPage.sending') : t('contactPage.sendButton')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUs;
