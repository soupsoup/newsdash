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
import { Badge } from "@/components/ui/badge";

interface ShareToTwitterModalProps {
  newsItem: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ShareToTwitterModal = ({ newsItem, isOpen, onClose }: ShareToTwitterModalProps) => {
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const { toast } = useToast();
  const charLimit = 280;

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  // Set default message when news item changes
  React.useEffect(() => {
    if (newsItem) {
      // Create a default tweet with truncated content if needed
      const title = newsItem.title;
      const remainingChars = charLimit - title.length - 5; // 5 chars for spacing and ellipsis
      
      let tweetContent = title;
      if (remainingChars > 30) {
        // Add some content if we have space
        const truncatedContent = newsItem.content.substring(0, remainingChars - 3) + (newsItem.content.length > remainingChars ? '...' : '');
        tweetContent = `${title}\n\n${truncatedContent}`;
      }
      
      setMessage(tweetContent);
      setCharCount(tweetContent.length);
    }
  }, [newsItem, charLimit]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    setCharCount(newMessage.length);
  };

  const handleShare = async () => {
    if (!newsItem) return;

    setIsSharing(true);
    try {
      // Call Twitter share API
      const response = await apiRequest(
        "/api/integrations/twitter/share",
        {
          method: "POST",
          body: JSON.stringify({ newsId: newsItem.id, message }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Success",
        description: "News item shared to Twitter successfully",
      });

      // Invalidate news cache to reflect updated share status
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
      
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share to Twitter. Please try again.",
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
          <DialogTitle>Share to Twitter/X</DialogTitle>
          <DialogDescription>
            Customize your tweet before sharing it.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={message}
            onChange={handleMessageChange}
            className="min-h-[150px] p-4"
            placeholder="Enter your tweet here..."
            maxLength={charLimit}
          />
          <div className="mt-2 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <p>
                Keep your message concise and impactful for better engagement.
              </p>
            </div>
            <Badge 
              variant={charCount > charLimit ? "destructive" : "outline"}
              className={charCount > charLimit * 0.9 ? "bg-orange-100 text-orange-800" : ""}
            >
              {charCount}/{charLimit}
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || !message.trim() || charCount > charLimit}
            className="bg-[#1DA1F2] hover:bg-[#1a94da] text-white"
          >
            {isSharing ? "Sharing..." : "Share to Twitter/X"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareToTwitterModal;