import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useIntegration } from "@/contexts/IntegrationContext";
import { useToast } from "@/hooks/use-toast";
import AddIntegrationModal from "@/components/modals/AddIntegrationModal";
import { Integration } from "@shared/schema";

const Integrations = () => {
  const { integrations, updateIntegration, deleteIntegration } = useIntegration();
  const { toast } = useToast();
  const [showAddIntegrationModal, setShowAddIntegrationModal] = useState(false);
  
  const sources = integrations.filter(i => i.isSource);
  const destinations = integrations.filter(i => i.isDestination);

  const handleRefreshIntegration = async (integration: Integration) => {
    try {
      const updatedIntegration = {
        ...integration,
        lastSyncAt: new Date(),
      };
      
      await updateIntegration(updatedIntegration);
      
      toast({
        title: "Integration Refreshed",
        description: `Successfully refreshed ${integration.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh integration",
        variant: "destructive",
      });
    }
  };
  
  const handleDisconnectIntegration = async (integration: Integration) => {
    try {
      const updatedIntegration = {
        ...integration,
        status: "disconnected",
      };
      
      await updateIntegration(updatedIntegration);
      
      toast({
        title: "Integration Disconnected",
        description: `Successfully disconnected ${integration.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect integration",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteIntegration = async (id: number) => {
    if (confirm("Are you sure you want to delete this integration?")) {
      try {
        await deleteIntegration(id);
        
        toast({
          title: "Integration Deleted",
          description: "Successfully deleted integration",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete integration",
          variant: "destructive",
        });
      }
    }
  };
  
  const getStatusBadge = (status: string) => {
    if (status === "connected") {
      return <Badge className="bg-[rgba(76,175,80,0.1)] text-[#4caf50] border-[#4caf50]">Connected</Badge>;
    } else if (status === "error") {
      return <Badge className="bg-[rgba(244,67,54,0.1)] text-[#f44336] border-[#f44336]">Error</Badge>;
    } else {
      return <Badge className="bg-[rgba(255,152,0,0.1)] text-[#ff9800] border-[#ff9800]">Disconnected</Badge>;
    }
  };

  const IntegrationCard = ({ integration }: { integration: Integration }) => (
    <Card key={integration.id}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#2196f3] flex items-center justify-center text-white">
              <span className="material-icons">
                {integration.type === "discord" ? "discord" : 
                 integration.type === "twitter" ? "flutter_dash" : 
                 integration.type === "wordpress" ? "wordpress" : "rss_feed"}
              </span>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">{integration.name}</h3>
              <div className="flex items-center mt-1">
                {getStatusBadge(integration.status)}
                <span className="text-xs text-[#757575] ml-2">
                  {integration.lastSyncAt 
                    ? `Last sync: ${new Date(integration.lastSyncAt).toLocaleString()}` 
                    : 'Never synced'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <button 
              className="text-[#757575] hover:text-[#1976d2]"
              onClick={() => handleRefreshIntegration(integration)}
            >
              <span className="material-icons">refresh</span>
            </button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-[#757575]">Type:</div>
            <div className="font-medium">{integration.type.charAt(0).toUpperCase() + integration.type.slice(1)}</div>
            
            <div className="text-[#757575]">Purpose:</div>
            <div className="font-medium">
              {integration.isSource && integration.isDestination 
                ? "Source & Destination" 
                : integration.isSource 
                  ? "Source" 
                  : "Destination"}
            </div>
            
            {integration.webhookUrl && (
              <>
                <div className="text-[#757575]">Webhook:</div>
                <div className="font-medium truncate" title={integration.webhookUrl}>
                  {integration.webhookUrl}
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDisconnectIntegration(integration)}
            disabled={integration.status === "disconnected"}
          >
            Disconnect
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-[#f44336] border-[#f44336] hover:bg-[rgba(244,67,54,0.1)]"
            onClick={() => handleDeleteIntegration(integration.id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Integrations</h1>
          <p className="text-[#757575]">Manage your platform connections</p>
        </div>
        
        <Button 
          className="bg-[#1976d2] text-white hover:bg-[#1565c0]"
          onClick={() => setShowAddIntegrationModal(true)}
        >
          <span className="material-icons text-sm mr-1">add</span>
          <span>Add New</span>
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Integrations</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {integrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map(integration => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <span className="material-icons text-3xl text-[#757575]">device_hub</span>
                <h3 className="mt-4 text-lg font-medium">No Integrations</h3>
                <p className="mt-2 text-[#757575]">
                  Add your first integration to start collecting and sharing news.
                </p>
                <Button 
                  className="mt-4 bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={() => setShowAddIntegrationModal(true)}
                >
                  Add Integration
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="sources">
          {sources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map(integration => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <span className="material-icons text-3xl text-[#757575]">source</span>
                <h3 className="mt-4 text-lg font-medium">No Source Integrations</h3>
                <p className="mt-2 text-[#757575]">
                  Add an integration configured as a source to collect news.
                </p>
                <Button 
                  className="mt-4 bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={() => setShowAddIntegrationModal(true)}
                >
                  Add Source
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="destinations">
          {destinations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinations.map(integration => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <span className="material-icons text-3xl text-[#757575]">share</span>
                <h3 className="mt-4 text-lg font-medium">No Destination Integrations</h3>
                <p className="mt-2 text-[#757575]">
                  Add an integration configured as a destination to share news.
                </p>
                <Button 
                  className="mt-4 bg-[#1976d2] text-white hover:bg-[#1565c0]"
                  onClick={() => setShowAddIntegrationModal(true)}
                >
                  Add Destination
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AddIntegrationModal
        isOpen={showAddIntegrationModal}
        onClose={() => setShowAddIntegrationModal(false)}
      />
    </div>
  );
};

export default Integrations;
