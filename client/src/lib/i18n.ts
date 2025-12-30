import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '../locales/en/common.json';
import enDashboard from '../locales/en/dashboard.json';
import enParticipant from '../locales/en/participant.json';
import enLanding from '../locales/en/landing.json';
import enAuth from '../locales/en/auth.json';

import heCommon from '../locales/he/common.json';
import heDashboard from '../locales/he/dashboard.json';
import heParticipant from '../locales/he/participant.json';
import heLanding from '../locales/he/landing.json';
import heAuth from '../locales/he/auth.json';

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        dashboard: enDashboard,
        participant: enParticipant,
        landing: enLanding,
        auth: enAuth,
      },
      he: {
        common: heCommon,
        dashboard: heDashboard,
        participant: heParticipant,
        landing: heLanding,
        auth: heAuth,
      },
    },
    lng: savedLanguage || 'en',
    fallbackLng: 'en',
    ns: ['common', 'dashboard', 'participant', 'landing', 'auth'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng);
    document.documentElement.dir = lng === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  }
});

if (typeof window !== 'undefined') {
  document.documentElement.dir = (savedLanguage || 'en') === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = savedLanguage || 'en';
}

export default i18n;
