import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import LanguageModal from "@/components/LanguageModal";
import { useLanguage } from "@/context/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, AtSign, Calendar, Upload } from "lucide-react";

// Form schemas
const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Account() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const isMobile = useMobile();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
    },
  });

  // Update profile
  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // In a real app, we would call an API to update the profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        // In a real app, we would call an API to delete the account
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        toast({
          title: "Account deleted",
          description: "Your account has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Failed to delete your account. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      <Sidebar isMobile={isMobile && mobileMenuOpen} />
      
      <main className="flex-grow">
        <TopNavbar 
          openMobileMenu={() => setMobileMenuOpen(true)} 
          title={t('account')}
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <Tabs defaultValue="profile">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your account profile information and email address
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex flex-col items-center md:w-1/3">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
                          <AvatarFallback className="text-2xl">
                            {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <Button variant="outline" className="mb-2 w-full">
                          <Upload className="mr-2 h-4 w-4" /> Change Avatar
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          PNG, JPG or GIF, max 2MB
                        </p>
                      </div>
                      
                      <div className="md:w-2/3">
                        <Form {...profileForm}>
                          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <FormField
                              control={profileForm.control}
                              name="displayName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Display Name</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                      <Input className="pl-10" placeholder="Your name" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                      <Input 
                                        className="pl-10" 
                                        placeholder="Your email" 
                                        {...field} 
                                        disabled={true} // Email is typically not editable after signup
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="pt-2">
                              <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Account Management</CardTitle>
                    <CardDescription>
                      Manage your account settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-1">Account Created</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>October 12, 2023</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-1">Data Export</h3>
                        <p className="text-sm text-gray-500 mb-2">
                          Download a copy of your data including workflows, connected apps, and settings
                        </p>
                        <Button variant="outline">
                          Export Data
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-gray-200 mt-4 flex flex-col items-start">
                    <h3 className="text-sm font-medium text-red-600 mb-1">Danger Zone</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      Delete Account
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Manage your application preferences and notification settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Notification Settings</h3>
                      <Separator className="mb-4" />
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Email Notifications</h4>
                            <p className="text-sm text-gray-500">Receive notifications about your workflows via email</p>
                          </div>
                          <div>
                            <Label htmlFor="email-notifications" className="sr-only">Email Notifications</Label>
                            <input type="checkbox" id="email-notifications" className="toggle" defaultChecked />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Workflow Success Updates</h4>
                            <p className="text-sm text-gray-500">Get notified when your workflows run successfully</p>
                          </div>
                          <div>
                            <Label htmlFor="workflow-success" className="sr-only">Workflow Success</Label>
                            <input type="checkbox" id="workflow-success" className="toggle" defaultChecked />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Workflow Failure Alerts</h4>
                            <p className="text-sm text-gray-500">Get notified when your workflows encounter errors</p>
                          </div>
                          <div>
                            <Label htmlFor="workflow-failure" className="sr-only">Workflow Failure</Label>
                            <input type="checkbox" id="workflow-failure" className="toggle" defaultChecked />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Marketing Communications</h4>
                            <p className="text-sm text-gray-500">Receive updates, tips, and product news</p>
                          </div>
                          <div>
                            <Label htmlFor="marketing" className="sr-only">Marketing</Label>
                            <input type="checkbox" id="marketing" className="toggle" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Appearance</h3>
                      <Separator className="mb-4" />
                      
                      <div className="mb-4">
                        <Label htmlFor="theme" className="mb-2 block">Theme</Label>
                        <select id="theme" className="w-full p-2 border border-gray-300 rounded-md">
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="density" className="mb-2 block">Interface Density</Label>
                        <select id="density" className="w-full p-2 border border-gray-300 rounded-md">
                          <option value="comfortable">Comfortable</option>
                          <option value="compact">Compact</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-200 mt-4">
                  <Button>Save Preferences</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Subscription</CardTitle>
                  <CardDescription>
                    Manage your subscription plan and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Current Plan</h3>
                      <Separator className="mb-4" />
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-blue-700">Free Plan</h4>
                          <Badge variant="outline" className="bg-blue-100 text-blue-700">Current Plan</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Your current plan includes up to 3 active workflows and 5 connected apps.</p>
                        <Button variant="outline">Upgrade to Pro</Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">Pro Plan</h4>
                          <p className="text-sm text-gray-600 mb-2">$9.99/month</p>
                          <ul className="text-sm space-y-1 mb-4">
                            <li className="flex items-center">
                              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                              <span>Up to 20 active workflows</span>
                            </li>
                            <li className="flex items-center">
                              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                              <span>Unlimited connected apps</span>
                            </li>
                            <li className="flex items-center">
                              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                              <span>Advanced workflow features</span>
                            </li>
                            <li className="flex items-center">
                              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                              <span>Email support</span>
                            </li>
                          </ul>
                          <Button className="w-full">Choose Pro</Button>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">Enterprise Plan</h4>
                          <p className="text-sm text-gray-600 mb-2">Contact for pricing</p>
                          <ul className="text-sm space-y-1 mb-4">
                            <li className="flex items-center">
                              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                              <span>Unlimited workflows</span>
                            </li>
                            <li className="flex items-center">
                              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                              <span>Unlimited connected apps</span>
                            </li>
                            <li className="flex items-center">
                              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                              <span>Custom integrations</span>
                            </li>
                            <li className="flex items-center">
                              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                              <span>Priority support</span>
                            </li>
                          </ul>
                          <Button variant="outline" className="w-full">Contact Sales</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Payment Methods</h3>
                      <Separator className="mb-4" />
                      
                      <p className="text-sm text-gray-500 mb-4">
                        No payment methods added yet. Add a payment method to upgrade to a paid plan.
                      </p>
                      
                      <Button variant="outline">
                        <CreditCardIcon className="mr-2 h-4 w-4" />
                        Add Payment Method
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <LanguageModal />
    </>
  );
}

// Helper components
function Badge({ variant, className, children }: { variant: string, className: string, children: React.ReactNode }) {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${className}`}>
      {children}
    </span>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
