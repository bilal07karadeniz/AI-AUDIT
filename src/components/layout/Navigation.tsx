import React, { useState } from 'react';
import {
  HomeIcon,
  ClockIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  current: boolean;
}

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ currentTab, onTabChange }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      id: 'audit',
      name: 'Current Audit',
      icon: ShieldCheckIcon,
      current: currentTab === 'audit'
    },
    {
      id: 'history',
      name: 'Audit History',
      icon: ClockIcon,
      current: currentTab === 'history'
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: DocumentChartBarIcon,
      current: currentTab === 'reports'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: ChartBarIcon,
      current: currentTab === 'analytics'
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-brand-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                SolidAudit
              </span>
            </div>

            {/* Navigation items */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200',
                      item.current
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onTabChange('settings')}
              className={cn(
                'hidden sm:block p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200',
                currentTab === 'settings' && 'text-brand-600 bg-brand-50'
              )}
            >
              <CogIcon className="h-5 w-5" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className={cn("sm:hidden transition-all duration-300 ease-in-out overflow-hidden", mobileMenuOpen ? "block" : "hidden")}>
        <div className="pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  'block pl-3 pr-4 py-2 text-base font-medium transition-colors duration-200 w-full text-left',
                  item.current
                    ? 'bg-brand-50 border-brand-500 text-brand-700 border-l-4'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-l-4'
                )}
              >
                <Icon className="h-5 w-5 mr-3 inline" />
                {item.name}
              </button>
            );
          })}
          <button
            onClick={() => {
              onTabChange('settings');
              setMobileMenuOpen(false);
            }}
            className={cn(
              'block pl-3 pr-4 py-2 text-base font-medium transition-colors duration-200 w-full text-left',
              currentTab === 'settings'
                ? 'bg-brand-50 border-brand-500 text-brand-700 border-l-4'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-l-4'
            )}
          >
            <CogIcon className="h-5 w-5 mr-3 inline" />
            Settings
          </button>
        </div>
      </div>
    </nav>
  );
}