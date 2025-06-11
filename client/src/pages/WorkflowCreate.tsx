import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import { useLanguage } from "@/context/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Template } from "@shared/schema";
import { 
  Play, 
  Plus, 
  ArrowRight, 
  Zap, 
  Settings,
  Mail,
  Calendar,
  Video,
  MessageSquare,
  Share
} from "lucide-react";

const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  templateId: z.string().optional(),
});

type WorkflowFormData = z.infer<typeof workflowSchema>;

export default function WorkflowCreate() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const isMobile = useMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [creationStep, setCreationStep] = useState<'template' | 'details' | 'configure'>('template');

  const { data: templates, isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    refetchInterval: false
  });

  const form = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: "",
      description: "",
      templateId: undefined,
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: WorkflowFormData) => {
      return apiRequest('/api/workflows', 'POST', {
        name: data.name,
        description: data.description || "",
        templateId: data.templateId ? parseInt(data.templateId) : undefined,
        status: 'draft',
        trigger: 'manual',
        actions: [],
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workflow created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      setLocation('/workflows');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create workflow",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WorkflowFormData) => {
    createWorkflowMutation.mutate(data);
  };

  const getTemplateIcon = (iconType: string) => {
    switch (iconType) {
      case 'share': return <Share className="h-5 w-5" />;
      case 'mail': return <Mail className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'message': return <MessageSquare className="h-5 w-5" />;
      default: return <Share className="h-5 w-5" />;
    }
  };

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

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    form.setValue('templateId', template.id.toString());
    form.setValue('name', template.name);
    form.setValue('description', template.description);
    setCreationStep('details');
  };

  const handleFromScratch = () => {
    setSelectedTemplate(null);
    form.setValue('templateId', undefined);
    form.setValue('name', "");
    form.setValue('description', "");
    setCreationStep('details');
  };

  // Get template ID from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    if (templateId && templates) {
      const template = templates.find(t => t.id.toString() === templateId);
      if (template) {
        handleTemplateSelect(template);
      }
    }
  }, [templates]);

  return (
    <>
      <Sidebar isMobile={isMobile && mobileMenuOpen} />
      
      <main className="flex-grow">
        <TopNavbar 
          openMobileMenu={() => setMobileMenuOpen(true)} 
          title="Create Workflow"
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center ${creationStep === 'template' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${creationStep === 'template' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                    1
                  </div>
                  <span className="ml-2 font-medium">Choose Template</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <div className={`flex items-center ${creationStep === 'details' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${creationStep === 'details' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                    2
                  </div>
                  <span className="ml-2 font-medium">Workflow Details</span>
                </div>
              </div>
            </div>

            {/* Template Selection Step */}
            {creationStep === 'template' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose how to create your workflow</h2>
                  <p className="text-gray-600">Start with a template or build from scratch</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* From Scratch Option */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300" onClick={handleFromScratch}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Plus className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Start from scratch</h3>
                          <p className="text-sm text-gray-500">Build a custom workflow from the ground up</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Templates */}
                  {templatesLoading ? (
                    <div className="text-center py-8">Loading templates...</div>
                  ) : templates && templates.length > 0 ? (
                    templates.map((template) => {
                      const colorClasses = getIconColorClasses(template.iconColor);
                      return (
                        <Card 
                          key={template.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <div className={`h-12 w-12 rounded-lg ${colorClasses.bg} ${colorClasses.text} flex items-center justify-center flex-shrink-0`}>
                                {getTemplateIcon(template.iconType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                                <div className="flex items-center text-xs text-gray-400">
                                  <span>{template.usersCount} users</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      No templates available
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Workflow Details Step */}
            {creationStep === 'details' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Details</h2>
                    <p className="text-gray-600">Configure your workflow settings</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setCreationStep('template')}
                  >
                    Back
                  </Button>
                </div>

                {selectedTemplate && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-lg ${getIconColorClasses(selectedTemplate.iconColor).bg} ${getIconColorClasses(selectedTemplate.iconColor).text} flex items-center justify-center`}>
                          {getTemplateIcon(selectedTemplate.iconType)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Using template: {selectedTemplate.name}</h4>
                          <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-6">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div>
                        <Label htmlFor="name">Workflow Name *</Label>
                        <Input
                          id="name"
                          {...form.register('name')}
                          placeholder="Enter workflow name"
                          className="mt-1"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          {...form.register('description')}
                          placeholder="Describe what this workflow does"
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button type="button" variant="outline" onClick={() => setLocation('/workflows')}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createWorkflowMutation.isPending}
                          className="flex items-center space-x-2"
                        >
                          {createWorkflowMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Creating...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              <span>Create Workflow</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}