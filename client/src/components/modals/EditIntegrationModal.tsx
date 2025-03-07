import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useIntegration } from "@/contexts/IntegrationContext";
import { useToast } from "@/hooks/use-toast";
import { Integration } from "@shared/schema";

interface EditIntegrationModalProps {
  integration: Integration | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditIntegrationModal = ({ integration, isOpen, onClose }: EditIntegrationModalProps) => {
  const { updateIntegration } = useIntegration();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [isSource, setIsSource] = useState(false);
  const [isDestination, setIsDestination] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [additionalConfig, setAdditionalConfig] = useState<Record<string, string>>({});

  // Update form when integration changes
  useEffect(() => {
    if (integration) {
      setName(integration.name);
      setIsSource(integration.isSource ?? false);
      setIsDestination(integration.isDestination ?? false);
      setApiKey(integration.apiKey || "");
      setWebhookUrl(integration.webhookUrl || "");
      
      // Handle additional config based on integration type
      const config = integration.additionalConfig as Record<string, unknown> || {};
      
      const newConfig: Record<string, string> = {};
      
      if (integration.type === "twitter" && typeof config.username === "string") {
        newConfig.username = config.username;
      } else if (integration.type === "discord" && typeof config.channelId === "string") {
        newConfig.channelId = config.channelId;
      }
      
      setAdditionalConfig(newConfig);
    }
  }, [integration]);

  const handleSubmit = async () => {
    if (!integration) return;
    
    if (!name) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for the integration",
        variant: "destructive",
      });
      return;
    }

    if (!isSource && !isDestination) {
      toast({
        title: "Purpose Required",
        description: "Please select at least one purpose for this integration",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedIntegration = {
        ...integration,
        name,
        isSource,
        isDestination,
        apiKey: apiKey || null,
        webhookUrl: webhookUrl || null,
        additionalConfig
      };
      
      await updateIntegration(updatedIntegration);
      
      toast({
        title: "Integration Updated",
        description: `Successfully updated ${name} integration`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update integration",
        variant: "destructive",
      });
    }
  };

  // Render type-specific fields based on integration type
  const renderTypeSpecificFields = () => {
    if (!integration) return null;
    
    switch (integration.type) {
      case "twitter":
        return (
          <div>
            <Label htmlFor="twitter-username" className="text-sm font-medium text-[#757575]">
              Twitter Username
            </Label>
            <Input 
              id="twitter-username"
              value={additionalConfig.username || ""}
              onChange={(e) => setAdditionalConfig({...additionalConfig, username: e.target.value})}
              placeholder="e.g. DeItaone (without @)" 
              className="mt-1"
            />
            <p className="text-xs text-[#757575] mt-1">
              Enter the username without the @ symbol to fetch tweets from
            </p>
          </div>
        );
        
      case "discord":
        return (
          <div>
            <Label htmlFor="discord-channel" className="text-sm font-medium text-[#757575]">
              Discord Channel ID
            </Label>
            <Input 
              id="discord-channel"
              value={additionalConfig.channelId || ""}
              onChange={(e) => setAdditionalConfig({...additionalConfig, channelId: e.target.value})}
              placeholder="e.g. 708365137660215330" 
              className="mt-1"
            />
            <p className="text-xs text-[#757575] mt-1">
              Channel ID for fetching messages or posting content
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!integration) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-[#212121]">
            Edit Integration: {integration.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="edit-name" className="text-sm font-medium text-[#757575]">Name</Label>
            <Input 
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this integration" 
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-[#757575]">Integration Purpose</Label>
            <div className="flex space-x-4 mt-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-source"
                  checked={isSource}
                  onCheckedChange={(checked) => setIsSource(checked as boolean)}
                />
                <Label htmlFor="edit-source" className="text-sm">Source</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-destination"
                  checked={isDestination}
                  onCheckedChange={(checked) => setIsDestination(checked as boolean)}
                />
                <Label htmlFor="edit-destination" className="text-sm">Destination</Label>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-api-key" className="text-sm font-medium text-[#757575]">
              API Key/Token
            </Label>
            <Input 
              id="edit-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={apiKey ? "••••••••••••••••" : "Enter API key or token"} 
              className="mt-1"
            />
            <p className="text-xs text-[#757575] mt-1">
              {apiKey ? "Leave unchanged to keep the current API key." : "Your credentials are encrypted and stored securely."}
            </p>
          </div>
          
          <div>
            <Label htmlFor="edit-webhook-url" className="text-sm font-medium text-[#757575]">
              Webhook URL (if applicable)
            </Label>
            <Input 
              id="edit-webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://" 
              className="mt-1"
            />
          </div>
          
          {renderTypeSpecificFields()}
        </div>
        
        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#1976d2] text-white hover:bg-[#1565c0]">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditIntegrationModal;