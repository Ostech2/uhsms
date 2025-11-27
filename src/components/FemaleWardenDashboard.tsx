import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HostelManagement } from "@/components/HostelManagement";
import { ReportsGenerator } from "@/components/ReportsGenerator";
import { ChangePassword } from "@/components/ChangePassword";
import { 
  Users, 
  Package, 
  AlertTriangle, 
  Heart, 
  PlusCircle,
  FileText,
  Bed,
  Sparkles,
  Coffee,
  Shield,
  BarChart3,
  Settings
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FemaleWardenDashboardProps {
  onLogout: () => void;
}

export function FemaleWardenDashboard({ onLogout }: FemaleWardenDashboardProps) {
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
        supabase.from('hostels').select('*').eq('type', 'female'),
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

  const femaleHostelIds = dashboardData.hostels.map(h => h.id);
  const femaleRooms = dashboardData.rooms.filter(room => 
    femaleHostelIds.includes(room.hostel_id)
  );
  const femaleInventory = dashboardData.inventory.filter(item => 
    femaleHostelIds.includes(item.hostel_id)
  );

  const stats = [
    { title: "Assigned Rooms", value: femaleRooms.length.toString(), icon: Bed, color: "text-female" },
    { title: "Total Stock Items", value: femaleInventory.length.toString(), icon: Package, color: "text-female" },
    { title: "Safety Requests", value: femaleInventory.filter(item => item.status === 'maintenance' && item.name.toLowerCase().includes('safety')).length.toString(), icon: Shield, color: "text-warning" },
    { title: "Wellness Items", value: femaleInventory.filter(item => item.name.toLowerCase().includes('wellness') || item.name.toLowerCase().includes('health')).length.toString(), icon: Heart, color: "text-success" },
  ];

  const getCategoryStats = () => {
    return dashboardData.categories.map(category => {
      const categoryItems = femaleInventory.filter(item => item.category_id === category.id);
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
      case 'personal care': return Sparkles;
      case 'room essentials': return Bed;
      case 'kitchen supplies': return Coffee;
      case 'safety items': return Shield;
      default: return Package;
    }
  };

  const stockCategories = getCategoryStats();

  const recentActivities = femaleInventory
    .filter(item => item.updated_at)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4)
    .map(item => ({
      type: item.status === 'assigned' ? 'Issued' : item.status === 'maintenance' ? 'Safety Check' : 'Updated',
      item: item.name,
      quantity: item.quantity,
      student: item.room_id ? `Room ${item.room_id.slice(-6)}` : 'Unassigned',
      room: item.room_id ? `Room ${item.room_id.slice(-6)}` : 'Unassigned',
      status: item.status,
      time: new Date(item.updated_at).toLocaleString()
    }));

  const wellnessPrograms = [
    { name: "Monthly Health Check", participants: Math.floor(femaleRooms.filter(r => r.status === 'occupied').length * 0.8), status: "Active" },
    { name: "Personal Safety Workshop", participants: Math.floor(femaleRooms.filter(r => r.status === 'occupied').length * 0.6), status: "Scheduled" },
    { name: "Wellness Support Group", participants: Math.floor(femaleRooms.filter(r => r.status === 'occupied').length * 0.4), status: "Active" },
    { name: "Emergency Response Training", participants: Math.floor(femaleRooms.filter(r => r.status === 'occupied').length * 0.9), status: "Completed" },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good': return 'bg-success text-white';
      case 'low stock': return 'bg-warning text-white';
      case 'adequate': return 'bg-female text-white';
      case 'completed': return 'bg-success text-white';
      case 'approved': return 'bg-success text-white';
      case 'active': return 'bg-female text-white';
      case 'scheduled': return 'bg-warning text-white';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-female-secondary">
      {/* Header */}
      <header className="bg-gradient-female text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">Female Warden Dashboard</h1>
              <p className="text-female-secondary opacity-90">Uganda Christian University - Bishop Barham University College Kabale</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => setShowChangePassword(true)} className="border-white/40 bg-white/10 text-white hover:bg-white/20 font-semibold">
              Change Password
            </Button>
            <Button variant="outline" onClick={onLogout} className="border-white/40 bg-black/10 text-black hover:bg-black/20 font-semibold">
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
                <Package className="h-5 w-5 text-female" />
                Stock Categories
              </CardTitle>
              <CardDescription>Specialized inventory for female residents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <category.icon className="h-5 w-5 text-female" />
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

          {/* Wellness Programs */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-female" />
                Wellness Programs
              </CardTitle>
              <CardDescription>Health and safety initiatives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wellnessPrograms.map((program, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{program.name}</p>
                      <p className="text-sm text-muted-foreground">{program.participants} participants</p>
                    </div>
                    <Badge className={getStatusColor(program.status)}>
                      {program.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-female" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest activities and requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-female mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getStatusColor(activity.type)}>
                        {activity.type}
                      </Badge>
                      <p className="font-medium">{activity.item}</p>
                    </div>
                    {activity.quantity && (
                      <p className="text-sm text-muted-foreground">Quantity: {activity.quantity}</p>
                    )}
                    {activity.student && (
                      <p className="text-sm text-muted-foreground">{activity.student}</p>
                    )}
                    {activity.room && (
                      <p className="text-sm text-muted-foreground">{activity.room}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button className="bg-gradient-female text-white h-12">
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Stock
          </Button>
          <Button className="bg-gradient-female text-white h-12">
            <Heart className="h-5 w-5 mr-2" />
            Wellness Check
          </Button>
          <Button className="bg-gradient-female text-white h-12">
            <Shield className="h-5 w-5 mr-2" />
            Safety Report
          </Button>
          <Button className="bg-gradient-female text-white h-12">
            <FileText className="h-5 w-5 mr-2" />
            Reports
          </Button>
        </div>
          </TabsContent>

          <TabsContent value="management">
            <HostelManagement wardenType="female" />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsGenerator wardenType="female" />
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