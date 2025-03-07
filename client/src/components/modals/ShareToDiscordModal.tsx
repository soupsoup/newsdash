import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NewsItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ShareToDiscordModalProps {
  newsItem: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ShareToDiscordModal = ({ newsItem, isOpen, onClose }: ShareToDiscordModalProps) => {
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  // Set default message when news item changes
  React.useEffect(() => {
    if (newsItem) {
      setMessage(`📰 **${newsItem.title}**\n\n${newsItem.content}`);
    }
  }, [newsItem]);

  const handleShare = async () => {
    if (!newsItem) return;

    setIsSharing(true);
    try {
      // Call Discord share API
      const response = await apiRequest({
        url: "/api/integrations/discord/share",
        method: "POST",
        body: { newsId: newsItem.id, message },
      });

      toast({
        title: "Success",
        description: "News item shared to Discord successfully",
      });

      // Invalidate news cache to reflect updated share status
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
      
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share to Discord. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share to Discord</DialogTitle>
          <DialogDescription>
            Customize the message that will be posted to your Discord channel.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[150px] p-4"
            placeholder="Enter your message here..."
          />
          <div className="mt-2 text-sm text-muted-foreground">
            <p>
              <strong>Markdown tips:</strong> Use **bold**, *italic*, and `code` formatting.
              Discord also supports emoji reactions like 📰 and 📊.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || !message.trim()}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
          >
            {isSharing ? "Sharing..." : "Share to Discord"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareToDiscordModal;