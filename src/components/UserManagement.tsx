import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, UserCheck, UserX, Edit, Trash2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface UserManagementProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'male-warden' | 'female-warden';
  status: 'active' | 'inactive' | 'suspended';
  last_login: string | null;
  assigned_hostel?: string | null;
}

export function UserManagement({ isOpen, onOpenChange }: UserManagementProps) {
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Validation schema
  const userSchema = z.object({
    full_name: z.string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
    email: z.string()
      .trim()
      .email("Invalid email address")
      .max(255, "Email must be less than 255 characters"),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and a number"),
    role: z.enum(['admin', 'male-warden', 'female-warden'], {
      errorMap: () => ({ message: "Invalid role selected" })
    }),
    assigned_hostel: z.string().max(100).optional().or(z.literal(''))
  });

  const [newUser, setNewUser] = useState<{
    full_name: string;
    email: string;
    password: string;
    role: 'admin' | 'male-warden' | 'female-warden';
    assigned_hostel: string;
  }>({
    full_name: "",
    email: "",
    password: "",
    role: "male-warden",
    assigned_hostel: ""
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Load users from database
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers((data || []).map(user => ({
        ...user,
        role: user.role as 'admin' | 'male-warden' | 'female-warden',
        status: user.status as 'active' | 'inactive' | 'suspended'
      })));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    // Validate input
    const validationResult = userSchema.safeParse(newUser);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    try {
      const validatedData = validationResult.data;
      
      // First create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          full_name: validatedData.full_name,
          email: validatedData.email,
          role: validatedData.role,
          assigned_hostel: validatedData.assigned_hostel || null
        }]);

      if (profileError) throw profileError;

      // Then create auth user via edge function
      const { error: authError } = await supabase.functions.invoke('create-user', {
        body: {
          email: validatedData.email,
          password: validatedData.password,
          full_name: validatedData.full_name,
          role: validatedData.role,
          assigned_hostel: validatedData.assigned_hostel
        }
      });

      if (authError) throw authError;

      setNewUser({ full_name: "", email: "", password: "", role: "male-warden", assigned_hostel: "" });
      loadUsers();
      
      toast({
        title: "User Added",
        description: `${newUser.full_name} has been added successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add user. Email might already exist.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      loadUsers();
      toast({
        title: "User Deleted",
        description: "User has been removed from the system.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      loadUsers();
      toast({
        title: "Status Updated",
        description: "User status has been changed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          role: editingUser.role,
          assigned_hostel: editingUser.assigned_hostel || null
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Convert role format for user_roles table (hyphens to underscores)
      const roleForEnum = editingUser.role.replace('-', '_') as 'admin' | 'male_warden' | 'female_warden';
      
      // Update user role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: roleForEnum })
        .eq('user_id', editingUser.id);

      if (roleError) throw roleError;

      setEditingUser(null);
      loadUsers();
      
      toast({
        title: "User Updated",
        description: "User role has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-muted text-muted-foreground';
      case 'suspended': return 'bg-destructive text-destructive-foreground';
    }
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-admin text-white';
      case 'male-warden': return 'bg-primary text-primary-foreground';
      case 'female-warden': return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center p-8">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </DialogTitle>
          <DialogDescription>
            Manage system users, roles, and permissions
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="add-user">Add New User</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>System Users</CardTitle>
                <CardDescription>Manage existing users and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Hostel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.assigned_hostel || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              {user.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-user">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add New User
                </CardTitle>
                <CardDescription>Create a new user account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Full Name</Label>
                    <Input
                      id="userName"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Email Address</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userPassword">Password</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userRole">Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: 'admin' | 'male-warden' | 'female-warden') => 
                        setNewUser(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="male-warden">Male Warden</SelectItem>
                        <SelectItem value="female-warden">Female Warden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userHostel">Assigned Hostel (Optional)</Label>
                    <Input
                      id="userHostel"
                      value={newUser.assigned_hostel}
                      onChange={(e) => setNewUser(prev => ({ ...prev, assigned_hostel: e.target.value }))}
                      placeholder="e.g., Block A, Block B"
                    />
                  </div>
                </div>

                <Button onClick={handleAddUser} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        {/* Edit User Dialog */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user role and assigned hostel</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={editingUser.full_name} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editingUser.email} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editRole">Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value: 'admin' | 'male-warden' | 'female-warden') => 
                      setEditingUser({ ...editingUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="male-warden">Male Warden</SelectItem>
                      <SelectItem value="female-warden">Female Warden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editHostel">Assigned Hostel</Label>
                  <Input
                    id="editHostel"
                    value={editingUser.assigned_hostel || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, assigned_hostel: e.target.value })}
                    placeholder="e.g., Block A, Block B"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateUser}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}