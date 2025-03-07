import { useState } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="flex items-center justify-between p-4">
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-[#212121]"
          onClick={toggleSidebar}
        >
          <span className="material-icons">menu</span>
        </button>
        
        <div className="flex-1 px-4 md:px-8">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="material-icons text-gray-400">search</span>
            </span>
            <input 
              type="text" 
              placeholder="Search news, sources, or configurations..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent" 
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            className="p-1 rounded-full hover:bg-gray-100" 
            title="Notifications"
            onClick={() => toast({
              title: "Notifications",
              description: "You have no new notifications",
            })}
          >
            <span className="material-icons">notifications</span>
          </button>
          
          <div className="relative">
            <button 
              className="flex items-center focus:outline-none" 
              title="User menu"
              onClick={toggleDropdown}
            >
              <div className="w-8 h-8 rounded-full bg-[#1976d2] text-white flex items-center justify-center">
                <span>JD</span>
              </div>
              <span className="material-icons ml-1">arrow_drop_down</span>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 bg-white shadow-lg rounded-lg w-48 py-2 z-10">
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">Profile</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">Account Settings</a>
                <div className="border-t my-1"></div>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100 text-[#f44336]">Sign Out</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
