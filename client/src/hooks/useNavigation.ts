import { useLanguage } from "@/context/LanguageContext";

export interface NavigationItem {
  name: string;
  path: string;
  iconName: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export function useNavigation() {
  const { t } = useLanguage();

  const navigationSections: NavigationSection[] = [
    { 
      title: "Portfolio", 
      items: [
        { name: "Home", path: "/", iconName: "LayoutDashboard" },
        { name: "Career", path: "/career", iconName: "Briefcase" },
        { name: "Projects", path: "/projects", iconName: "FolderOpen" },
        { name: "Tasks", path: "/tasks", iconName: "CheckSquare" }
      ]
    },
    { 
      title: t("mainMenu"), 
      items: [
        { name: t("dashboard"), path: "/dashboard", iconName: "LayoutDashboard" },
        { name: t("myWorkflows"), path: "/workflows", iconName: "ChartGantt" },
        { name: t("appConnections"), path: "/app-connections", iconName: "AppWindow" },
        { name: t("templates"), path: "/templates", iconName: "FileSymlink" },
        { name: t("activityLog"), path: "/activity-log", iconName: "History" }
      ]
    },
    { 
      title: t("settings"), 
      items: [
        { name: t("account"), path: "/account", iconName: "UserCog" },
        { name: t("security"), path: "/security", iconName: "ShieldCheck" }
      ]
    }
  ];

  // Get all navigation items flattened for header navigation
  const getAllNavItems = (): NavigationItem[] => {
    return navigationSections.flatMap(section => section.items);
  };

  // Get main portfolio and workflow items for header
  const getMainNavItems = (): NavigationItem[] => {
    const portfolioItems = navigationSections[0].items.filter(item => item.path !== "/");
    const workflowItems = navigationSections[1].items.slice(0, 2); // Dashboard and Workflows
    return [...portfolioItems, ...workflowItems];
  };

  return {
    navigationSections,
    getAllNavItems,
    getMainNavItems
  };
}