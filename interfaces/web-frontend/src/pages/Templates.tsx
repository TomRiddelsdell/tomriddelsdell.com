import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import LanguageModal from "@/components/LanguageModal";
import { useLanguage } from "@/context/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Template } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Share, Mail, Calendar, Video, MessageSquare, User } from "lucide-react";

export default function Templates() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  const isMobile = useMobile();
  
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    refetchInterval: false
  });

  // Helper function to get icon for template
  const getTemplateIcon = (iconType: string) => {
    switch (iconType) {
      case 'share': return <Share className="text-lg" />;
      case 'mail': return <Mail className="text-lg" />;
      case 'calendar': return <Calendar className="text-lg" />;
      case 'video': return <Video className="text-lg" />;
      case 'message': return <MessageSquare className="text-lg" />;
      default: return <Share className="text-lg" />;
    }
  };

  // Helper function to get color classes for template icon
  const getIconColorClasses = (iconColor: string) => {
    const colorMap: Record<string, { bg: string, text: string }> = {
      'indigo': { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      'green': { bg: 'bg-green-100', text: 'text-green-600' },
      'amber': { bg: 'bg-amber-100', text: 'text-amber-600' },
      'rose': { bg: 'bg-rose-100', text: 'text-rose-600' },
      'sky': { bg: 'bg-sky-100', text: 'text-sky-600' },
      'default': { bg: 'bg-blue-100', text: 'text-blue-600' }
    };
    
    return colorMap[iconColor] || colorMap.default;
  };

  const filteredTemplates = templates?.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Sidebar isMobile={isMobile && mobileMenuOpen} />
      
      <main className="flex-grow">
        <TopNavbar 
          openMobileMenu={() => setMobileMenuOpen(true)} 
          title={t('templates')}
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>{t('templates')}</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search templates..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredTemplates && filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => {
                    const colorClasses = getIconColorClasses(template.iconColor);
                    return (
                      <Card key={template.id} className="overflow-hidden">
                        <div className={`h-2 ${colorClasses.bg.replace('bg', 'bg')}`}></div>
                        <CardContent className="p-4">
                          <div className="flex items-start mb-4">
                            <div className={`h-10 w-10 rounded-md ${colorClasses.bg} flex items-center justify-center ${colorClasses.text} mr-3 flex-shrink-0`}>
                              {getTemplateIcon(template.iconType)}
                            </div>
                            <div>
                              <h3 className="text-base font-medium text-gray-900">{template.name}</h3>
                              <p className="text-sm text-gray-500">{template.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-400 mb-4">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              <span>{template.usersCount} {t('users')}</span>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full"
                            onClick={() => window.location.href = `/workflows/new?template=${template.id}`}
                          >
                            Use Template
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No matching templates found' : t('noTemplatesFound')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <LanguageModal />
    </>
  );
}
