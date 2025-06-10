import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, Bell, HelpCircle, Globe, ChevronDown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface TopNavbarProps {
  openMobileMenu: () => void;
  title: string;
}

export default function TopNavbar({ openMobileMenu, title }: TopNavbarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { currentLanguage, t, changeLanguage, availableLanguages } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const toggleLanguageModal = () => {
    document.dispatchEvent(new CustomEvent('toggle-language-modal'));
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-4 text-gray-500 hover:text-gray-700 md:hidden"
              onClick={openMobileMenu}
            >
              <Menu className="text-2xl" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Language Dropdown */}
            <DropdownMenu open={langDropdownOpen} onOpenChange={setLangDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center text-sm text-gray-700 hover:text-gray-900"
                >
                  <Globe className="mr-1" size={16} />
                  <span>{currentLanguage}</span>
                  <ChevronDown className="ml-1" size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code} 
                    onClick={() => {
                      changeLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={toggleLanguageModal}>
                  {t("moreLanguages")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <Bell size={20} />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <HelpCircle size={20} />
            </Button>
            
            {user && (
              <div className="ml-2 md:hidden">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                  <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
