import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Check } from "lucide-react";

export default function LanguageModal() {
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = 'en';
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];
  const changeLanguage = (lang: string) => {};
  const t = (key: string) => key;

  useEffect(() => {
    const handleToggleModal = () => {
      setIsOpen((prev) => !prev);
    };

    document.addEventListener('toggle-language-modal', handleToggleModal);
    
    return () => {
      document.removeEventListener('toggle-language-modal', handleToggleModal);
    };
  }, []);

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
  };

  const getLanguageFlag = (langCode: string) => {
    const flagMap: Record<string, string> = {
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'ja': '🇯🇵',
    };
    
    return flagMap[langCode] || '🌐';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900 mb-4">
            {t('selectLanguage')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-2 grid grid-cols-1 gap-3">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              className="p-3 rounded-md hover:bg-gray-100 flex items-center justify-between transition-colors"
              onClick={() => handleLanguageChange(lang.code)}
            >
              <div className="flex items-center">
                <span className="mr-3 text-lg">{getLanguageFlag(lang.code)}</span>
                <span>{lang.name}</span>
              </div>
              {currentLanguage === lang.code && (
                <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        
        <DialogFooter className="mt-4">
          <Button type="button" onClick={() => setIsOpen(false)}>
            {t('done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
