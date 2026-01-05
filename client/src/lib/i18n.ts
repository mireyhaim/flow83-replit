import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import heCommon from '../locales/he/common.json';
import heDashboard from '../locales/he/dashboard.json';
import heParticipant from '../locales/he/participant.json';
import heLanding from '../locales/he/landing.json';
import heAuth from '../locales/he/auth.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      he: {
        common: heCommon,
        dashboard: heDashboard,
        participant: heParticipant,
        landing: heLanding,
        auth: heAuth,
      },
    },
    lng: 'he',
    fallbackLng: 'he',
    ns: ['common', 'dashboard', 'participant', 'landing', 'auth'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

if (typeof window !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'he';
}

export default i18n;
