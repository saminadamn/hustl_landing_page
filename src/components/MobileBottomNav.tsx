import React, { useState } from 'react';
import { Home, Package, MessageSquare, User, Plus, Menu, X, Bell, Wallet, HelpCircle, Shield, History, Zap, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StarBorder } from './ui/star-border';

interface MobileBottomNavProps {
  activeTab: string;
  onCreateTask: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onCreateTask }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  const handleMenuItemClick = (event: React.MouseEvent, action: () => void) => {
    event.preventDefault();
    action();
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleMoreMenu}>
          <div 
            className="absolute bottom-16 inset-x-0 bg-white rounded-t-xl shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">More Options</h3>
              <button onClick={toggleMoreMenu} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={(e) => handleMenuItemClick(e, () => window.dispatchEvent(new CustomEvent('open-wallet')))}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
              >
                <Wallet className="w-6 h-6 text-[#0038FF] mb-1" />
                <span className="text-xs">Wallet</span>
              </button>
              
              <button 
                onClick={(e) => handleMenuItemClick(e, () => window.dispatchEvent(new CustomEvent('open-notifications')))}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
              >
                <Bell className="w-6 h-6 text-[#0038FF] mb-1" />
                <span className="text-xs">Notifications</span>
              </button>
              
              <button 
                onClick={(e) => handleMenuItemClick(e, () => window.dispatchEvent(new CustomEvent('set-profile-tab', { detail: { tab: 'history' } })))}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
              >
                <History className="w-6 h-6 text-[#0038FF] mb-1" />
                <span className="text-xs">History</span>
              </button>
              
              <button 
                onClick={(e) => handleMenuItemClick(e, () => window.dispatchEvent(new CustomEvent('open-safety')))}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
              >
                <Shield className="w-6 h-6 text-[#0038FF] mb-1" />
                <span className="text-xs">Safety</span>
              </button>
              
              <button 
                onClick={(e) => handleMenuItemClick(e, () => window.dispatchEvent(new CustomEvent('open-faq')))}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
              >
                <HelpCircle className="w-6 h-6 text-[#0038FF] mb-1" />
                <span className="text-xs">Help</span>
              </button>
              
              <button 
                onClick={(e) => handleMenuItemClick(e, () => window.dispatchEvent(new CustomEvent('set-profile-tab', { detail: { tab: 'premium' } })))}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
              >
                <Zap className="w-6 h-6 text-[#0038FF] mb-1" />
                <span className="text-xs">Premium</span>
              </button>
              
              <button 
                onClick={(e) => handleMenuItemClick(e, () => window.dispatchEvent(new CustomEvent('open-language-settings')))}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
              >
                <Settings className="w-6 h-6 text-[#0038FF] mb-1" />
                <span className="text-xs">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg flex justify-between">
        <button 
          onClick={() => activeTab !== 'home' && window.dispatchEvent(new CustomEvent('set-profile-tab', { detail: { tab: 'home' } }))}
          className={`flex-1 flex flex-col items-center justify-center py-2 ${
            activeTab === 'home' ? 'text-[#0038FF]' : 'text-gray-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Home</span>
        </button>
        
        <button 
          onClick={() => activeTab !== 'tasks' && window.dispatchEvent(new CustomEvent('set-profile-tab', { detail: { tab: 'tasks' } }))}
          className={`flex-1 flex flex-col items-center justify-center py-2 ${
            activeTab === 'tasks' ? 'text-[#0038FF]' : 'text-gray-500'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-xs mt-1">Tasks</span>
        </button>
        
        <div className="flex-1 flex flex-col items-center -mt-5">
          <StarBorder color="#FF5A1F">
            <button
              onClick={onCreateTask}
              className="bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B] text-white p-3 rounded-full shadow-lg"
            >
              <Plus className="w-6 h-6" />
            </button>
          </StarBorder>
          <span className="text-xs mt-1">Create</span>
        </div>
        
        <button 
          onClick={() => activeTab !== 'messages' && window.dispatchEvent(new CustomEvent('set-profile-tab', { detail: { tab: 'messages' } }))}
          className={`flex-1 flex flex-col items-center justify-center py-2 ${
            activeTab === 'messages' ? 'text-[#0038FF]' : 'text-gray-500'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs mt-1">Messages</span>
        </button>
        
        <button 
          onClick={toggleMoreMenu}
          className={`flex-1 flex flex-col items-center justify-center py-2 ${
            showMoreMenu ? 'text-[#0038FF]' : 'text-gray-500'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs mt-1">More</span>
        </button>
      </div>
    </>
  );
};

export default MobileBottomNav;