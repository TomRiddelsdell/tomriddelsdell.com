import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";

import { Template } from "../../../domains/shared-kernel/src/schema";
import { Share, Mail, Calendar, Video, MessageSquare, Play } from "lucide-react";
import { Link } from "wouter";

export default function PopularTemplates() {
  
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates/popular'],
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

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Popular Templates</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            // Skeleton loading state
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-start">
                  <Skeleton className="h-10 w-10 rounded-md mr-3 flex-shrink-0" />
                  <div className="w-full">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </div>
            ))
          ) : templates && templates.length > 0 ? (
            // Template list
            templates.map((template) => {
              const colorClasses = getIconColorClasses(template.iconColor);
              return (
                <div key={template.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className={`h-10 w-10 rounded-md ${colorClasses.bg} flex items-center justify-center ${colorClasses.text} mr-3 flex-shrink-0`}>
                      {getTemplateIcon(template.iconType)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-400">
                          <span className="mr-1 inline-flex items-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {template.usersCount} users
                          </span>
                        </div>
                        <Link href={`/workflows/new?template=${template.id}`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs h-7 px-2"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Use Template
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              No templates found
            </div>
          )}
          
          <div className="p-4">
            <Button 
              variant="link" 
              className="block w-full text-center text-sm font-medium text-primary hover:text-blue-700"
              onClick={() => {
                window.location.href = "/templates";
              }}
            >
              View All Templates
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
