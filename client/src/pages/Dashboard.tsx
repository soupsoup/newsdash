import { useState } from "react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import NewsCard from "@/components/NewsCard";
import AddIntegrationModal from "@/components/modals/AddIntegrationModal";
import { useNewsItems } from "@/hooks/useNewsItems";
import { useIntegration } from "@/contexts/IntegrationContext";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { newsItems, isLoading } = useNewsItems();
  const { integrations } = useIntegration();
  const { toast } = useToast();
  const [showAddIntegrationModal, setShowAddIntegrationModal] = useState(false);

  const handleShareNews = (newsId: number) => {
    toast({
      title: "Sharing News",
      description: `Preparing to share news item #${newsId}`,
    });
  };

  const handleEditNews = (newsId: number) => {
    toast({
      title: "Edit News",
      description: `Editing news item #${newsId}`,
    });
  };

  const getIntegrationStatusBadge = (status: string) => {
    if (status === "connected") {
      return <span className="px-2 py-1 bg-[rgba(76,175,80,0.1)] text-[#4caf50] rounded-full">Connected</span>;
    } else if (status === "error") {
      return <span className="px-2 py-1 bg-[rgba(244,67,54,0.1)] text-[#f44336] rounded-full">Error</span>;
    } else {
      return <span className="px-2 py-1 bg-[rgba(255,152,0,0.1)] text-[#ff9800] rounded-full">Disconnected</span>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#212121]">Dashboard Overview</h1>
        <p className="text-[#757575]">Monitor, manage and distribute your news content</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="News Items" 
          value={newsItems ? newsItems.length : 0} 
          icon="article" 
          iconBgColor="bg-[rgba(25,118,210,0.1)]"
          change={{
            value: "12%",
            isPositive: true
          }}
          changeText="from last week"
        />
        
        <StatsCard 
          title="Shares" 
          value="56" 
          icon="share" 
          iconBgColor="bg-[rgba(3,169,244,0.1)]"
          change={{
            value: "8%",
            isPositive: true
          }}
          changeText="from last week"
        />
        
        <StatsCard 
          title="Active Sources" 
          value={integrations.filter(i => i.isSource).length} 
          icon="hub" 
          iconBgColor="bg-[rgba(33,150,243,0.1)]"
          changeText="No change"
        />
        
        <StatsCard 
          title="Connected Platforms" 
          value={integrations.filter(i => i.isDestination).length} 
          icon="devices" 
          iconBgColor="bg-[rgba(255,152,0,0.1)]"
          change={{
            value: "1",
            isPositive: true
          }}
          changeText="from last week"
        />
      </div>

      {/* Recent News Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#212121]">Recent News</h2>
          <Button 
            variant="link" 
            className="text-[#1976d2] hover:underline flex items-center p-0"
            onClick={() => window.location.href = "/news-feed"}
          >
            <span>View all</span>
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-40 bg-gray-100 animate-pulse rounded-lg"></div>
            <div className="h-40 bg-gray-100 animate-pulse rounded-lg"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {newsItems && newsItems.slice(0, 2).map((news) => (
              <NewsCard 
                key={news.id} 
                news={news} 
                onShare={handleShareNews}
                onEdit={handleEditNews}
              />
            ))}
          </div>
        )}
      </div>

      {/* Integration Status */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#212121]">Integration Status</h2>
          <Button 
            className="bg-[#1976d2] text-white hover:bg-[#1565c0]"
            onClick={() => setShowAddIntegrationModal(true)}
          >
            <span className="material-icons text-sm mr-1">add</span>
            <span>Add New</span>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#757575]">Platform</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#757575]">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#757575]">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#757575]">Last Sync</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#757575]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {integrations.map((integration) => (
                  <tr key={integration.id}>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#2196f3] flex items-center justify-center text-white">
                          <span className="material-icons text-sm">
                            {integration.type === "discord" ? "discord" : 
                             integration.type === "twitter" ? "flutter_dash" : 
                             integration.type === "wordpress" ? "wordpress" : "rss_feed"}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-[#212121]">{integration.type.charAt(0).toUpperCase() + integration.type.slice(1)}</p>
                          <p className="text-[#757575]">{integration.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#212121]">
                      {integration.isSource && integration.isDestination 
                        ? "Source & Destination" 
                        : integration.isSource 
                          ? "Source" 
                          : "Destination"}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {getIntegrationStatusBadge(integration.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#757575]">
                      {integration.lastSyncAt 
                        ? new Date(integration.lastSyncAt).toLocaleString() 
                        : "Never"}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <Button variant="link" className="text-[#1976d2] hover:text-[#1565c0] p-0">
                        Configure
                      </Button>
                    </td>
                  </tr>
                ))}

                {integrations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#757575]">
                      No integrations configured. Click "Add New" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Integration Modal */}
      <AddIntegrationModal
        isOpen={showAddIntegrationModal}
        onClose={() => setShowAddIntegrationModal(false)}
      />
    </div>
  );
};

export default Dashboard;
