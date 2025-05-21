import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageWrapper } from "@/components/PageWrapper";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, UserCheck, Clock, PencilLine, UserX } from "lucide-react";

// Interface for user data
interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  lastLogin?: string;
  createdAt: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  // Fetch users
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['/api/admin/users'],
    retry: 1
  });

  // Update user role mutation
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest('PATCH', `/api/admin/users/${userId}`, { role });
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle role change
  const handleRoleChange = (userId: number, role: string) => {
    updateUserRole.mutate({ userId, role });
  };

  // Activity audit mutation
  const deactivateUser = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('PATCH', `/api/admin/users/${userId}`, { isActive: false });
    },
    onSuccess: () => {
      toast({
        title: "User deactivated",
        description: "User account has been deactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return <PageWrapper className="min-h-screen p-6 md:p-10">
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-md p-6">
        <h1 className="text-xl font-semibold mb-6">Loading user data...</h1>
      </div>
    </PageWrapper>;
  }

  if (isError) {
    return <PageWrapper className="min-h-screen p-6 md:p-10">
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-md p-6">
        <h1 className="text-xl font-semibold mb-6">Error loading users</h1>
        <p>There was an error loading the user management dashboard. Please try again later.</p>
      </div>
    </PageWrapper>;
  }

  return (
    <PageWrapper className="min-h-screen p-6 md:p-10">
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2 gradient-text">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and manage user access to your site
            </p>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            <Shield className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Admin Dashboard
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableCaption>List of registered users and their access rights</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.username} 
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span>{user.displayName || user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                      {formatDate(user.lastLogin)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <PencilLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to deactivate this user? 
                              They will no longer be able to log in.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deactivateUser.mutate(user.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageWrapper>
  );
}