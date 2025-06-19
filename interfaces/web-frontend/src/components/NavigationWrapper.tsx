import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import LanguageModal from "./LanguageModal";
import { useMobile } from "../hooks/use-mobile";

interface NavigationWrapperProps {
  title: string;
  children: React.ReactNode;
}

export default function NavigationWrapper({ title, children }: NavigationWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMobile();

  const handleOpenMobileMenu = () => {
    setMobileMenuOpen(true);
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isMobile={isMobile && mobileMenuOpen} />
      
      <main className="flex-grow">
        <TopNavbar 
          openMobileMenu={handleOpenMobileMenu} 
          title={title}
        />
        
        {children}
      </main>
      
      <LanguageModal />
      
      {/* Mobile menu overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleCloseMobileMenu}
        />
      )}
    </div>
  );
}