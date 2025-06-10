import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { ConnectedApp } from "@shared/schema";

export default function ConnectedApps() {
  const { t } = useLanguage();
  
  const { data: apps, isLoading } = useQuery<ConnectedApp[]>({
    queryKey: ['/api/connected-apps'],
    refetchInterval: false
  });

  const handleConnectApp = () => {
    // Implementation to connect a new app
    window.location.href = "/app-connections";
  };

  const handleManageApp = (appId: number) => {
    // Implementation to manage app settings
    window.location.href = `/app-connections/${appId}`;
  };

  // Determines the appropriate icon color classes
  const getIconColorClasses = (appName: string) => {
    const appColors: Record<string, { bg: string, text: string }> = {
      "Facebook": { bg: "bg-blue-100", text: "text-blue-600" },
      "Instagram": { bg: "bg-indigo-100", text: "text-indigo-600" },
      "Twitter": { bg: "bg-sky-100", text: "text-sky-600" },
      "YouTube": { bg: "bg-red-100", text: "text-red-600" },
      "Spotify": { bg: "bg-green-100", text: "text-green-600" },
      "Gmail": { bg: "bg-rose-100", text: "text-rose-600" },
      "Sheets": { bg: "bg-emerald-100", text: "text-emerald-600" },
      "Dropbox": { bg: "bg-yellow-100", text: "text-yellow-600" },
      "default": { bg: "bg-purple-100", text: "text-purple-600" }
    };
    
    return appColors[appName] || appColors.default;
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">{t('connectedApps')}</CardTitle>
          <Button 
            size="sm" 
            onClick={handleConnectApp}
            className="inline-flex items-center"
          >
            <Plus className="mr-1 h-4 w-4" /> {t('connectApp')}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {isLoading ? (
            // Skeleton loading state
            Array(9).fill(0).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center animate-pulse">
                <Skeleton className="h-12 w-12 rounded-lg mb-3" />
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-12 mb-2" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))
          ) : apps && apps.length > 0 ? (
            // Connected apps
            apps.map((app) => {
              const colorClasses = getIconColorClasses(app.name);
              return (
                <div key={app.id} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                  <div className={`h-12 w-12 rounded-lg ${colorClasses.bg} flex items-center justify-center ${colorClasses.text} mb-3`}>
                    <span className="text-xl">{app.icon}</span>
                  </div>
                  <h3 className="text-gray-800 font-medium mb-1">{app.name}</h3>
                  <p className="text-xs text-green-600 mb-2">{app.status === 'connected' ? t('connected') : t('disconnected')}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => handleManageApp(app.id)}
                  >
                    {t('manage')}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-500">{t('noConnectedApps')}</p>
            </div>
          )}
          
          {/* Add More button always shown as the last item */}
          <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-3">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-gray-800 font-medium mb-1">{t('addMore')}</h3>
            <p className="text-xs text-gray-500 mb-2">{t('connectNewApp')}</p>
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs text-primary hover:text-blue-700"
              onClick={handleConnectApp}
            >
              {t('browse')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
