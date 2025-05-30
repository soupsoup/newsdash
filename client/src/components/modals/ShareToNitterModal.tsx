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
import { NewsItem } from '@shared/schema';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShareToNitterModalProps {
  newsItem: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ShareToNitterModal = ({ newsItem, isOpen, onClose }: ShareToNitterModalProps) => {
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const charLimit = 280;

  const handleClose = () => {
    setMessage("");
    setError(null);
    onClose();
  };

  // Set default message when news item changes
  React.useEffect(() => {
    if (newsItem) {
      // Create a default post with truncated content if needed
      const title = newsItem.title;
      const remainingChars = charLimit - title.length - 5; // 5 chars for spacing and ellipsis
      
      let postContent = title;
      if (remainingChars > 30) {
        // Add some content if we have space
        const truncatedContent = newsItem.content.substring(0, remainingChars - 3) + (newsItem.content.length > remainingChars ? '...' : '');
        postContent = `${title}\n\n${truncatedContent}`;
      }
      
      setMessage(postContent);
      setCharCount(postContent.length);
    }
  }, [newsItem, charLimit]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    setCharCount(newMessage.length);
    setError(null); // Clear any previous errors when user types
  };

  const handleShare = async () => {
    if (!newsItem) return;

    setIsSharing(true);
    setError(null);
    try {
      // Call Nitter share API
      const response = await apiRequest(
        "POST",
        "/api/integrations/nitter/share",
        { newsId: newsItem.id, message }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share to Nitter');
      }

      if (data.status === 'success') {
        toast({
          title: "Success",
          description: "News item shared to Nitter successfully",
        });

        // Invalidate news cache to reflect updated share status
        queryClient.invalidateQueries({ queryKey: ['/api/news'] });
        
        handleClose();
      } else if (data.status === 'error') {
        setError(data.error || 'Failed to share to Nitter');
        toast({
          title: "Error",
          description: data.error || "Failed to share to Nitter. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Nitter share error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to share to Nitter';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
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
          <DialogTitle>Share to Nitter</DialogTitle>
          <DialogDescription>
            Customize your post before sharing it.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Textarea
            value={message}
            onChange={handleMessageChange}
            className="min-h-[150px] p-4"
            placeholder="Enter your Nitter post here..."
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
            {isSharing ? "Sharing..." : "Share to Nitter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareToNitterModal;