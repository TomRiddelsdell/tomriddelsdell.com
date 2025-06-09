import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  ChartGantt, 
  AppWindow, 
  FileSymlink, 
  History, 
  UserCog, 
  ShieldCheck, 
  Globe, 
  LogOut, 
  ChevronDown, 
  Menu 
} from "lucide-react";

interface SidebarProps {
  isMobile?: boolean;
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { currentLanguage, t } = useLanguage();

  // Close mobile menu when location changes
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [location, isMobile]);

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { 
      title: t("mainMenu"), 
      items: [
        { name: t("dashboard"), path: "/", icon: <LayoutDashboard className="mr-3 text-lg" /> },
        { name: t("myWorkflows"), path: "/workflows", icon: <ChartGantt className="mr-3 text-lg" /> },
        { name: t("appConnections"), path: "/app-connections", icon: <AppWindow className="mr-3 text-lg" /> },
        { name: t("templates"), path: "/templates", icon: <FileSymlink className="mr-3 text-lg" /> },
        { name: t("activityLog"), path: "/activity-log", icon: <History className="mr-3 text-lg" /> }
      ]
    },
    { 
      title: t("settings"), 
      items: [
        { name: t("account"), path: "/account", icon: <UserCog className="mr-3 text-lg" /> },
        { name: t("security"), path: "/security", icon: <ShieldCheck className="mr-3 text-lg" /> }
      ]
    }
  ];

  return (
    <aside className="bg-white border-r border-gray-200 w-full md:w-64 md:min-h-screen flex-shrink-0 shadow-sm">
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <ChartGantt className="text-white text-xl" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">FlowCreate</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-gray-500 hover:text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="text-2xl" />
        </Button>
      </div>
      
      <div className={`p-4 ${isMobile && !mobileMenuOpen ? 'hidden' : ''} md:block`}>
        {navItems.map((section, idx) => (
          <div key={idx} className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h2>
            </div>
            <nav>
              <ul className="space-y-1">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    <Link href={item.path}>
                      <a 
                        className={`flex items-center px-3 py-2 text-sm rounded-md ${
                          isActive(item.path) 
                            ? 'bg-blue-50 text-primary font-medium' 
                            : 'text-gray-700 hover:bg-gray-100 font-medium'
                        }`}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </a>
                    </Link>
                  </li>
                ))}
                
                {section.title === t("settings") && (
                  <li>
                    <Link href="#">
                      <a 
                        className="flex items-center justify-between px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 font-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          document.dispatchEvent(new CustomEvent('toggle-language-modal'));
                        }}
                      >
                        <div className="flex items-center">
                          <Globe className="mr-3 text-lg" />
                          <span>{t("language")}</span>
                        </div>
                        <div className="inline-flex items-center text-xs text-gray-500">
                          <span className="mr-1">{currentLanguage}</span>
                          <ChevronDown size={16} />
                        </div>
                      </a>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        ))}
        
        {user ? (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center px-3 py-2 rounded-md bg-gray-100">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.displayName || user.email || t("user")}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email || ""}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2 text-gray-500 hover:text-gray-700" 
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Sign out button clicked');
                  try {
                    await signOut();
                    console.log('Sign out completed');
                  } catch (error) {
                    console.error('Sign out error:', error);
                  }
                }}
                title="Sign out"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-gray-200">
            <Button 
              className="w-full" 
              onClick={() => document.dispatchEvent(new CustomEvent('toggle-auth-modal'))}
            >
              {t("signIn")}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
