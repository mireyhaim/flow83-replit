import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Shield } from "lucide-react";
import { Link } from "wouter";

interface TermsAcceptanceModalProps {
  open: boolean;
  onAccepted: () => void;
}

export function TermsAcceptanceModal({ open, onAccepted }: TermsAcceptanceModalProps) {
  const { t, i18n } = useTranslation('dashboard');
  const isHebrew = i18n.language === 'he';
  const [accepted, setAccepted] = useState(false);
  const queryClient = useQueryClient();

  const acceptTermsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/accept-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to accept terms');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onAccepted();
    },
  });

  const handleAccept = () => {
    if (accepted) {
      acceptTermsMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-violet-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-center">
            {t('termsModal.title')}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-600">
            {t('termsModal.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <Checkbox
              id="terms-checkbox"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              data-testid="checkbox-accept-terms"
            />
            <Label 
              htmlFor="terms-checkbox" 
              className="text-sm text-slate-700 leading-relaxed cursor-pointer"
            >
              {isHebrew ? (
                <>
                  קראתי ואני מסכים/ה ל
                  <Link href="/mentor-terms" className="text-violet-600 hover:underline mx-1" target="_blank">
                    הסכם ההתקשרות למנטור
                  </Link>
                </>
              ) : (
                <>
                  I have read and agree to the{" "}
                  <Link href="/mentor-terms" className="text-violet-600 hover:underline" target="_blank">
                    Mentor Agreement
                  </Link>
                </>
              )}
            </Label>
          </div>
        </div>

        <Button
          onClick={handleAccept}
          disabled={!accepted || acceptTermsMutation.isPending}
          className="w-full bg-violet-600 hover:bg-violet-700"
          data-testid="button-confirm-terms"
        >
          {acceptTermsMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t('termsModal.confirmButton')
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
