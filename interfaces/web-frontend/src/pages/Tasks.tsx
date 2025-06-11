import * as React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "wouter";
import { useState } from "react";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Task {
  id: string;
  description: string;
  completed: boolean;
  dueDate: string; // ISO string
  priority: 'low' | 'medium' | 'high';
}

export default function Tasks() {
  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      description: 'Review Q2 trading algorithm performance',
      completed: false,
      dueDate: '2025-05-20',
      priority: 'high'
    },
    {
      id: '2',
      description: 'Prepare presentation for Goldman Sachs leadership meeting',
      completed: false,
      dueDate: '2025-05-25',
      priority: 'medium'
    },
    {
      id: '3',
      description: 'Optimize market data processing pipeline',
      completed: false,
      dueDate: '2025-06-10',
      priority: 'medium'
    },
    {
      id: '4',
      description: 'Analyze new volatility modeling techniques',
      completed: false,
      dueDate: '2025-06-15',
      priority: 'high'
    },
    {
      id: '5',
      description: 'Schedule family weekend at Wye Valley',
      completed: true,
      dueDate: '2025-05-10',
      priority: 'high'
    }
  ]);
  const [newTask, setNewTask] = useState('');

  // If not authenticated, redirect to home
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (newTask.trim() === '') return;
    
    const task: Task = {
      id: Date.now().toString(),
      description: newTask,
      completed: false,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
      priority: 'medium'
    };
    
    setTasks([...tasks, task]);
    setNewTask('');
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center border-b">
        <Link href="/">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text cursor-pointer">
            Tom Riddelsdell
          </div>
        </Link>
        <nav className="hidden md:flex space-x-8 items-center">
          <Link href="/" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Home
          </Link>
          <Link href="/career" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Career
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/projects" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Projects
              </Link>
              <Link href="/tasks" className="text-blue-600 dark:text-blue-400 font-medium">
                Tasks
              </Link>
            </>
          )}
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          ) : (
            <Button>Sign In</Button>
          )}
        </nav>
        {/* Mobile nav toggle */}
        <Button 
          variant="ghost" 
          className="md:hidden" 
          size="icon"
          onClick={() => {}}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </header>

      <main className="flex-1">
        {/* Tasks Header */}
        <section className="py-12 md:py-16 px-6 md:px-12 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Personal Task Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Manage your work and personal tasks. This page is only visible to you when logged in.
            </p>
            
            <div className="flex gap-4 mb-6">
              <Input 
                type="text" 
                placeholder="Add a new task..." 
                value={newTask} 
                onChange={(e) => setNewTask(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTask();
                  }
                }}
              />
              <Button onClick={addTask}>Add Task</Button>
            </div>
          </div>
        </section>

        {/* Tasks Table */}
        <section className="py-12 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
              <Table>
                <TableCaption>Your personal tasks list</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow 
                      key={task.id} 
                      className={task.completed ? "opacity-60" : ""}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={task.completed} 
                          onCheckedChange={() => toggleTaskCompletion(task.id)}
                        />
                      </TableCell>
                      <TableCell className={task.completed ? "line-through" : ""}>
                        {task.description}
                      </TableCell>
                      <TableCell>{formatDate(task.dueDate)}</TableCell>
                      <TableCell>
                        <span className={getPriorityColor(task.priority)}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                          className="h-8 w-8 text-gray-500 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 md:px-12 border-t bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text mb-4 md:mb-0">
            Tom Riddelsdell
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Tom Riddelsdell. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}