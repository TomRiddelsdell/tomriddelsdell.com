import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import LanguageModal from "@/components/LanguageModal";
import { useLanguage } from "@/context/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ConnectedApp } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

export default function AppConnections() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  const isMobile = useMobile();
  
  const { data: connectedApps, isLoading } = useQuery<ConnectedApp[]>({
    queryKey: ['/api/connected-apps'],
    refetchInterval: false
  });

  const { data: availableApps, isLoading: isLoadingAvailable } = useQuery<ConnectedApp[]>({
    queryKey: ['/api/available-apps'],
    refetchInterval: false
  });
  
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

  const handleConnectApp = (appName: string) => {
    // Implementation to connect a new app
    window.location.href = `/app-connections/connect/${appName.toLowerCase()}`;
  };

  const handleDisconnectApp = (appId: number) => {
    // Implementation to disconnect an app
    console.log(`Disconnect app ${appId}`);
  };

  const filteredConnectedApps = connectedApps?.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailableApps = availableApps?.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Sidebar isMobile={isMobile && mobileMenuOpen} />
      
      <main className="flex-grow">
        <TopNavbar 
          openMobileMenu={() => setMobileMenuOpen(true)} 
          title={t('appConnections')}
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>{t('appConnections')}</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search apps..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <Tabs defaultValue="connected">
                <TabsList className="mb-4">
                  <TabsTrigger value="connected">Connected</TabsTrigger>
                  <TabsTrigger value="available">Available Apps</TabsTrigger>
                </TabsList>
                
                <TabsContent value="connected">
                  {isLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : filteredConnectedApps && filteredConnectedApps.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredConnectedApps.map((app) => {
                        const colorClasses = getIconColorClasses(app.name);
                        return (
                          <div key={app.id} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                            <div className={`h-12 w-12 rounded-lg ${colorClasses.bg} flex items-center justify-center ${colorClasses.text} mb-3`}>
                              <span className="text-xl">{app.icon}</span>
                            </div>
                            <h3 className="text-gray-800 font-medium mb-1">{app.name}</h3>
                            <p className="text-xs text-green-600 mb-2">{t('connected')}</p>
                            <div className="flex gap-2 mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => window.location.href = `/app-connections/${app.id}`}
                              >
                                {t('manage')}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-gray-500 hover:text-gray-700"
                                onClick={() => handleDisconnectApp(app.id)}
                              >
                                Disconnect
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery ? 'No matching apps found' : t('noConnectedApps')}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="available">
                  {isLoadingAvailable ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : filteredAvailableApps && filteredAvailableApps.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredAvailableApps.map((app) => {
                        const colorClasses = getIconColorClasses(app.name);
                        const isConnected = connectedApps?.some(connectedApp => connectedApp.name === app.name);
                        
                        return (
                          <div key={app.id} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                            <div className={`h-12 w-12 rounded-lg ${colorClasses.bg} flex items-center justify-center ${colorClasses.text} mb-3`}>
                              <span className="text-xl">{app.icon}</span>
                            </div>
                            <h3 className="text-gray-800 font-medium mb-1">{app.name}</h3>
                            <p className="text-xs text-gray-500 mb-2">{app.description}</p>
                            <Button 
                              variant={isConnected ? "outline" : "default"}
                              size="sm" 
                              className="mt-2"
                              onClick={() => handleConnectApp(app.name)}
                              disabled={isConnected}
                            >
                              {isConnected ? t('connected') : (
                                <>
                                  <Plus className="mr-1 h-3 w-3" /> Connect
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery ? 'No matching apps found' : 'No available apps found'}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <LanguageModal />
    </>
  );
}
