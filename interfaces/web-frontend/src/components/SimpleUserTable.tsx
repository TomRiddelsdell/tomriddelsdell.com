import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Users, 
  Shield, 
  User, 
  Clock, 
  Mail,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  display_name: string;
  role: string;
  provider: string;
  is_active: boolean;
  login_count: number;
  last_login: string | null;
  created_at: string;
}

export function SimpleUserTable() {
  const { data: users, isLoading, error, refetch } = useQuery<UserData[]>({
    queryKey: ['/api/admin/users'],
    refetchInterval: 30000,
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    return role.toLowerCase() === 'admin' ? 
      <Shield className="h-3 w-3" /> : 
      <User className="h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>Failed to load users. Please try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(user => user.is_active).length || 0;
  const adminUsers = users?.filter(user => user.role === 'admin').length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
                <div className="text-sm text-blue-600">Total Users</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
                <div className="text-sm text-green-600">Active Users</div>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{adminUsers}</div>
                <div className="text-sm text-red-600">Admin Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {users?.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{user.display_name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`flex items-center gap-1 ${getRoleBadgeColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  {user.role}
                </Badge>
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <div className="text-right text-sm">
                  <div className="font-medium">{user.login_count} logins</div>
                  <div className="text-gray-500">{formatDate(user.last_login)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {users?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}