import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ForgotPasswordModal from "./ForgotPasswordModal";

type AuthMode = 'signin' | 'signup';

interface AuthFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthModalProps {
  defaultOpen?: boolean;
}

export default function AuthModal({ defaultOpen = false }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle, signInWithAWS } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const authSchema = z.object({
    email: z.string().email(t('invalidEmail') || "Invalid email"),
    password: z.string().min(6, t('passwordTooShort') || "Password too short"),
    rememberMe: z.boolean().optional(),
  });

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    form.reset();
  };

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (mode === 'signin') {
        await signIn(data.email, data.password, data.rememberMe);
        // Signal to parent component that auth was successful
        const event = new CustomEvent('authSuccess');
        window.dispatchEvent(event);
      } else {
        await signUp(data.email, data.password);
        // Signal to parent component that auth was successful
        const event = new CustomEvent('authSuccess');
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Signal to parent component that auth was successful
      const event = new CustomEvent('authSuccess');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };
  
  const handleAWSSignIn = async () => {
    try {
      await signInWithAWS();
      // Signal to parent component that auth was successful
      const event = new CustomEvent('authSuccess');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('AWS sign in error:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center"
          onClick={handleGoogleSignIn}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="mr-2 text-red-500">
            <path fill="currentColor" d="M12 22q-2.05 0-3.875-.788t-3.188-2.15-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175 3.188-2.137T12 2q2.075 0 3.9.788t3.175 2.137 2.138 3.175T22 12q0 2.05-.788 3.888t-2.137 3.175-3.175 2.138T12 22Zm0-2q3.35 0 5.675-2.325T20 12q0-3.35-2.325-5.675T12 4Q8.65 4 6.325 6.325T4 12q0 3.35 2.325 5.675T12 20Zm-4.85-3.15 2.1-3.675-2.1-3.675h8.7v7.35h-8.7Z" />
          </svg>
          {t('continueWithGoogle') || "Continue with Google"}
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center"
          onClick={handleAWSSignIn}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="mr-2 text-orange-500">
            <path fill="currentColor" d="M15.781 11.96c-.36.625-1.125 1.094-2.156 1.094c-1.219 0-2.39-.625-2.39-1.875c0-1.282 1.171-1.829 2.39-1.829l2.156.047V11.96zm-2.156-5.485c2.344 0 4.125 1.25 4.125 3.125v5.64c0 .485.267.578.547.578c.11 0 .203-.15.281-.078a.33.33 0 0 0 .14-.297V8.047A.734.734 0 0 0 18 7.25h-.812a.73.73 0 0 0-.72.797l-.03.704c-.594-.985-1.688-1.563-3.094-1.563c-1.953 0-3.516 1.11-3.516 3.031c0 1.813 1.563 2.845 3.516 2.845c1.406 0 2.5-.625 3.093-1.547v.485c0 1.296-1.078 2.03-2.812 2.03c-.97 0-1.688-.312-2.344-.703a.758.758 0 0 0-.36-.093a.73.73 0 0 0-.735.734c0 .25.126.469.313.61c.813.547 1.922.906 3.125.906c2.344 0 4.594-1.203 4.594-3.516V9.614c0-1.875-1.781-3.14-4.125-3.14zM8.719 7.25a.73.73 0 0 0-.719.797v9.156c0 .438.36.797.813.797h.812a.725.725 0 0 0 .72-.797V8.047a.728.728 0 0 0-.72-.797zm0-4.125a1.25 1.25 0 0 0-1.25 1.25c0 .688.562 1.25 1.25 1.25c.693 0 1.25-.563 1.25-1.25c0-.688-.562-1.25-1.25-1.25z"></path>
          </svg>
          {t('continueWithAWS') || "Continue with AWS"}
        </Button>
      </div>
      
      <div className="my-4 flex items-center justify-between">
        <Separator className="flex-grow" />
        <span className="px-3 text-sm text-gray-500">{t('or') || "or"}</span>
        <Separator className="flex-grow" />
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('emailAddress') || "Email Address"}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('password') || "Password"}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {mode === 'signin' && (
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                      {t('rememberMe') || "Remember me"}
                    </Label>
                  </FormItem>
                )}
              />
              
              <Button 
                variant="link" 
                size="sm" 
                className="text-sm p-0 h-auto"
                onClick={(e) => {
                  e.preventDefault();
                  setForgotPasswordOpen(true);
                }}
              >
                {t('forgotPassword') || "Forgot password?"}
              </Button>
            </div>
          )}
          
          <Button type="submit" className="w-full">
            {mode === 'signin' ? (t('signIn') || "Sign In") : (t('signUp') || "Sign Up")}
          </Button>
        </form>
      </Form>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        {mode === 'signin' 
          ? (t('dontHaveAccount') || "Don't have an account?")
          : (t('alreadyHaveAccount') || "Already have an account?")} 
        <Button 
          variant="link" 
          className="font-medium p-0 h-auto"
          onClick={toggleMode}
        >
          {mode === 'signin' ? (t('signUp') || "Sign Up") : (t('signIn') || "Sign In")}
        </Button>
      </div>
      
      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        open={forgotPasswordOpen} 
        onOpenChange={setForgotPasswordOpen}
        onBack={() => setForgotPasswordOpen(false)}
      />
    </div>
  );
}
