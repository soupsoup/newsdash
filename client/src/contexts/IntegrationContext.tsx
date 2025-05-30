import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Integration, InsertIntegration } from '@shared/schema';
import { queryClient } from "@/lib/queryClient";

interface IntegrationContextType {
  integrations: Integration[];
  isLoading: boolean;
  error: Error | null;
  addIntegration: (integration: Omit<InsertIntegration, "createdAt">) => Promise<Integration>;
  updateIntegration: (integration: Integration) => Promise<Integration>;
  deleteIntegration: (id: number) => Promise<void>;
  refreshIntegrations: () => Promise<void>;
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined);

export function IntegrationProvider({ children }: { children: ReactNode }) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/integrations");
      
      if (!response.ok) {
        throw new Error("Failed to fetch integrations");
      }
      
      const data = await response.json();
      setIntegrations(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshIntegrations = async () => {
    await fetchIntegrations();
  };

  const addIntegration = async (integration: Omit<InsertIntegration, "createdAt">) => {
    try {
      const response = await apiRequest("POST", "/api/integrations", integration);
      const newIntegration = await response.json();
      
      setIntegrations(prev => [...prev, newIntegration]);
      await queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      
      return newIntegration;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  const updateIntegration = async (integration: Integration) => {
    try {
      console.log("Updating integration:", integration);
      
      // Create a clean object with only the fields we want to update
      const updateData = {
        id: integration.id,
        name: integration.name,
        isSource: integration.isSource ?? false,
        isDestination: integration.isDestination ?? false,
        apiKey: integration.apiKey ?? null,
        apiSecret: integration.apiSecret ?? null,
        accessToken: integration.accessToken ?? null,
        refreshToken: integration.refreshToken ?? null,
        webhookUrl: integration.webhookUrl ?? null,
        additionalConfig: integration.additionalConfig ?? null
      };
      
      console.log("Clean update data:", updateData);
      
      const response = await apiRequest("PATCH", `/api/integrations/${integration.id}`, updateData);
      const updatedIntegration = await response.json();
      console.log("Updated integration response:", updatedIntegration);
      
      setIntegrations(prev => 
        prev.map(item => item.id === updatedIntegration.id ? updatedIntegration : item)
      );
      await queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      
      return updatedIntegration;
    } catch (err) {
      console.error("Integration update error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  const deleteIntegration = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/integrations/${id}`);
      
      setIntegrations(prev => prev.filter(item => item.id !== id));
      await queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  const value = {
    integrations,
    isLoading,
    error,
    addIntegration,
    updateIntegration,
    deleteIntegration,
    refreshIntegrations,
  };

  return (
    <IntegrationContext.Provider value={value}>
      {children}
    </IntegrationContext.Provider>
  );
}

export function useIntegration() {
  const context = useContext(IntegrationContext);
  if (context === undefined) {
    throw new Error("useIntegration must be used within an IntegrationProvider");
  }
  return context;
}
