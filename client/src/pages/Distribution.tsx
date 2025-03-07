import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNewsItems } from "@/hooks/useNewsItems";
import { useIntegration } from "@/contexts/IntegrationContext";
import NewsCard from "@/components/NewsCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const Distribution = () => {
  const { toast } = useToast();
  const { newsItems, isLoading } = useNewsItems();
  const { integrations } = useIntegration();
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  
  const destinationPlatforms = integrations.filter(i => i.isDestination);
  
  const selectedNews = selectedNewsId 
    ? newsItems?.find(news => news.id === selectedNewsId) 
    : null;

  const handleSelectNews = (id: number) => {
    setSelectedNewsId(id);
    
    // Reset distribution settings
    setSelectedPlatforms([]);
    setCustomMessage("");
  };

  const handleShareNews = () => {
    if (!selectedNews) {
      toast({
        title: "No News Selected",
        description: "Please select a news item to share",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please select at least one platform to share to",
        variant: "destructive",
      });
      return;
    }
    
    // In a real implementation, this would call the API to share the news
    toast({
      title: "Sharing News",
      description: `Sharing "${selectedNews.title}" to ${selectedPlatforms.join(", ")}`,
    });
    
    // Reset after sharing
    setSelectedNewsId(null);
    setSelectedPlatforms([]);
    setCustomMessage("");
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#212121]">Distribution</h1>
        <p className="text-[#757575]">Share and distribute your news to connected platforms</p>
      </div>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manual">Manual Distribution</TabsTrigger>
          <TabsTrigger value="automated">Automated Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* News Selection Column */}
            <div>
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-medium mb-4">Select News to Share</h2>
                  
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(n => (
                        <div key={n} className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                  ) : newsItems && newsItems.length > 0 ? (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {newsItems.map(news => (
                        <div 
                          key={news.id}
                          className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedNewsId === news.id ? 'border-[#1976d2] bg-[rgba(25,118,210,0.05)]' : 'border-gray-200'
                          }`}
                          onClick={() => handleSelectNews(news.id)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#757575]">
                              {new Date(news.publishedAt).toLocaleString()}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-[rgba(25,118,210,0.1)] text-[#1976d2] rounded-full">
                              {news.sourceType}
                            </span>
                          </div>
                          <h3 className="font-medium text-sm line-clamp-2">{news.title}</h3>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="material-icons text-2xl text-[#757575]">article</span>
                      <p className="mt-2 text-[#757575]">No news items available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Distribution Settings Column */}
            <div>
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-medium mb-4">Distribution Settings</h2>
                  
                  {selectedNews ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-[#757575] mb-1">Selected Item</p>
                        <h3 className="font-medium">{selectedNews.title}</h3>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2">Select Platforms</Label>
                        {destinationPlatforms.length > 0 ? (
                          <div className="space-y-2">
                            {destinationPlatforms.map(platform => (
                              <div key={platform.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`platform-${platform.id}`}
                                  checked={selectedPlatforms.includes(platform.type)}
                                  onCheckedChange={() => togglePlatform(platform.type)}
                                />
                                <Label htmlFor={`platform-${platform.id}`} className="flex items-center">
                                  <span className="material-icons text-sm mr-1">
                                    {platform.type === "discord" ? "discord" : 
                                     platform.type === "twitter" ? "flutter_dash" : 
                                     platform.type === "wordpress" ? "wordpress" : "rss_feed"}
                                  </span>
                                  <span>{platform.name}</span>
                                </Label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-[#757575] p-3 border border-dashed border-gray-300 rounded-lg">
                            No destination platforms configured. Add one in the Integrations section.
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="custom-message" className="text-sm font-medium mb-2">
                          Custom Message (Optional)
                        </Label>
                        <Textarea
                          id="custom-message"
                          placeholder="Add a custom message to your share..."
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      
                      <Button 
                        className="w-full bg-[#1976d2] text-white hover:bg-[#1565c0]"
                        disabled={selectedPlatforms.length === 0}
                        onClick={handleShareNews}
                      >
                        <span className="material-icons text-sm mr-1">share</span>
                        Share to Selected Platforms
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="material-icons text-3xl text-[#757575]">arrow_back</span>
                      <p className="mt-4 text-[#757575]">Select a news item from the left to share</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="automated">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Automated Distribution Rules</h2>
                <Button className="bg-[#1976d2] text-white hover:bg-[#1565c0]">
                  <span className="material-icons text-sm mr-1">add</span>
                  Create Rule
                </Button>
              </div>
              
              <div className="bg-[#f5f5f5] rounded-lg p-6 text-center">
                <span className="material-icons text-3xl text-[#757575]">deployed_code</span>
                <h3 className="mt-4 text-lg font-medium">Automated Distribution</h3>
                <p className="mt-2 text-[#757575]">
                  Create rules to automatically share news items to specific platforms based on criteria.
                </p>
                <p className="mt-4 text-sm text-[#1976d2]">Coming soon!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Distribution;
