import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIntegration } from "@/contexts/IntegrationContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Integration } from '@shared/schema';

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

  const TwitterSourceConfig = () => {
    const twitterSource = sources.find(s => s.type === "twitter" && s.isSource);
    const [username, setUsername] = useState(
      (twitterSource?.additionalConfig as Record<string, any>)?.username || "DeItaone"
    );
    const [accountId, setAccountId] = useState(
      (twitterSource?.additionalConfig as Record<string, any>)?.accountId || "1156910898"
    );
    
    const handleSaveConfig = async () => {
      if (!twitterSource) {
        toast({
          title: "Error",
          description: "Twitter integration not found",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const updatedIntegration = {
          ...twitterSource,
          additionalConfig: {
            ...((twitterSource.additionalConfig || {}) as Record<string, any>),
            username,
            accountId,
          },
          lastSyncAt: new Date(),
        };
        
        await updateIntegration(updatedIntegration);
        
        toast({
          title: "Twitter Configuration Saved",
          description: "Successfully updated Twitter source configuration",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save Twitter configuration",
          variant: "destructive",
        });
      }
    };
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="mr-2" fill="currentColor">
              <path d="M21.3 3.02h-3.61c.5.37.95.79 1.35 1.26.53.66.71 1.66.18 2.32-.93 1.17-2.72 1.41-3.93 1.02-.67-.24-1.13-.69-1.55-1.25-.47-.61-.56-1.32-.51-2.11h-2.49c.05.8-.04 1.5-.51 2.11-.41.57-.88 1.01-1.55 1.25-1.21.38-3 .15-3.93-1.02-.53-.66-.35-1.66.18-2.32.4-.47.85-.89 1.35-1.26H2.7c-.45 0-.9.37-.9.82v15.84c0 .45.45.82.9.82h18.6c.45 0 .9-.37.9-.82V3.84c0-.45-.45-.82-.9-.82z"/>
            </svg>
            Twitter/X Source Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 mb-4 border-l-4 border-amber-500 bg-amber-50 text-amber-800">
            <h4 className="text-sm font-bold mb-2">Twitter/X Configuration</h4>
            <p className="text-xs mb-2">
              This integration uses web scraping to fetch tweets from Twitter/X since their API has limitations.
            </p>
            <ol className="text-xs list-decimal ml-4 space-y-1 mb-2">
              <li>Enter the Twitter/X username you want to follow (without @)</li>
              <li>Save the configuration and click "Sync Now" to fetch tweets</li>
              <li>The default source is @DeItaone, which posts financial market news</li>
              <li>Our system is optimized to work best with @DeItaone tweets</li>
            </ol>
          </div>
          
          {twitterSource?.status === "error" && (
            <div className="p-4 mb-4 border-l-4 border-red-500 bg-red-50 text-red-800">
              <h4 className="text-sm font-bold mb-2">Source Error</h4>
              <p className="text-xs mb-2">
                We're unable to retrieve real Twitter data at this time. Our system is not using mock data as per requirements.
              </p>
              <p className="text-xs font-medium">
                Possible reasons:
              </p>
              <ul className="text-xs list-disc ml-4 space-y-1 mb-2">
                <li>Twitter's security measures actively block scraping attempts</li>
                <li>Replit environment has restricted network access to certain Twitter services</li>
                <li>API Gateway proxies may be experiencing temporary downtime</li>
                <li>Our system only works with actual tweets - mock data is not used</li>
              </ul>
              <p className="text-xs mb-2">
                Try clicking "Sync Now" to attempt to fetch data again. Our system uses multiple methods to try to retrieve real Twitter data:
              </p>
              <ul className="text-xs list-disc ml-4 space-y-1 mb-2">
                <li>API Gateway proxies (fxtwitter, vxtwitter)</li>
                <li>RSS feed scraping</li>
                <li>Twitter Syndication API</li> 
                <li>Multiple Nitter instances</li>
                <li>Direct X.com scraping</li>
              </ul>
              <p className="text-xs text-blue-700 font-medium">
                We continue to improve our scraping methods for better reliability.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Twitter/X Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Twitter username (without @)"
            />
            <p className="text-xs text-[#757575]">
              Example: DeItaone
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="twitter-active">Active</Label>
              <Switch
                id="twitter-active"
                checked={twitterSource?.status === "connected"}
                onCheckedChange={(checked) => twitterSource && handleToggleSource(twitterSource, checked)}
              />
            </div>
            <p className="text-xs text-[#757575]">
              {twitterSource?.status === "connected" 
                ? "Currently fetching tweets from Twitter/X" 
                : twitterSource?.status === "error"
                ? "Source is reporting errors - see above"
                : "Source is currently inactive"}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                twitterSource?.status === "connected" ? "bg-green-500" :
                twitterSource?.status === "error" ? "bg-red-500" :
                "bg-gray-400"
              }`}></div>
              <span className="text-sm">
                {twitterSource?.status === "connected" ? "Connected" :
                 twitterSource?.status === "error" ? "Error" :
                 "Disconnected"}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  toast({
                    title: "Syncing...",
                    description: "Attempting to retrieve tweets from Twitter/X",
                  });
                  
                  const response = await fetch('/api/integrations/twitter/sync', {
                    method: 'POST',
                  });
                  const data = await response.json();
                  
                  if (response.ok && data.success) {
                    if (data.results && data.results.length > 0) {
                      const result = data.results[0];
                      if (result.success) {
                        toast({
                          title: "Sync Successful",
                          description: `Fetched ${result.totalFetched} tweets via ${result.method || 'scraping'}, added ${result.itemsCreated} new items`,
                        });
                      } else {
                        toast({
                          title: "Real-time Data Unavailable",
                          description: result.error || "Unable to retrieve real Twitter data. No mock data will be used.",
                          variant: "destructive",
                        });
                      }
                    }
                  } else {
                    // Extract any detailed error information from the response
                    const result = data.results && data.results.length > 0 ? data.results[0] : null;
                    const errorDetails = data.error || (result?.error);
                    const details = result?.details || null;
                    const tips = data.tips || (result?.tips);
                    const technical = result?.technical || null;
                    
                    // Log technical information for debugging
                    if (technical) {
                      console.log("Technical details about scraping failure:", technical);
                    }
                    
                    // Show expanded error information in toast
                    toast({
                      title: "Real-time Data Unavailable",
                      description: (
                        <div className="space-y-1">
                          <p className="font-medium">{data.message || "Failed to retrieve real Twitter data. No mock data will be used."}</p>
                          
                          {/* Display primary error */}
                          {errorDetails && <p className="text-sm text-red-500">{errorDetails}</p>}
                          
                          {/* Show specific details if available */}
                          {details && Array.isArray(details) && details.length > 0 && (
                            <div className="pt-1">
                              <p className="text-xs font-medium">Details:</p>
                              <ul className="text-xs list-disc pl-4">
                                {details.slice(0, 2).map((detail, i) => (
                                  <li key={i}>{detail}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Show suggestions for user */}
                          {tips && Array.isArray(tips) && tips.length > 0 && (
                            <div className="pt-1">
                              <p className="text-xs font-medium">Suggestions:</p>
                              <ul className="text-xs list-disc pl-4">
                                {tips.map((tip, i) => (
                                  <li key={i}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Show timestamp if available */}
                          {result?.timestamp && (
                            <p className="text-xs text-gray-500 pt-1">
                              Attempted at: {new Date(result.timestamp).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      ),
                      variant: "destructive",
                    });
                  }
                  
                  // Refresh the integrations data
                  refreshIntegrations();
                } catch (error) {
                  toast({
                    title: "Sync Error",
                    description: "Error connecting to Twitter service. No mock data will be used.",
                    variant: "destructive",
                  });
                  
                  // Refresh the integrations data
                  refreshIntegrations();
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
              <li><strong>Important:</strong> For private channels, you must add the bot to that specific channel or give it appropriate role permissions</li>
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
          <TabsTrigger value="twitter">Twitter/X</TabsTrigger>
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
        
        <TabsContent value="twitter">
          {sources.some(s => s.type === "twitter") ? (
            <TwitterSourceConfig />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <span className="material-icons text-3xl text-[#757575]">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#757575">
                    <path d="M21.3 3.02h-3.61c.5.37.95.79 1.35 1.26.53.66.71 1.66.18 2.32-.93 1.17-2.72 1.41-3.93 1.02-.67-.24-1.13-.69-1.55-1.25-.47-.61-.56-1.32-.51-2.11h-2.49c.05.8-.04 1.5-.51 2.11-.41.57-.88 1.01-1.55 1.25-1.21.38-3 .15-3.93-1.02-.53-.66-.35-1.66.18-2.32.4-.47.85-.89 1.35-1.26H2.7c-.45 0-.9.37-.9.82v15.84c0 .45.45.82.9.82h18.6c.45 0 .9-.37.9-.82V3.84c0-.45-.45-.82-.9-.82zM7.17 20c-1.12 0-2.03-.89-2.03-2 0-1.11.9-2 2.03-2 1.12 0 2.03.9 2.03 2S8.3 20 7.17 20zm9.66 0c-1.12 0-2.03-.9-2.03-2s.9-2 2.03-2c1.12 0 2.03.9 2.03 2s-.91 2-2.03 2zM16.23 9H7.77l1.25 5h5.96l1.25-5z"/>
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-medium">Twitter/X Source Not Configured</h3>
                <p className="mt-2 text-[#757575]">
                  Add a Twitter/X integration in the Integrations section first.
                </p>
                <Button 
                  className="mt-4 bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={() => window.location.href = "/integrations"}
                >
                  Add Twitter/X Integration
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
