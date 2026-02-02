import { Link } from "wouter";
import { Mail, Twitter, Linkedin, Github } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation('landing');

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1 space-y-6">
            <span className="text-2xl font-bold text-violet-400">
              Flow 83
            </span>
            <p className="text-gray-400 leading-relaxed max-w-sm">
              {t('footerDescription')}
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2.5 bg-gray-800 rounded-lg hover:bg-violet-600/20 hover:text-violet-400 transition-colors text-gray-400">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2.5 bg-gray-800 rounded-lg hover:bg-violet-600/20 hover:text-violet-400 transition-colors text-gray-400">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2.5 bg-gray-800 rounded-lg hover:bg-violet-600/20 hover:text-violet-400 transition-colors text-gray-400">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">{t('platform')}</h3>
            <nav className="flex flex-col space-y-3">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm">
                {t('createFlow')}
              </Link>
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm">
                {t('pricing')}
              </Link>
              <Link href="/community" className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm">
                {t('community')}
              </Link>
              <Link href="/blog" className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm">
                {t('blog')}
              </Link>
            </nav>
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">{t('resources')}</h3>
            <nav className="flex flex-col space-y-3">
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm">
                {t('contact')}
              </Link>
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm">
                {t('privacyPolicy')}
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm">
                {t('termsOfService')}
              </Link>
            </nav>
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">{t('contact')}</h3>
            <a href="mailto:support@flow83.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group text-sm">
              <Mail className="w-4 h-4" />
              <span>support@flow83.com</span>
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-gray-500">
            © 2024 Flow 83. {t('allRightsReserved')}
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy-policy" className="hover:text-white transition-colors cursor-pointer">
              {t('privacy')}
            </Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors cursor-pointer">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
