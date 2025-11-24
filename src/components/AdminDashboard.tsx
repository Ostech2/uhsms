import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Shield, 
  Users, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Settings,
  FileText,
  UserCheck,
  Activity
} from "lucide-react";
import { SystemSettings } from "@/components/SystemSettings";
import { UserManagement } from "@/components/UserManagement";
import { ReportsGenerator } from "@/components/ReportsGenerator";
import { WardenApprovals } from "@/components/WardenApprovals";
import { ChangePassword } from "@/components/ChangePassword";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalItems: 0,
    activeWardens: 0,
    lowStockItems: 0,
    recentActivities: [] as any[],
    wardenStats: [] as any[]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get admin users
      const { data: adminProfiles } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'admin');

      const adminIds = adminProfiles?.map(p => p.id) || [];

      // Get total inventory items assigned by admins
      const { data: inventoryItems, count: totalItems } = await supabase
        .from('inventory_items')
        .select('*, hostels(name), rooms(room_number)', { count: 'exact' })
        .in('assigned_by', adminIds);

      // Get active wardens
      const { count: activeWardens } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .in('role', ['male-warden', 'female-warden'])
        .eq('status', 'active');

      // Get low stock items (quantity < 5)
      const { count: lowStockItems } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact' })
        .lt('quantity', 5);

      // Get recent activities from approvals
      const { data: approvals } = await supabase
        .from('warden_approvals')
        .select('*, user_profiles!warden_approvals_warden_id_fkey(full_name, role)')
        .order('created_at', { ascending: false })
        .limit(10);

      const recentActivities = approvals?.map(approval => ({
        action: approval.status === 'approved' ? 'Approved Request' : approval.status === 'rejected' ? 'Rejected Request' : 'Pending Request',
        user: approval.user_profiles?.full_name || 'Unknown Warden',
        role: approval.user_profiles?.role || '',
        item: approval.description || 'No description',
        time: new Date(approval.created_at).toLocaleString(),
        status: approval.status
      })) || [];

      // Get warden statistics
      const { data: wardens } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['male-warden', 'female-warden'])
        .eq('status', 'active');

      const wardenStats = await Promise.all(
        (wardens || []).map(async (warden) => {
          // Count approved requests for each warden
          const { count: approvedCount } = await supabase
            .from('warden_approvals')
            .select('*', { count: 'exact' })
            .eq('warden_id', warden.id)
            .eq('status', 'approved');

          const { count: totalRequests } = await supabase
            .from('warden_approvals')
            .select('*', { count: 'exact' })
            .eq('warden_id', warden.id);

          const efficiency = totalRequests ? Math.round((approvedCount || 0) / totalRequests * 100) : 0;

          return {
            name: warden.full_name,
            role: warden.role,
            hostel: warden.assigned_hostel || 'Unassigned',
            efficiency,
            status: efficiency > 90 ? 'Excellent' : efficiency > 75 ? 'Very Good' : efficiency > 60 ? 'Good' : 'Needs Improvement'
          };
        })
      );

      setDashboardData({
        totalItems: totalItems || 0,
        activeWardens: activeWardens || 0,
        lowStockItems: lowStockItems || 0,
        recentActivities,
        wardenStats
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { title: "Total Stock Items", value: dashboardData.totalItems.toString(), icon: Package, color: "text-admin" },
    { title: "Active Wardens", value: dashboardData.activeWardens.toString(), icon: Users, color: "text-admin" },
    { title: "Low Stock Alerts", value: dashboardData.lowStockItems.toString(), icon: AlertTriangle, color: "text-warning" },
    { title: "Pending Approvals", value: dashboardData.recentActivities.filter(a => a.status === 'pending').length.toString(), icon: TrendingUp, color: "text-success" },
  ];

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-admin-secondary">
      {/* Header */}
      <header className="bg-gradient-admin text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">System Administrator</h1>
              <p className="text-admin-secondary opacity-90">Complete System Control</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => setShowChangePassword(true)} className="border-white/40 bg-white/10 text-white hover:bg-white/20 font-semibold">
              Change Password
            </Button>
            <Button variant="outline" onClick={onLogout} className="border-white/40 bg-white/10 text-white hover:bg-white/20 font-semibold">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Warden Performance */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-admin" />
                Warden Performance
              </CardTitle>
              <CardDescription>Monitor warden efficiency and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.wardenStats.length > 0 ? (
                  dashboardData.wardenStats.map((warden, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{warden.name}</p>
                        <p className="text-sm text-muted-foreground">{warden.role} - {warden.hostel}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-admin">{warden.efficiency}%</p>
                        <Badge variant={warden.efficiency > 90 ? "default" : "secondary"}>
                          {warden.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No wardens found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-admin" />
                Recent Activities
              </CardTitle>
              <CardDescription>System-wide activity monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentActivities.length > 0 ? (
                  dashboardData.recentActivities.slice(0, 4).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'approved' ? 'bg-success' : 
                        activity.status === 'rejected' ? 'bg-destructive' : 
                        'bg-warning'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{activity.action}</p>
                          <Badge variant={
                            activity.status === 'approved' ? 'default' : 
                            activity.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }>
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.user}</p>
                        <p className="text-sm font-medium">{activity.item}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button 
            className="bg-gradient-admin text-white h-12"
            onClick={() => setShowSystemSettings(true)}
          >
            <Settings className="h-5 w-5 mr-2" />
            System Settings
          </Button>
          <Button 
            className="bg-gradient-admin text-white h-12"
            onClick={() => setShowReports(true)}
          >
            <FileText className="h-5 w-5 mr-2" />
            Generate Reports
          </Button>
          <Button 
            className="bg-gradient-admin text-white h-12"
            onClick={() => setShowUserManagement(true)}
          >
            <Users className="h-5 w-5 mr-2" />
            Manage Users
          </Button>
          <Button 
            className="bg-gradient-admin text-white h-12"
            onClick={() => setShowApprovals(true)}
          >
            <UserCheck className="h-5 w-5 mr-2" />
            Warden Approvals
          </Button>
        </div>
      </div>

      {/* Modals */}
      <SystemSettings 
        isOpen={showSystemSettings} 
        onOpenChange={setShowSystemSettings} 
      />
      <UserManagement 
        isOpen={showUserManagement} 
        onOpenChange={setShowUserManagement} 
      />
      <WardenApprovals 
        isOpen={showApprovals} 
        onOpenChange={(open) => {
          setShowApprovals(open);
          if (!open) {
            // Reload dashboard data when approvals dialog closes
            loadDashboardData();
          }
        }}
      />
      <ChangePassword 
        isOpen={showChangePassword} 
        onOpenChange={setShowChangePassword} 
      />
      {showReports && (
        <Dialog open={showReports} onOpenChange={setShowReports}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Reports
              </DialogTitle>
              <DialogDescription>
                Generate comprehensive reports for system analysis
              </DialogDescription>
            </DialogHeader>
            <ReportsGenerator 
              wardenType="admin"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}