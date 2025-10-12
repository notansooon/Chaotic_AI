"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Box,
  FileText,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Activity,
  Database,
  Cpu,
  Menu,
  X,
  FileCode
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navSections = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", url: "/", icon: LayoutDashboard },
    ]
  },
  {
    title: "WORKLOADS",
    items: [
      { name: "Containers", url: "/containers", icon: Box },
      { name: "Runs", url: "/runs", icon: FileText },
    ]
  },
  {
    title: "AGENTS",
    items: [
      { name: "Agents", url: "/agents", icon: Cpu },
      { name: "Templates", url: "/templates", icon: FileCode },
      { name: "Monitoring", url: "/monitoring", icon: Activity },
    ]
  },
  {
    title: "CONFIG",
    items: [
      { name: "Settings", url: "/settings", icon: Settings },
      { name: "Users", url: "/users", icon: Users },
      { name: "Database", url: "/database", icon: Database },
    ]
  }
];

export default function Layout({ children, currentPageName }) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState(["OVERVIEW", "WORKLOADS"]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSection = (title) => {
    setExpandedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Dashboard</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {navSections.map((section) => (
              <div key={section.title} className="mb-4">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span>{section.title}</span>
                  {expandedSections.includes(section.title) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {expandedSections.includes(section.title) && (
                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.url;
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.url}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg
                            text-sm font-medium transition-all duration-200
                            ${isActive 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@dashboard.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
