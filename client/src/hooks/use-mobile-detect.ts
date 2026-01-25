import { useState, useEffect } from 'react';

interface MobileInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
}

export function useMobileDetect(): MobileInfo {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isIOS: false, isAndroid: false, isStandalone: false };
    }
    
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /android/i.test(ua);
    const isMobile = isIOS || isAndroid || /mobile/i.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    return { isMobile, isIOS, isAndroid, isStandalone };
  });

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /android/i.test(ua);
    const isMobile = isIOS || isAndroid || /mobile/i.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    setMobileInfo({ isMobile, isIOS, isAndroid, isStandalone });
  }, []);

  return mobileInfo;
}

export function useAddToHomeScreen(journeyId: string) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const mobileInfo = useMobileDetect();

  useEffect(() => {
    if (!mobileInfo.isMobile || mobileInfo.isStandalone) {
      return;
    }

    const dismissedKey = `a2hs_dismissed_${journeyId}`;
    const dismissed = localStorage.getItem(dismissedKey);
    
    if (dismissed) {
      return;
    }

    const showTimeout = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(showTimeout);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [journeyId, mobileInfo.isMobile, mobileInfo.isStandalone]);

  const dismissPrompt = () => {
    const dismissedKey = `a2hs_dismissed_${journeyId}`;
    localStorage.setItem(dismissedKey, 'true');
    setShowPrompt(false);
  };

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        dismissPrompt();
      }
      setDeferredPrompt(null);
    }
  };

  return {
    showPrompt,
    dismissPrompt,
    triggerInstall,
    canInstallNatively: !!deferredPrompt,
    ...mobileInfo
  };
}
