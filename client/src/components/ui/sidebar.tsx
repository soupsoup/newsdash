import { Link, useLocation } from "wouter";
import { useSidebar } from "@/contexts/SidebarContext";

const Sidebar = () => {
  const [location] = useLocation();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  
  const isActive = (path: string) => {
    return location === path;
  };

  const sidebarClassName = `bg-white w-64 h-full shadow-md ${
    isSidebarOpen ? "block fixed z-20 top-0 left-0 w-64" : "hidden"
  } md:block overflow-y-auto`;

  return (
    <aside className={sidebarClassName}>
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-[#1976d2] flex items-center">
          <span className="material-icons mr-2">rss_feed</span>
          NewsHub
        </h1>
      </div>

      <nav className="p-2">
        <p className="text-xs uppercase text-[#757575] font-medium tracking-wider mt-4 mb-2 ml-2">
          Dashboard
        </p>
        
        <Link 
          href="/" 
          className={`sidebar-item flex items-center p-3 text-[#212121] rounded-lg hover:bg-gray-100 ${
            isActive("/") ? "active border-l-4 border-[#1976d2] bg-[rgba(25,118,210,0.1)]" : ""
          }`}
        >
          <span className="material-icons mr-3 text-[#1976d2]">dashboard</span>
          <span>Overview</span>
        </Link>
        
        <Link 
          href="/news-feed" 
          className={`sidebar-item flex items-center p-3 text-[#212121] rounded-lg hover:bg-gray-100 ${
            isActive("/news-feed") ? "active border-l-4 border-[#1976d2] bg-[rgba(25,118,210,0.1)]" : ""
          }`}
        >
          <span className="material-icons mr-3">article</span>
          <span>News Feed</span>
        </Link>
        
        <Link 
          href="/distribution" 
          className={`sidebar-item flex items-center p-3 text-[#212121] rounded-lg hover:bg-gray-100 ${
            isActive("/distribution") ? "active border-l-4 border-[#1976d2] bg-[rgba(25,118,210,0.1)]" : ""
          }`}
        >
          <span className="material-icons mr-3">share</span>
          <span>Distribution</span>
        </Link>
        
        <p className="text-xs uppercase text-[#757575] font-medium tracking-wider mt-6 mb-2 ml-2">
          Admin
        </p>
        
        <Link 
          href="/integrations" 
          className={`sidebar-item flex items-center p-3 text-[#212121] rounded-lg hover:bg-gray-100 ${
            isActive("/integrations") ? "active border-l-4 border-[#1976d2] bg-[rgba(25,118,210,0.1)]" : ""
          }`}
        >
          <span className="material-icons mr-3">settings_input_component</span>
          <span>Integrations</span>
        </Link>
        
        <Link 
          href="/data-sources" 
          className={`sidebar-item flex items-center p-3 text-[#212121] rounded-lg hover:bg-gray-100 ${
            isActive("/data-sources") ? "active border-l-4 border-[#1976d2] bg-[rgba(25,118,210,0.1)]" : ""
          }`}
        >
          <span className="material-icons mr-3">source</span>
          <span>Data Sources</span>
        </Link>
        
        <Link 
          href="/settings" 
          className={`sidebar-item flex items-center p-3 text-[#212121] rounded-lg hover:bg-gray-100 ${
            isActive("/settings") ? "active border-l-4 border-[#1976d2] bg-[rgba(25,118,210,0.1)]" : ""
          }`}
        >
          <span className="material-icons mr-3">settings</span>
          <span>Settings</span>
        </Link>
        
        <Link 
          href="/discord-integrations" 
          className={`sidebar-item flex items-center p-3 text-[#212121] rounded-lg hover:bg-gray-100 ${
            isActive("/discord-integrations") ? "active border-l-4 border-[#1976d2] bg-[rgba(25,118,210,0.1)]" : ""
          }`}
        >
          <span className="material-icons mr-3">discord</span>
          <span>Discord Integrations</span>
        </Link>
      </nav>
      
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-[#4caf50] mr-2"></div>
          <span className="text-sm">All systems operational</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
