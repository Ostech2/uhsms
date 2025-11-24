import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Server, Mail, Bell, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SystemSettings({ isOpen, onOpenChange }: SystemSettingsProps) {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    systemName: "Hostel Management System",
    maintenanceMode: false,
    autoBackups: true,
    emailNotifications: true,
    smsNotifications: false,
    lowStockThreshold: 10,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    smtpServer: "smtp.gmail.com",
    smtpPort: "587",
    emailFrom: "admin@hostel.com"
  });

  const handleSave = () => {
    toast({
      title: "Settings Updated",
      description: "System settings have been saved successfully.",
    });
    onOpenChange(false);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </DialogTitle>
          <DialogDescription>
            Configure system-wide settings and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">System Name</Label>
                    <Input
                      id="systemName"
                      value={settings.systemName}
                      onChange={(e) => handleSettingChange("systemName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={settings.lowStockThreshold}
                      onChange={(e) => handleSettingChange("lowStockThreshold", parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to restrict system access
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically backup data daily
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoBackups}
                    onCheckedChange={(checked) => handleSettingChange("autoBackups", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleSettingChange("maxLoginAttempts", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Configuration
                </CardTitle>
                <CardDescription>Configure SMTP settings for email notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpServer">SMTP Server</Label>
                    <Input
                      id="smtpServer"
                      value={settings.smtpServer}
                      onChange={(e) => handleSettingChange("smtpServer", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={settings.smtpPort}
                      onChange={(e) => handleSettingChange("smtpPort", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailFrom">From Email Address</Label>
                  <Input
                    id="emailFrom"
                    type="email"
                    value={settings.emailFrom}
                    onChange={(e) => handleSettingChange("emailFrom", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}