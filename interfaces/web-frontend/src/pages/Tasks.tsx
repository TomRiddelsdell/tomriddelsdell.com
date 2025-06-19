import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useMobile } from "../hooks/use-mobile";
import { CheckCircleIcon, ClockIcon, AlertTriangleIcon, PlusIcon, CalendarIcon } from "lucide-react";
import backgroundImage from "../assets/background.jpg";

export default function Tasks() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useMobile();

  const tasks = [
    {
      id: 1,
      title: "Review data migration workflow",
      priority: "high",
      status: "pending",
      dueDate: "2025-06-14",
      assignee: "Tom Riddelsdell"
    },
    {
      id: 2,
      title: "Configure API rate limiting",
      priority: "medium",
      status: "in-progress",
      dueDate: "2025-06-16",
      assignee: "Tom Riddelsdell"
    },
    {
      id: 3,
      title: "Update integration documentation",
      priority: "low",
      status: "completed",
      dueDate: "2025-06-12",
      assignee: "Tom Riddelsdell"
    },
    {
      id: 4,
      title: "Test new authentication flow",
      priority: "high",
      status: "pending",
      dueDate: "2025-06-15",
      assignee: "Tom Riddelsdell"
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isMobile={isMobile && mobileMenuOpen} />
      
      <main className="flex-grow">
        <TopNavbar 
          openMobileMenu={() => setMobileMenuOpen(true)} 
          title="Tasks"
        />
        
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                <p className="text-gray-600 mt-2">Manage your workflow tasks and assignments</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Add Task
              </button>
            </div>

        <div className="mb-6 flex space-x-4">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            All Tasks
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Pending
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            In Progress
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Completed
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Task List</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        readOnly
                      />
                      <h3 className={`text-lg font-medium ${
                        task.status === "completed" ? "line-through text-gray-500" : "text-gray-900"
                      }`}>
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {task.status.replace("-", " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      <span>Assigned to: {task.assignee}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Tasks</h3>
            <div className="text-3xl font-bold text-red-600">
              {tasks.filter(t => t.status === "pending").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">In Progress</h3>
            <div className="text-3xl font-bold text-blue-600">
              {tasks.filter(t => t.status === "in-progress").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
            <div className="text-3xl font-bold text-green-600">
              {tasks.filter(t => t.status === "completed").length}
            </div>
          </div>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}