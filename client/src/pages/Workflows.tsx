import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import CreateWorkflowButton from "@/components/CreateWorkflowButton";
import LanguageModal from "@/components/LanguageModal";
import { useLanguage } from "@/context/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Workflow } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Copy, Trash, PlayCircle, PauseCircle } from "lucide-react";

export default function Workflows() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const isMobile = useMobile();
  
  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows'],
    refetchInterval: false
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">{t('active')}</Badge>;
      case 'paused':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t('paused')}</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">{t('error')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Sidebar isMobile={isMobile && mobileMenuOpen} />
      
      <main className="flex-grow">
        <TopNavbar 
          openMobileMenu={() => setMobileMenuOpen(true)} 
          title={t('myWorkflows')}
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle>{t('myWorkflows')}</CardTitle>
                <Link href="/workflows/new">
                  <Button>{t('createWorkflow')}</Button>
                </Link>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="paused">Paused</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  {isLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : workflows && workflows.length > 0 ? (
                    <div className="grid gap-4">
                      {workflows.map((workflow) => (
                        <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className={`h-10 w-10 rounded-md bg-${workflow.iconColor || 'blue'}-100 flex items-center justify-center text-${workflow.iconColor || 'primary'} mr-3`}>
                                <span className="text-lg">{workflow.icon}</span>
                              </div>
                              <div>
                                <h3 className="font-medium">{workflow.name}</h3>
                                <p className="text-sm text-gray-500">{workflow.createdAt}</p>
                                <div className="mt-1">{getStatusBadge(workflow.status)}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {workflow.status === 'active' ? (
                                <Button variant="ghost" size="icon">
                                  <PauseCircle className="h-5 w-5" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon">
                                  <PlayCircle className="h-5 w-5" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon">
                                <Edit className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Copy className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 text-sm">
                            <span className="text-gray-500">Last run:</span> {workflow.lastRun}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {t('noWorkflowsFound')}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="active">
                  {isLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : workflows?.filter(w => w.status.toLowerCase() === 'active').length ? (
                    <div className="grid gap-4">
                      {workflows.filter(w => w.status.toLowerCase() === 'active').map((workflow) => (
                        <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className={`h-10 w-10 rounded-md bg-${workflow.iconColor || 'blue'}-100 flex items-center justify-center text-${workflow.iconColor || 'primary'} mr-3`}>
                                <span className="text-lg">{workflow.icon}</span>
                              </div>
                              <div>
                                <h3 className="font-medium">{workflow.name}</h3>
                                <p className="text-sm text-gray-500">{workflow.createdAt}</p>
                                <div className="mt-1">{getStatusBadge(workflow.status)}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <PauseCircle className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Copy className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 text-sm">
                            <span className="text-gray-500">Last run:</span> {workflow.lastRun}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No active workflows found
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="paused">
                  {isLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : workflows?.filter(w => w.status.toLowerCase() === 'paused').length ? (
                    <div className="grid gap-4">
                      {workflows.filter(w => w.status.toLowerCase() === 'paused').map((workflow) => (
                        <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className={`h-10 w-10 rounded-md bg-${workflow.iconColor || 'blue'}-100 flex items-center justify-center text-${workflow.iconColor || 'primary'} mr-3`}>
                                <span className="text-lg">{workflow.icon}</span>
                              </div>
                              <div>
                                <h3 className="font-medium">{workflow.name}</h3>
                                <p className="text-sm text-gray-500">{workflow.createdAt}</p>
                                <div className="mt-1">{getStatusBadge(workflow.status)}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <PlayCircle className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Copy className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 text-sm">
                            <span className="text-gray-500">Last run:</span> {workflow.lastRun}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No paused workflows found
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <CreateWorkflowButton />
      <LanguageModal />
    </>
  );
}
