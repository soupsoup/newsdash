import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIntegration } from "@/contexts/IntegrationContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Integration } from "@shared/schema";

const DataSources = () => {
  const { integrations, updateIntegration, refreshIntegrations } = useIntegration();
  const { toast } = useToast();
  
  const sources = integrations.filter(i => i.isSource);

  const handleToggleSource = async (integration: Integration, active: boolean) => {
    try {
      const updatedIntegration = {
        ...integration,
        status: active ? "connected" : "disconnected",
      };
      
      await updateIntegration(updatedIntegration);
      
      toast({
        title: active ? "Source Activated" : "Source Deactivated",
        description: `${integration.name} is now ${active ? "active" : "inactive"}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update source status",
        variant: "destructive",
      });
    }
  };

  const DiscordSourceConfig = () => {
    const discordSource = sources.find(s => s.type === "discord");
    const [channelId, setChannelId] = useState(
      (discordSource?.additionalConfig as Record<string, any>)?.channelId || "708365137660215330"
    );
    const [serverId, setServerId] = useState(
      (discordSource?.additionalConfig as Record<string, any>)?.serverId || "708365137660215327"
    );
    
    const handleSaveConfig = async () => {
      if (!discordSource) {
        toast({
          title: "Error",
          description: "Discord integration not found",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const updatedIntegration = {
          ...discordSource,
          additionalConfig: {
            ...((discordSource.additionalConfig || {}) as Record<string, any>),
            channelId,
            serverId,
          },
          lastSyncAt: new Date(),
        };
        
        await updateIntegration(updatedIntegration);
        
        toast({
          title: "Discord Configuration Saved",
          description: "Successfully updated Discord source configuration",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save Discord configuration",
          variant: "destructive",
        });
      }
    };
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <span className="material-icons mr-2">discord</span>
            Discord Source Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 mb-4 border-l-4 border-amber-500 bg-amber-50 text-amber-800">
            <h4 className="text-sm font-bold mb-2">Bot Setup Required</h4>
            <p className="text-xs mb-2">
              To use this integration, you need to:
            </p>
            <ol className="text-xs list-decimal ml-4 space-y-1 mb-2">
              <li>Go to your <a href="https://discord.com/developers/applications" target="_blank" className="text-blue-600 underline">Discord Developer Portal</a></li>
              <li>Select your bot application</li>
              <li>Copy your Bot Token and set it as the <strong>DISCORD_BOT_TOKEN</strong> secret in this app</li>
              <li>Go to the "OAuth2" → "URL Generator" section</li>
              <li>Select "bot" scope and the following permissions: "Read Messages/View Channels", "Read Message History"</li>
              <li>Generate and use the URL to invite the bot to your server</li>
              <li>Make sure the bot has access to the channel you want to pull from</li>
            </ol>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs w-full"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/integrations/discord/check', {
                      method: 'GET',
                    });
                    
                    if (response.ok) {
                      toast({
                        title: "Bot Token Setup",
                        description: "Discord bot token is configured correctly!",
                      });
                    } else {
                      const data = await response.json();
                      toast({
                        title: "Bot Token Missing",
                        description: data.error || "Please set up your Discord bot token in the environment variables",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Connection Error",
                      description: "Failed to check Discord bot token",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Check Bot Token Setup
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="server-id">Discord Server ID</Label>
            <Input
              id="server-id"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              placeholder="Enter Discord server ID"
            />
            <p className="text-xs text-[#757575]">
              Example: 708365137660215327
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="channel-id">Channel ID</Label>
            <Input
              id="channel-id"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Enter Discord channel ID"
            />
            <p className="text-xs text-[#757575]">
              Example: 708365137660215330
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="discord-active">Active</Label>
              <Switch
                id="discord-active"
                checked={discordSource?.status === "connected"}
                onCheckedChange={(checked) => discordSource && handleToggleSource(discordSource, checked)}
              />
            </div>
            <p className="text-xs text-[#757575]">
              {discordSource?.status === "connected" 
                ? "Currently fetching news from Discord" 
                : "Source is currently inactive"}
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/integrations/discord/sync', {
                    method: 'POST',
                  });
                  const data = await response.json();
                  
                  if (response.ok && data.results && data.results.length > 0) {
                    const result = data.results[0];
                    if (result.success) {
                      toast({
                        title: "Sync Successful",
                        description: `Fetched ${result.totalFetched} messages, added ${result.itemsCreated} new items`,
                      });
                    } else {
                      toast({
                        title: "Sync Failed",
                        description: result.error || "Unknown error occurred",
                        variant: "destructive",
                      });
                    }
                  } else {
                    toast({
                      title: "Sync Failed",
                      description: "Failed to sync with Discord server",
                      variant: "destructive",
                    });
                  }
                  
                  // Refresh the integrations data
                  refreshIntegrations();
                } catch (error) {
                  toast({
                    title: "Sync Error",
                    description: "An error occurred while syncing with Discord",
                    variant: "destructive",
                  });
                }
              }}
            >
              Sync Now
            </Button>
            <Button 
              className="bg-[#1976d2] text-white hover:bg-[#1565c0]"
              onClick={handleSaveConfig}
            >
              Save Configuration
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Data Sources</h1>
          <p className="text-[#757575]">Configure and manage your news sources</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Sources</TabsTrigger>
          <TabsTrigger value="all">All Sources</TabsTrigger>
          <TabsTrigger value="discord">Discord</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {sources.filter(s => s.status === "connected").length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources
                .filter(s => s.status === "connected")
                .map(source => (
                  <Card key={source.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-[#2196f3] flex items-center justify-center text-white">
                            <span className="material-icons">
                              {source.type === "discord" ? "discord" : 
                               source.type === "rss" ? "rss_feed" : "api"}
                            </span>
                          </div>
                          <div className="ml-3">
                            <h3 className="font-medium">{source.name}</h3>
                            <p className="text-sm text-[#757575]">
                              {source.type.charAt(0).toUpperCase() + source.type.slice(1)} Source
                            </p>
                          </div>
                        </div>
                        
                        <Switch
                          checked={source.status === "connected"}
                          onCheckedChange={(checked) => handleToggleSource(source, checked)}
                        />
                      </div>
                      
                      <div className="mt-4 text-sm">
                        <div className="flex justify-between text-[#757575]">
                          <span>Last sync:</span>
                          <span>{source.lastSyncAt ? new Date(source.lastSyncAt).toLocaleString() : 'Never'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            // Navigate to configuration tab
                            const tabElement = document.querySelector(`[value="${source.type}"]`) as HTMLButtonElement;
                            if (tabElement) tabElement.click();
                          }}
                        >
                          Configure Source
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <span className="material-icons text-3xl text-[#757575]">wifi_off</span>
                <h3 className="mt-4 text-lg font-medium">No Active Sources</h3>
                <p className="mt-2 text-[#757575]">
                  None of your sources are currently active. Activate a source to start collecting news.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          {sources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map(source => (
                <Card key={source.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#2196f3] flex items-center justify-center text-white">
                          <span className="material-icons">
                            {source.type === "discord" ? "discord" : 
                             source.type === "rss" ? "rss_feed" : "api"}
                          </span>
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium">{source.name}</h3>
                          <p className="text-sm text-[#757575]">
                            {source.type.charAt(0).toUpperCase() + source.type.slice(1)} Source
                          </p>
                        </div>
                      </div>
                      
                      <Switch
                        checked={source.status === "connected"}
                        onCheckedChange={(checked) => handleToggleSource(source, checked)}
                      />
                    </div>
                    
                    <div className="mt-4 text-sm">
                      <div className="flex justify-between text-[#757575]">
                        <span>Status:</span>
                        <span className={source.status === "connected" ? "text-[#4caf50]" : "text-[#ff9800]"}>
                          {source.status === "connected" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#757575] mt-1">
                        <span>Last sync:</span>
                        <span>{source.lastSyncAt ? new Date(source.lastSyncAt).toLocaleString() : 'Never'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          // Navigate to configuration tab
                          const tabElement = document.querySelector(`[value="${source.type}"]`) as HTMLButtonElement;
                          if (tabElement) tabElement.click();
                        }}
                      >
                        Configure Source
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <span className="material-icons text-3xl text-[#757575]">source</span>
                <h3 className="mt-4 text-lg font-medium">No Sources Configured</h3>
                <p className="mt-2 text-[#757575]">
                  Add a source in the Integrations section to get started.
                </p>
                <Button 
                  className="mt-4 bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={() => window.location.href = "/integrations"}
                >
                  Go to Integrations
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="discord">
          {sources.some(s => s.type === "discord") ? (
            <DiscordSourceConfig />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <span className="material-icons text-3xl text-[#757575]">discord</span>
                <h3 className="mt-4 text-lg font-medium">Discord Source Not Configured</h3>
                <p className="mt-2 text-[#757575]">
                  Add a Discord integration in the Integrations section first.
                </p>
                <Button 
                  className="mt-4 bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={() => window.location.href = "/integrations"}
                >
                  Add Discord Integration
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataSources;
