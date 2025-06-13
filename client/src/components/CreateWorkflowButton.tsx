import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguage } from "@/context/LanguageContext";

export default function CreateWorkflowButton() {
  const { t } = useLanguage();
  
  return (
    <div className="fixed bottom-6 right-6 z-20">
      <Link href="/workflows/new">
        <Button 
          className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
          size="icon" 
          aria-label={t('createWorkflow')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
