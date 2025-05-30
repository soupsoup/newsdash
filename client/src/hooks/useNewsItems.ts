import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { NewsItem, InsertNewsItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import React from "react";

export function useNewsItems() {
  const { toast } = useToast();

  const {
    data: newsItems,
    isLoading,
    error,
    refetch: refetchNewsItems,
  } = useQuery<NewsItem[], Error>({
    queryKey: ["/api/news"],
    retry: 2,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/news");
      if (!response.ok) {
        throw new Error("Failed to fetch news items");
      }
      return response.json();
    }
  });

  // Show error toast when query fails
  React.useEffect(() => {
    if (error) {
      console.error("Error fetching news items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch news items. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const addNewsItem = useMutation({
    mutationFn: async (newsItem: InsertNewsItem) => {
      const response = await apiRequest("POST", "/api/news", newsItem);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add news item');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "Success",
        description: "News item added successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error adding news item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add news item",
        variant: "destructive",
      });
    }
  });

  const updateNewsItem = useMutation({
    mutationFn: async ({ id, ...data }: Partial<NewsItem> & { id: number }) => {
      const response = await apiRequest("PATCH", `/api/news/${id}`, data);
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update news item');
      }
      
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "Success",
        description: "News item updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating news item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update news item",
        variant: "destructive",
      });
    }
  });

  const shareNewsItem = useMutation({
    mutationFn: async ({ id, platforms }: { id: number; platforms: string[] }) => {
      const response = await apiRequest(
        "POST",
        `/api/news/${id}/share`,
        { platforms }
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to share news item');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "Success",
        description: "News item shared successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error sharing news item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to share news item",
        variant: "destructive",
      });
    }
  });

  const deleteNewsItem = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/news/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete news item');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "Success",
        description: "News item deleted successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error deleting news item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete news item",
        variant: "destructive",
      });
    }
  });

  return {
    newsItems,
    isLoading,
    error,
    refetchNewsItems,
    addNewsItem,
    updateNewsItem,
    shareNewsItem,
    deleteNewsItem,
  };
}
