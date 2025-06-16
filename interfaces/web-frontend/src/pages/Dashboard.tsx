import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import QuickStats from "../components/QuickStats";
import RecentWorkflows from "../components/RecentWorkflows";
import ConnectedApps from "../components/ConnectedApps";
import PopularTemplates from "../components/PopularTemplates";
import CreateWorkflowButton from "../components/CreateWorkflowButton";
import LanguageModal from "../components/LanguageModal";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useMobile } from "../hooks/use-mobile";

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
        
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('welcome')}, {userName}!</h1>
              <p className="mt-1 text-sm text-gray-500">{t('dashboardSubtitle')}</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <CreateWorkflowButton />
            </div>
          </div>

          <QuickStats />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentWorkflows />
            <ConnectedApps />
          </div>

          <PopularTemplates />
        </div>
      </main>

      <LanguageModal />
    </>
  );
}