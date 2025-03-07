import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [autoShareEnabled, setAutoShareEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  // User settings
  const [username, setUsername] = useState("johndoe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Application settings
  const [appName, setAppName] = useState("NewsHub");
  const [defaultNewsFormat, setDefaultNewsFormat] = useState(
    "📰 {title}\n\n{content}\n\n#news #update"
  );
  
  const handleSaveUserSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your user settings have been updated",
    });
  };
  
  const handleChangePassword = () => {
    if (!currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Password Changed",
      description: "Your password has been updated",
    });
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };
  
  const handleSaveAppSettings = () => {
    toast({
      title: "App Settings Saved",
      description: "Application settings have been updated",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#212121]">Settings</h1>
        <p className="text-[#757575]">Configure your account and application preferences</p>
      </div>

      <Tabs defaultValue="user" className="space-y-4">
        <TabsList>
          <TabsTrigger value="user">User Settings</TabsTrigger>
          <TabsTrigger value="app">Application Settings</TabsTrigger>
          <TabsTrigger value="api">API & Credentials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="user">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={handleSaveUserSettings}
                >
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your security credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={handleChangePassword}
                >
                  Change Password
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Manage your notification and display settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-[#757575]">Use dark theme for the application</p>
                  </div>
                  <Switch 
                    id="dark-mode"
                    checked={darkModeEnabled}
                    onCheckedChange={setDarkModeEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-[#757575]">Receive email notifications for important events</p>
                  </div>
                  <Switch 
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-share">Auto-Share New Items</Label>
                    <p className="text-sm text-[#757575]">Automatically share new news items to connected platforms</p>
                  </div>
                  <Switch 
                    id="auto-share"
                    checked={autoShareEnabled}
                    onCheckedChange={setAutoShareEnabled}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={handleSaveUserSettings}
                >
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="app">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>Configure global application settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input 
                    id="app-name" 
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="news-format">Default News Format</Label>
                  <Textarea 
                    id="news-format" 
                    value={defaultNewsFormat}
                    onChange={(e) => setDefaultNewsFormat(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-[#757575]">
                    Use {"{title}"} and {"{content}"} as placeholders for news content
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={handleSaveAppSettings}
                >
                  Save Application Settings
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Manage your application data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Export Data</h3>
                  <p className="text-sm text-[#757575] mb-4">
                    Download a backup of your application data
                  </p>
                  <Button variant="outline">
                    Export Data
                  </Button>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-2">Clear Data</h3>
                  <p className="text-sm text-[#757575] mb-4">
                    Delete all news items and reset application data
                  </p>
                  <Button variant="outline" className="text-[#f44336] hover:bg-[rgba(244,67,54,0.1)]">
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Keys & Credentials</CardTitle>
              <CardDescription>Manage API keys and access credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">API Documentation</h3>
                <p className="text-sm text-[#757575]">
                  View the API documentation to learn how to integrate with external systems
                </p>
                <Button 
                  variant="link" 
                  className="pl-0 text-[#1976d2]"
                  onClick={() => {
                    toast({
                      title: "API Documentation",
                      description: "API Documentation is not available yet",
                    });
                  }}
                >
                  View Documentation
                </Button>
              </div>
              
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-2">Generate API Key</h3>
                <p className="text-sm text-[#757575] mb-4">
                  Create an API key to access the NewsHub API from external applications
                </p>
                <Button 
                  className="bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={() => {
                    toast({
                      title: "API Key Generated",
                      description: "Your new API key has been created",
                    });
                  }}
                >
                  Generate New API Key
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Your API Keys</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-[#757575]">No API keys generated yet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
