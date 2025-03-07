import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIntegration } from "@/contexts/IntegrationContext";
import { useToast } from "@/hooks/use-toast";

interface AddIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddIntegrationModal = ({ isOpen, onClose }: AddIntegrationModalProps) => {
  const { addIntegration } = useIntegration();
  const { toast } = useToast();

  const [integrationType, setIntegrationType] = useState("discord");
  const [name, setName] = useState("");
  const [isSource, setIsSource] = useState(false);
  const [isDestination, setIsDestination] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const handleSubmit = async () => {
    if (!name || !integrationType) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
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
      const newIntegration = {
        name,
        type: integrationType,
        isSource,
        isDestination,
        apiKey,
        webhookUrl,
        status: "connected", // Optimistically assume connection succeeds
      };
      
      await addIntegration(newIntegration);
      
      toast({
        title: "Integration Added",
        description: `Successfully added ${name} integration`,
      });
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add integration",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setIntegrationType("discord");
    setName("");
    setIsSource(false);
    setIsDestination(false);
    setApiKey("");
    setWebhookUrl("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-[#212121]">Add New Integration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="integration-type" className="text-sm font-medium text-[#757575]">Integration Type</Label>
            <Select value={integrationType} onValueChange={setIntegrationType}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select integration type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
                <SelectItem value="wordpress">WordPress</SelectItem>
                <SelectItem value="rss">RSS Feed</SelectItem>
                <SelectItem value="api">Custom API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-[#757575]">Name</Label>
            <Input 
              id="name"
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
                  id="source"
                  checked={isSource}
                  onCheckedChange={(checked) => setIsSource(checked as boolean)}
                />
                <Label htmlFor="source" className="text-sm">Source</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="destination"
                  checked={isDestination}
                  onCheckedChange={(checked) => setIsDestination(checked as boolean)}
                />
                <Label htmlFor="destination" className="text-sm">Destination</Label>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="api-key" className="text-sm font-medium text-[#757575]">API Key/Token</Label>
            <Input 
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key or token" 
              className="mt-1"
            />
            <p className="text-xs text-[#757575] mt-1">Your credentials are encrypted and stored securely.</p>
          </div>
          
          <div>
            <Label htmlFor="webhook-url" className="text-sm font-medium text-[#757575]">Webhook URL (if applicable)</Label>
            <Input 
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://" 
              className="mt-1"
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#1976d2] text-white hover:bg-[#1565c0]">
            Add Integration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddIntegrationModal;
