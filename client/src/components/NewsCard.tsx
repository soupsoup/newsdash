import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NewsItem } from '@shared/schema';

interface NewsCardProps {
  news: NewsItem;
  onShare?: (newsId: number) => void;
  onEdit?: (newsId: number) => void;
}

const NewsCard = ({ news, onShare, onEdit }: NewsCardProps) => {
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Check if the date is in the future (more than 1 hour ahead)
    // This can happen with incorrectly timestamped data
    if (date.getTime() > now.getTime() + (60 * 60 * 1000)) {
      return "Recently"; // Display generic text for future-dated items
    }
    
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours === 1) {
      return "1 hour ago";
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleShare = async () => {
    try {
      if (onShare) {
        onShare(news.id);
      } else {
        toast({
          title: "Sharing...",
          description: "This functionality is not yet implemented",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share news item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(news.id);
    } else {
      toast({
        title: "Edit",
        description: "Edit functionality not yet implemented",
      });
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Badge variant="outline" className="bg-[rgba(25,118,210,0.1)] text-[#1976d2] mr-2">
            {news.sourceType}
          </Badge>
          <span className="text-[#757575] text-xs">
            {formatTimestamp(news.publishedAt)}
          </span>
          <div className="ml-auto relative">
            <button 
              onClick={toggleMenu}
              className="text-[#757575] hover:text-[#1976d2]"
            >
              <span className="material-icons text-sm cursor-pointer">more_vert</span>
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-1 bg-white shadow-lg rounded-lg w-36 py-1 z-10">
                <button 
                  onClick={handleEdit}
                  className="w-full text-left px-3 py-1 hover:bg-gray-100 text-sm"
                >
                  Edit
                </button>
                <button 
                  onClick={handleShare}
                  className="w-full text-left px-3 py-1 hover:bg-gray-100 text-sm"
                >
                  Share
                </button>
                <button 
                  className="w-full text-left px-3 py-1 hover:bg-gray-100 text-sm text-[#f44336]"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        
        <h3 className="font-medium text-[#212121] mb-2">{news.title}</h3>
        <div className="text-xs text-gray-500 mb-2">
          {new Date(news.publishedAt).toLocaleString()}
        </div>
        
        <p className="text-[#757575] text-sm mb-4">
          {news.content}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button 
              onClick={handleEdit}
              className="flex items-center text-sm text-[#757575] hover:text-[#1976d2]"
            >
              <span className="material-icons text-sm mr-1">edit</span>
              <span>Edit</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center text-sm text-[#757575] hover:text-[#1976d2]"
            >
              <span className="material-icons text-sm mr-1">share</span>
              <span>Share</span>
            </button>
          </div>
          
          <div className="flex space-x-1">
            {Array.isArray(news.sharedTo) && news.sharedTo.includes("discord") ? (
              <div className="w-6 h-6 rounded-full bg-[#2196f3] flex items-center justify-center text-white" title="Shared to Discord">
                <span className="material-icons text-sm">discord</span>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500" title="Not shared to Discord">
                <span className="material-icons text-sm">discord</span>
              </div>
            )}
            
            {Array.isArray(news.sharedTo) && news.sharedTo.includes("twitter") ? (
              <div className="w-6 h-6 rounded-full bg-[#2196f3] flex items-center justify-center text-white" title="Shared to Twitter">
                <span className="material-icons text-sm">flutter_dash</span>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500" title="Not shared to Twitter">
                <span className="material-icons text-sm">flutter_dash</span>
              </div>
            )}
            
            {Array.isArray(news.sharedTo) && news.sharedTo.includes("wordpress") ? (
              <div className="w-6 h-6 rounded-full bg-[#2196f3] flex items-center justify-center text-white" title="Shared to WordPress">
                <span className="material-icons text-sm">wordpress</span>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500" title="Not shared to WordPress">
                <span className="material-icons text-sm">wordpress</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsCard;
