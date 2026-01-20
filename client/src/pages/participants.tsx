import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle, Eye, EyeOff, CreditCard, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Mail, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import type { Participant } from "@shared/schema";

interface ParticipantWithJourney extends Participant {
  journeyName: string;
  paymentVerified?: boolean;
}

export default function ParticipantsPage() {
  const { t, i18n } = useTranslation('dashboard');
  const isMobile = useIsMobile();
  const isHebrew = i18n.language === 'he';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingEmailTo, setSendingEmailTo] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  const { data: participants = [], isLoading } = useQuery<ParticipantWithJourney[]>({
    queryKey: ["/api/participants/all"],
    queryFn: async () => {
      const res = await fetch("/api/participants/all");
      if (!res.ok) throw new Error("Failed to fetch participants");
      return res.json();
    },
  });

  const toggleIdReveal = (participantId: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(participantId)) {
        next.delete(participantId);
      } else {
        next.add(participantId);
      }
      return next;
    });
  };

  const maskIdNumber = (idNumber: string | null | undefined, participantId: string) => {
    if (!idNumber) return '-';
    if (revealedIds.has(participantId)) return idNumber;
    const visibleChars = Math.min(4, idNumber.length);
    return `***${idNumber.slice(-visibleChars)}`;
  };

  const getParticipantStatus = (p: ParticipantWithJourney) => {
    if (p.completedAt) return { label: t('participantStatus.completed'), color: 'bg-emerald-100 text-emerald-700' };
    const daysSinceActive = p.lastActiveAt 
      ? Math.floor((Date.now() - new Date(p.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    if (daysSinceActive > 3) return { label: t('participantStatus.stuck'), color: 'bg-amber-100 text-amber-700' };
    return { label: t('participantStatus.active'), color: 'bg-sky-100 text-sky-700' };
  };

  const handleResendEmail = async (participantId: string) => {
    setSendingEmailTo(participantId);
    try {
      const res = await fetch(`/api/participants/${participantId}/resend-email`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        toast({
          title: isHebrew ? "המייל נשלח בהצלחה" : "Email sent successfully",
          description: isHebrew ? "מייל עם הקישור לתהליך נשלח למשתתף" : "Access email was sent to the participant",
        });
      } else {
        const data = await res.json();
        toast({
          title: isHebrew ? "שגיאה בשליחת המייל" : "Failed to send email",
          description: data.error || (isHebrew ? "נסה שוב מאוחר יותר" : "Please try again later"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: isHebrew ? "שגיאה" : "Error",
        description: isHebrew ? "לא ניתן לשלוח את המייל" : "Could not send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmailTo(null);
    }
  };

  // Filter participants by search query (name, email, or ID number)
  const filteredParticipants = participants.filter(p => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      (p.name?.toLowerCase() || '').includes(query) ||
      (p.email?.toLowerCase() || '').includes(query) ||
      (p.idNumber || '').includes(query)
    );
  });

  const totalPages = Math.ceil(filteredParticipants.length / ITEMS_PER_PAGE);
  const activeCount = participants.filter(p => !p.completedAt && (!p.lastActiveAt || Math.floor((Date.now() - new Date(p.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)) <= 3)).length;
  const stuckCount = participants.filter(p => !p.completedAt && p.lastActiveAt && Math.floor((Date.now() - new Date(p.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)) > 3).length;
  const completedCount = participants.filter(p => p.completedAt).length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-500">{isHebrew ? "טוען..." : "Loading..."}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={isHebrew ? "rtl" : "ltr"}>
        <div className={isHebrew ? "text-right" : "text-left"}>
          <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">
            {isHebrew ? "משתתפים" : "Participants"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isHebrew ? "צפייה וניהול של כל המשתתפים בתהליכים שלך" : "View and manage all participants in your flows"}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className={`absolute ${isHebrew ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400`} />
          <Input
            type="text"
            placeholder={isHebrew ? "חפש לפי שם, אימייל או ת.ז..." : "Search by name, email or ID..."}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className={`${isHebrew ? 'pr-10 text-right' : 'pl-10'} h-10`}
            data-testid="input-search-participants"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center" data-testid="card-active-count">
            <div className="text-2xl font-bold text-sky-700" data-testid="value-active-count">{activeCount}</div>
            <div className="text-sm text-sky-600">{t('participantStatus.active')}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center" data-testid="card-stuck-count">
            <div className="text-2xl font-bold text-amber-700" data-testid="value-stuck-count">{stuckCount}</div>
            <div className="text-sm text-amber-600">{t('participantStatus.stuck')}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center" data-testid="card-completed-count">
            <div className="text-2xl font-bold text-emerald-700" data-testid="value-completed-count">{completedCount}</div>
            <div className="text-sm text-emerald-600">{t('participantStatus.completed')}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6">
          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500">{t('participantsTable.empty')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('participantsTable.emptyHint')}</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500">{isHebrew ? "לא נמצאו תוצאות" : "No results found"}</p>
              <p className="text-xs text-slate-400 mt-1">{isHebrew ? "נסה לחפש במונחים אחרים" : "Try searching with different terms"}</p>
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {filteredParticipants.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((p) => {
                const status = getParticipantStatus(p);
                const isExpanded = expandedParticipant === p.id;
                
                return (
                  <div 
                    key={p.id} 
                    className={`rounded-xl border transition-all ${isExpanded ? 'border-violet-300 bg-violet-50/30' : 'border-slate-200 bg-white'}`}
                    data-testid={`card-participant-${p.id}`}
                  >
                    <button 
                      onClick={() => setExpandedParticipant(isExpanded ? null : p.id)}
                      className="w-full p-3 flex items-center gap-3 min-h-[48px]"
                      data-testid={`toggle-participant-${p.id}`}
                    >
                      <div className="flex-1 min-w-0 text-start">
                        <p className="text-sm font-medium text-slate-900 truncate" data-testid={`text-name-${p.id}`}>
                          {p.name || p.email?.split('@')[0] || '-'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-slate-400">{t('participantsTable.dayNumber', { day: p.currentDay || 1 })}</span>
                        </div>
                      </div>
                      {p.paymentVerified ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-slate-300 flex-shrink-0" />
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">{t('participantsTable.email')}</span>
                          <span className="text-xs text-slate-700" data-testid={`text-email-${p.id}`}>{p.email || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">{t('participantsTable.idNumber')}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-700 font-mono" data-testid={`text-id-${p.id}`}>
                              {maskIdNumber(p.idNumber, p.id)}
                            </span>
                            {p.idNumber && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleIdReveal(p.id); }}
                                className="p-1 hover:bg-slate-200 rounded"
                                data-testid={`button-toggle-id-${p.id}`}
                              >
                                {revealedIds.has(p.id) ? (
                                  <EyeOff className="h-3 w-3 text-slate-400" />
                                ) : (
                                  <Eye className="h-3 w-3 text-slate-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">{t('participantsTable.flow')}</span>
                          <span className="text-xs text-slate-700" data-testid={`text-flow-${p.id}`}>{p.journeyName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">{t('participantsTable.payment')}</span>
                          {p.paymentVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              {t('participantsTable.paid')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                              <CreditCard className="h-3 w-3" />
                              {t('participantsTable.pending')}
                            </span>
                          )}
                        </div>
                        {/* Resend Email Button - Mobile */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleResendEmail(p.id); }}
                          disabled={!p.email || sendingEmailTo === p.id}
                          className="w-full mt-2 text-violet-600 border-violet-200 hover:bg-violet-50"
                          data-testid={`button-resend-email-${p.id}`}
                        >
                          {sendingEmailTo === p.id ? (
                            <Loader2 className="h-3 w-3 animate-spin me-1" />
                          ) : (
                            <Mail className="h-3 w-3 me-1" />
                          )}
                          {isHebrew ? "שלח מייל גישה מחדש" : "Resend access email"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-participants">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-start text-xs font-medium text-slate-500 uppercase tracking-wide py-3 px-4">{t('participantsTable.name')}</th>
                    <th className="text-start text-xs font-medium text-slate-500 uppercase tracking-wide py-3 px-4">{t('participantsTable.email')}</th>
                    <th className="text-start text-xs font-medium text-slate-500 uppercase tracking-wide py-3 px-4">{t('participantsTable.idNumber')}</th>
                    <th className="text-start text-xs font-medium text-slate-500 uppercase tracking-wide py-3 px-4">{t('participantsTable.flow')}</th>
                    <th className="text-start text-xs font-medium text-slate-500 uppercase tracking-wide py-3 px-4">{t('participantsTable.day')}</th>
                    <th className="text-start text-xs font-medium text-slate-500 uppercase tracking-wide py-3 px-4">{t('participantsTable.status')}</th>
                    <th className="text-start text-xs font-medium text-slate-500 uppercase tracking-wide py-3 px-4">{t('participantsTable.payment')}</th>
                    <th className="text-start text-xs font-medium text-slate-500 uppercase tracking-wide py-3 px-4">{isHebrew ? "פעולות" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((p) => {
                    const status = getParticipantStatus(p);
                    return (
                      <tr 
                        key={p.id} 
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        data-testid={`row-participant-${p.id}`}
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-slate-900" data-testid={`text-name-${p.id}`}>
                            {p.name || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-600" data-testid={`text-email-${p.id}`}>
                            {p.email || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 font-mono" data-testid={`text-id-${p.id}`}>
                              {maskIdNumber(p.idNumber, p.id)}
                            </span>
                            {p.idNumber && (
                              <button
                                onClick={() => toggleIdReveal(p.id)}
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                                data-testid={`button-toggle-id-${p.id}`}
                                title={revealedIds.has(p.id) ? t('participantsTable.hideId') : t('participantsTable.showId')}
                              >
                                {revealedIds.has(p.id) ? (
                                  <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-600" data-testid={`text-flow-${p.id}`}>
                            {p.journeyName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-600" data-testid={`text-day-${p.id}`}>
                            {t('participantsTable.dayNumber', { day: p.currentDay || 1 })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span 
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                            data-testid={`status-${p.id}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {p.paymentVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              {t('participantsTable.paid')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
                              <CreditCard className="h-4 w-4" />
                              {t('participantsTable.pending')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendEmail(p.id)}
                            disabled={!p.email || sendingEmailTo === p.id}
                            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                            data-testid={`button-resend-email-${p.id}`}
                            title={isHebrew ? "שלח מייל גישה מחדש" : "Resend access email"}
                          >
                            {sendingEmailTo === p.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredParticipants.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between py-4 px-2 border-t border-slate-100 mt-4">
              <p className="text-sm text-slate-400">
                {isHebrew 
                  ? `מציג ${Math.min(currentPage * ITEMS_PER_PAGE, filteredParticipants.length)} מתוך ${filteredParticipants.length}`
                  : `Showing ${Math.min(currentPage * ITEMS_PER_PAGE, filteredParticipants.length)} of ${filteredParticipants.length}`}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                  data-testid="button-prev-page"
                >
                  {isHebrew ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
                    data-testid={`button-page-${page}`}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                  data-testid="button-next-page"
                >
                  {isHebrew ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
