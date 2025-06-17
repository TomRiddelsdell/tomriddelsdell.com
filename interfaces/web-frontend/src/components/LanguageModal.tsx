import { useState, useEffect } from "react";

export default function LanguageModal() {
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = 'en';
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];

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
    // Handle language change
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}></div>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Language</h2>
          
          <div className="grid grid-cols-1 gap-3">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                className="p-3 rounded-md hover:bg-gray-100 flex items-center justify-between transition-colors"
                onClick={() => handleLanguageChange(lang.code)}
              >
                <span>{lang.name}</span>
                {currentLanguage === lang.code && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
