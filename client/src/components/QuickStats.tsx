import { ChartGantt, Rocket, AppWindow, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";

export default function QuickStats() {
  const { t } = useLanguage();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: false
  });

  const defaultStats = {
    activeWorkflows: 0,
    tasksAutomated: 0,
    connectedApps: 0,
    timeSaved: '0h'
  };

  const displayStats = (stats as typeof defaultStats) || defaultStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {isLoading ? (
        // Skeleton loading state
        Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-5 animate-pulse">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-gray-200"></div>
              <div className="ml-4 w-full">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-primary">
                <ChartGantt className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">{t("activeWorkflows")}</h3>
                <p className="text-2xl font-semibold text-gray-900">{displayStats.activeWorkflows}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-secondary">
                <Rocket className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">{t("tasksAutomated")}</h3>
                <p className="text-2xl font-semibold text-gray-900">{displayStats.tasksAutomated}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-accent">
                <AppWindow className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">{t("connectedApps")}</h3>
                <p className="text-2xl font-semibold text-gray-900">{displayStats.connectedApps}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-500">
                <Clock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">{t("timeSaved")}</h3>
                <p className="text-2xl font-semibold text-gray-900">{displayStats.timeSaved}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
