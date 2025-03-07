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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NewsItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShareToWordPressModalProps {
  newsItem: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ShareToWordPressModal = ({ newsItem, isOpen, onClose }: ShareToWordPressModalProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("news");
  const [status, setStatus] = useState("draft");
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setTitle("");
    setContent("");
    setCategory("news");
    setStatus("draft");
    onClose();
  };

  // Set default content when news item changes
  React.useEffect(() => {
    if (newsItem) {
      setTitle(newsItem.title);
      setContent(newsItem.content);
    }
  }, [newsItem]);

  const handleShare = async () => {
    if (!newsItem) return;

    setIsSharing(true);
    try {
      // Call WordPress share API
      const response = await apiRequest(
        "POST",
        "/api/integrations/wordpress/share",
        { 
          newsId: newsItem.id, 
          title,
          content,
          category,
          status
        }
      );

      toast({
        title: "Success",
        description: `News item shared to WordPress as ${status}`,
      });

      // Invalidate news cache to reflect updated share status
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
      
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share to WordPress. Please try again.",
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
          <DialogTitle>Share to WordPress</DialogTitle>
          <DialogDescription>
            Edit the post content before publishing to your WordPress site.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-title">Post Title</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-content">Post Content</Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] p-4"
              placeholder="Enter post content..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="post-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="post-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="markets">Markets</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-status">Publication Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="post-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Save as Draft</SelectItem>
                  <SelectItem value="publish">Publish Immediately</SelectItem>
                  <SelectItem value="pending">Submit for Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || !title.trim() || !content.trim()}
            className="bg-[#21759b] hover:bg-[#1d6586] text-white"
          >
            {isSharing ? "Sharing..." : status === "publish" ? "Publish to WordPress" : "Save to WordPress"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareToWordPressModal;