import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "wouter";

export default function CreateWorkflowButton() {
  
  return (
    <div className="fixed bottom-6 right-6 z-20">
      <Link href="/workflows/new">
        <Button 
          className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
          size="icon" 
          aria-label="Create Workflow"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
