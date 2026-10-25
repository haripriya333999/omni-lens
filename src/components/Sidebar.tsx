import React from 'react';
import {
  Home,
  Eye,
  Search,
  BookOpen,
  Scan,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
} from 'lucide-react';
import { ActiveTask } from '../types';

interface SidebarProps {
  activeTask: ActiveTask;
  onSelectTask: (task: ActiveTask) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTask,
  onSelectTask,
  onOpenSettings,
  onOpenHelp,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'home' as ActiveTask, label: 'Home', icon: Home, accent: '#EC4899', shortcut: 'Esc' },
    { id: 'describe' as ActiveTask, label: 'Describe Surroundings', icon: Eye, accent: '#EC4899', shortcut: 'D' },
    { id: 'find' as ActiveTask, label: 'Find Object', icon: Search, accent: '#F59E0B', shortcut: 'F' },
    { id: 'read' as ActiveTask, label: 'Read Text', icon: BookOpen, accent: '#FBBF24', shortcut: 'R' },
    { id: 'live' as ActiveTask, label: 'Live Detection', icon: Scan, accent: '#10B981', shortcut: 'L' },
  ];

  const handleNavClick = (task: ActiveTask) => {
    onSelectTask(task);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="space-y-4">
        {/* Mobile Header / Desktop Collapse Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2D121F]">
          <div className={`flex items-center gap-2.5 overflow-hidden transition-all ${isCollapsed ? 'lg:hidden' : 'block'}`}>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#EC4899]">
              Navigation
            </span>
          </div>

          {/* Desktop collapse toggle button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl bg-[#220E18] hover:bg-[#2F1322] text-white/70 hover:text-white border border-[#3E1627] transition-all cursor-pointer mx-auto"
              title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
              aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4 text-[#EC4899]" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="space-y-1.5" role="navigation" aria-label="Main Features">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTask === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899] ${
                  isCollapsed ? 'lg:justify-center lg:px-2.5 py-3' : 'gap-3.5 px-3.5 py-3'
                } ${
                  isActive
                    ? 'bg-[#2C121D] text-white border border-[#521E33] shadow-md shadow-[#EC4899]/15'
                    : 'text-[#FAF7F0]/75 hover:text-white hover:bg-[#220E18] border border-transparent'
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={isCollapsed ? `${item.label} (Key: ${item.shortcut})` : undefined}
                aria-label={`${item.label}${isActive ? ' (Current page)' : ''}`}
              >
                <Icon
                  className="w-4.5 h-4.5 shrink-0 transition-colors"
                  style={{ color: isActive ? item.accent : 'currentColor' }}
                />
                <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                  {item.label}
                </span>
                {!isCollapsed && (
                  <kbd className="hidden lg:inline ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-white/50">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings & Help */}
      <div className="pt-4 border-t border-[#2D121F] space-y-1.5">
        <button
          onClick={() => {
            onOpenSettings();
            if (onCloseMobile) onCloseMobile();
          }}
          className={`w-full flex items-center rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-left text-[#FAF7F0]/75 hover:text-white hover:bg-[#220E18] border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899] ${
            isCollapsed ? 'lg:justify-center lg:px-2.5 py-3' : 'gap-3.5 px-3.5 py-3'
          }`}
          title={isCollapsed ? 'Accessibility Settings' : undefined}
          aria-label="Settings"
        >
          <Settings className="w-4.5 h-4.5 shrink-0" />
          <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>Settings</span>
        </button>

        <button
          onClick={() => {
            onOpenHelp();
            if (onCloseMobile) onCloseMobile();
          }}
          className={`w-full flex items-center rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-left text-[#FAF7F0]/75 hover:text-white hover:bg-[#220E18] border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899] ${
            isCollapsed ? 'lg:justify-center lg:px-2.5 py-3' : 'gap-3.5 px-3.5 py-3'
          }`}
          title={isCollapsed ? 'User Manual & Help' : undefined}
          aria-label="User manual and keyboard shortcuts"
        >
          <HelpCircle className="w-4.5 h-4.5 shrink-0" />
          <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>Help</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar with smooth collapse */}
      <aside
        className={`hidden lg:flex flex-col bg-[#160A0F]/90 backdrop-blur-md border-r border-[#2D121F] p-4 shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-60'
        }`}
        aria-label="Main Navigation"
      >
        {navContent}
      </aside>

      {/* 2. Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Slide-out Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#160A0F] border-r border-[#2D121F] p-5 shadow-2xl flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile Navigation Drawer"
      >
        {navContent}
      </aside>
    </>
  );
};

