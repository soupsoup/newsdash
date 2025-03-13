import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NewsCard from "@/components/NewsCard";
import { useNewsItems } from "@/hooks/useNewsItems";
import { useToast } from "@/hooks/use-toast";
import ShareToDiscordModal from "@/components/modals/ShareToDiscordModal";
import ShareToNitterModal from "@/components/modals/ShareToNitterModal";
import ShareToWordPressModal from "@/components/modals/ShareToWordPressModal";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { NewsItem } from "@shared/schema";

const NewsFeed = () => {
  const { newsItems, isLoading, refetchNewsItems } = useNewsItems();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  
  // State for sharing modals
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [isTwitterModalOpen, setIsTwitterModalOpen] = useState(false);
  const [isWordPressModalOpen, setIsWordPressModalOpen] = useState(false);

  const handleShareNews = (newsId: number) => {
    // Find the news item
    const newsItem = newsItems?.find(item => item.id === newsId);
    if (newsItem) {
      setSelectedNewsItem(newsItem);
      // Open sharing options menu with platform choices
      document.getElementById(`share-dropdown-${newsId}`)?.click();
    } else {
      toast({
        title: "Error",
        description: "News item not found",
        variant: "destructive",
      });
    }
  };

  const handleEditNews = (newsId: number) => {
    toast({
      title: "Edit News",
      description: `Editing news item #${newsId}`,
    });
  };

  const handleRefresh = () => {
    refetchNewsItems();
    toast({
      title: "Refreshing",
      description: "Fetching latest news items",
    });
  };

  // Sort and filter news items
  const filteredNews = newsItems
    ? newsItems
        .filter(
          (item) =>
            (searchTerm === "" || 
             item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
             item.content.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterSource === "all" || item.sourceType === filterSource)
        )
        // Sort by publishedAt date, newest first
        // Handle future dates by putting them at the top
        .sort((a, b) => {
          const dateA = new Date(a.publishedAt);
          const dateB = new Date(b.publishedAt);
          const now = new Date();
          
          // If both dates are in the future, keep them in their original order
          const aIsFuture = dateA > now;
          const bIsFuture = dateB > now;
          
          if (aIsFuture && bIsFuture) {
            return 0;
          }
          
          // If only one date is in the future, prioritize it
          if (aIsFuture) return -1;
          if (bIsFuture) return 1;
          
          // Otherwise normal descending date sort
          return dateB.getTime() - dateA.getTime();
        })
    : [];

  // Extract unique source types
  const sources = newsItems
    ? Array.from(new Set(newsItems.map((item) => item.sourceType)))
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#212121]">News Feed</h1>
        <p className="text-[#757575]">View and manage all news items from your sources</p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-icons text-gray-400">search</span>
          </span>
          <Input
            type="text"
            placeholder="Search news items..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-48">
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          className="bg-[#1976d2] text-white hover:bg-[#1565c0] w-full sm:w-auto"
          onClick={handleRefresh}
        >
          <span className="material-icons text-sm mr-1">refresh</span>
          <span>Refresh</span>
        </Button>
      </div>

      {/* News Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNews.map((news) => (
            <div key={news.id} className="relative">
              <NewsCard 
                news={news} 
                onShare={handleShareNews}
                onEdit={handleEditNews}
              />
              
              {/* Hidden dropdown trigger for share platforms */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    id={`share-dropdown-${news.id}`} 
                    className="hidden"
                  >
                    Share
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px]">
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      setSelectedNewsItem(news);
                      setIsDiscordModalOpen(true);
                    }}
                  >
                    <span className="material-icons text-[#5865F2] mr-2">discord</span> 
                    <span>Share to Discord</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      setSelectedNewsItem(news);
                      setIsTwitterModalOpen(true);
                    }}
                  >
                    <span className="material-icons text-[#1DA1F2] mr-2">flutter_dash</span> 
                    <span>Share to Nitter</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      setSelectedNewsItem(news);
                      setIsWordPressModalOpen(true);
                    }}
                  >
                    <span className="material-icons text-[#21759b] mr-2">wordpress</span> 
                    <span>Share to WordPress</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <span className="material-icons text-4xl text-[#757575]">article</span>
          <h3 className="mt-4 text-xl font-medium text-[#212121]">No News Items Found</h3>
          <p className="mt-2 text-[#757575]">
            {newsItems && newsItems.length > 0
              ? "Try adjusting your search or filters"
              : "Connect to a news source to start aggregating news"}
          </p>
        </div>
      )}

      {/* Share Modals */}
      <ShareToDiscordModal 
        isOpen={isDiscordModalOpen}
        onClose={() => setIsDiscordModalOpen(false)}
        newsItem={selectedNewsItem}
      />
      
      <ShareToNitterModal
        isOpen={isTwitterModalOpen}
        onClose={() => setIsTwitterModalOpen(false)}
        newsItem={selectedNewsItem}
      />
      
      <ShareToWordPressModal
        isOpen={isWordPressModalOpen} 
        onClose={() => setIsWordPressModalOpen(false)}
        newsItem={selectedNewsItem}
      />
    </div>
  );
};

export default NewsFeed;
