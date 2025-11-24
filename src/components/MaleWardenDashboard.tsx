import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HostelManagement } from "@/components/HostelManagement";
import { ReportsGenerator } from "@/components/ReportsGenerator";
import { ChangePassword } from "@/components/ChangePassword";
import { 
  UserCheck, 
  Package, 
  AlertTriangle, 
  Wrench, 
  PlusCircle,
  FileText,
  Bed,
  ShowerHead,
  Laptop,
  BarChart3,
  Settings
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaleWardenDashboardProps {
  onLogout: () => void;
}

export function MaleWardenDashboard({ onLogout }: MaleWardenDashboardProps) {
  const [dashboardData, setDashboardData] = useState({
    hostels: [],
    rooms: [],
    inventory: [],
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        { data: hostels },
        { data: rooms },
        { data: inventory },
        { data: categories }
      ] = await Promise.all([
        supabase.from('hostels').select('*').eq('type', 'male'),
        supabase.from('rooms').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('inventory_categories').select('*')
      ]);

      setDashboardData({
        hostels: hostels || [],
        rooms: rooms || [],
        inventory: inventory || [],
        categories: categories || []
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

  const maleHostelIds = dashboardData.hostels.map(h => h.id);
  const maleRooms = dashboardData.rooms.filter(room => 
    maleHostelIds.includes(room.hostel_id)
  );
  const maleInventory = dashboardData.inventory.filter(item => 
    maleHostelIds.includes(item.hostel_id)
  );

  const stats = [
    { title: "Assigned Rooms", value: maleRooms.length.toString(), icon: Bed, color: "text-male" },
    { title: "Total Stock Items", value: maleInventory.length.toString(), icon: Package, color: "text-male" },
    { title: "Maintenance Items", value: maleInventory.filter(item => item.status === 'maintenance' || item.condition === 'damaged').length.toString(), icon: AlertTriangle, color: "text-warning" },
    { title: "Available Items", value: maleInventory.filter(item => item.status === 'available').length.toString(), icon: Wrench, color: "text-success" },
  ];

  const getCategoryStats = () => {
    return dashboardData.categories.map(category => {
      const categoryItems = maleInventory.filter(item => item.category_id === category.id);
      const availableCount = categoryItems.filter(item => item.status === 'available').length;
      const totalCount = categoryItems.length;
      
      let status = "Good";
      if (totalCount === 0) status = "No Stock";
      else if (availableCount < totalCount * 0.3) status = "Low Stock";
      else if (availableCount < totalCount * 0.7) status = "Adequate";
      
      return {
        name: category.name,
        count: totalCount,
        status,
        icon: getIconForCategory(category.name)
      };
    });
  };

  const getIconForCategory = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'furniture': return Bed;
      case 'electronics': return Laptop;
      case 'plumbing': return ShowerHead;
      default: return Package;
    }
  };

  const stockCategories = getCategoryStats();

  const recentTransactions = maleInventory
    .filter(item => item.updated_at)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4)
    .map(item => ({
      type: item.status === 'assigned' ? 'Issued' : item.status === 'maintenance' ? 'Maintenance' : 'Updated',
      item: item.name,
      quantity: item.quantity,
      room: item.room_id ? `Room ${item.room_id.slice(-6)}` : 'Unassigned',
      status: item.status,
      time: new Date(item.updated_at).toLocaleString()
    }));

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good': return 'bg-success text-white';
      case 'low stock': return 'bg-warning text-white';
      case 'adequate': return 'bg-male text-white';
      case 'completed': return 'bg-success text-white';
      case 'pending': return 'bg-warning text-white';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-male-secondary">
      {/* Header */}
      <header className="bg-gradient-male text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">Male Warden Dashboard</h1>
              <p className="text-male-secondary opacity-90">Uganda Christian University - Bishop Barham University College Kabale</p>
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
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 size={16} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings size={16} />
              Hostel Management
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText size={16} />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
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
              {/* Stock Categories */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-male" />
                    Stock Categories
                  </CardTitle>
                  <CardDescription>Current inventory by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stockCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <category.icon className="h-5 w-5 text-male" />
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-sm text-muted-foreground">{category.count} items</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(category.status)}>
                          {category.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-male" />
                    Recent Activities
                  </CardTitle>
                  <CardDescription>Latest stock movements and requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 rounded-full bg-male mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getStatusColor(transaction.type)}>
                              {transaction.type}
                            </Badge>
                            <p className="font-medium">{transaction.item}</p>
                          </div>
                          {transaction.quantity && (
                            <p className="text-sm text-muted-foreground">Quantity: {transaction.quantity}</p>
                          )}
                          {transaction.room && (
                            <p className="text-sm text-muted-foreground">{transaction.room}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{transaction.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <HostelManagement wardenType="male" />
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <ReportsGenerator wardenType="male" />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ChangePassword 
        isOpen={showChangePassword} 
        onOpenChange={setShowChangePassword} 
      />
    </div>
  );
}