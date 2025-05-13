import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import QuickStats from "@/components/QuickStats";
import RecentWorkflows from "@/components/RecentWorkflows";
import ConnectedApps from "@/components/ConnectedApps";
import PopularTemplates from "@/components/PopularTemplates";
import CreateWorkflowButton from "@/components/CreateWorkflowButton";
import LanguageModal from "@/components/LanguageModal";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useMobile();
  
  const userName = user?.displayName || user?.email?.split('@')[0] || '';

  return (
    <>
      <Sidebar isMobile={isMobile && mobileMenuOpen} />
      
      <main className="flex-grow">
        <TopNavbar 
          openMobileMenu={() => setMobileMenuOpen(true)} 
          title={t('dashboard')}
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('welcomeBack')}{userName ? `, ${userName}!` : '!'}
            </h2>
            <p className="text-gray-600">{t('createAndManage')}</p>
          </div>
          
          <QuickStats />
          <RecentWorkflows />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ConnectedApps />
            <PopularTemplates />
          </div>
        </div>
      </main>
      
      <CreateWorkflowButton />
      <LanguageModal />
      <AuthModal />
    </>
  );
}
