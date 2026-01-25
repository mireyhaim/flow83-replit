import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, MoreVertical, Smartphone, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddToHomeScreen } from '@/hooks/use-mobile-detect';

interface AddToHomeScreenPopupProps {
  journeyId: string;
  journeyName: string;
}

export function AddToHomeScreenPopup({ journeyId, journeyName }: AddToHomeScreenPopupProps) {
  const { 
    showPrompt, 
    dismissPrompt, 
    triggerInstall, 
    canInstallNatively, 
    isIOS, 
    isAndroid 
  } = useAddToHomeScreen(journeyId);

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
        onClick={dismissPrompt}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg p-6 pb-8"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  הוסף למסך הבית
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {journeyName}
                </p>
              </div>
            </div>
            <button
              onClick={dismissPrompt}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              data-testid="close-a2hs-popup"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
            הוסף קיצור דרך לתהליך ישירות למסך הבית שלך וקבל גישה מהירה בכל רגע.
          </p>

          {canInstallNatively ? (
            <Button
              onClick={triggerInstall}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6 text-lg rounded-xl"
              data-testid="install-a2hs-btn"
            >
              <Plus className="w-5 h-5 ml-2" />
              הוסף למסך הבית
            </Button>
          ) : isIOS ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      לחץ על כפתור השיתוף
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Share className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-500">בתחתית הדפדפן</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      גלול ובחר "הוסף למסך הבית"
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Plus className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-500">Add to Home Screen</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      לחץ "הוסף" לאישור
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={dismissPrompt}
                variant="outline"
                className="w-full py-5 rounded-xl"
                data-testid="dismiss-a2hs-btn"
              >
                הבנתי, תודה
              </Button>
            </div>
          ) : isAndroid ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      לחץ על תפריט הדפדפן
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-500">3 נקודות בפינה</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      בחר "הוסף למסך הבית" או "התקן אפליקציה"
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Plus className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-500">Add to Home screen</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      אשר את ההוספה
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={dismissPrompt}
                variant="outline"
                className="w-full py-5 rounded-xl"
                data-testid="dismiss-a2hs-btn"
              >
                הבנתי, תודה
              </Button>
            </div>
          ) : (
            <Button
              onClick={dismissPrompt}
              variant="outline"
              className="w-full py-5 rounded-xl"
              data-testid="dismiss-a2hs-btn"
            >
              אולי אחר כך
            </Button>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={dismissPrompt}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors w-full text-center"
            >
              לא להציג שוב
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
