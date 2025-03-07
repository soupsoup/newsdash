import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { NewsItem, InsertNewsItem } from "@shared/schema";

export function useNewsItems() {
  const {
    data: newsItems,
    isLoading,
    error,
    refetch: refetchNewsItems,
  } = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
  });

  const addNewsItem = useMutation({
    mutationFn: async (newsItem: InsertNewsItem) => {
      const response = await apiRequest("POST", "/api/news", newsItem);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
  });

  const updateNewsItem = useMutation({
    mutationFn: async ({ id, ...data }: Partial<NewsItem> & { id: number }) => {
      const response = await apiRequest("PATCH", `/api/news/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
  });

  const shareNewsItem = useMutation({
    mutationFn: async ({ id, platforms }: { id: number; platforms: string[] }) => {
      const response = await apiRequest(
        "POST",
        `/api/news/${id}/share`,
        { platforms }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
  });

  const deleteNewsItem = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
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
