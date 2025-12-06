// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Zap, Server } from 'lucide-react';
import { request, BASE_URL } from '../api/api';

/**
 * Application navigation bar with API status check.
 */
export default function Navbar({ currentView, setView }) {
  const [isApiReachable, setIsApiReachable] = useState(null); // null=checking, true=ok, false=error

  useEffect(() => {
    let isMounted = true;
    const checkApi = async () => {
      // Non-blocking, light check by trying to fetch the RFP list
      try {
        await request('/api/rfps', { method: 'GET' });
        if (isMounted) {
          setIsApiReachable(true);
        }
      } catch (e) {
        if (isMounted) {
          setIsApiReachable(false);
        }
      }
    };

    checkApi();
    return () => {
      isMounted = false;
    };
  }, []);

  const pingColor = isApiReachable === true 
    ? 'bg-green-500' 
    : isApiReachable === false 
      ? 'bg-red-500' 
      : 'bg-yellow-500 animate-pulse';

  const navItemClass = (view) => 
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      currentView === view 
        ? 'bg-indigo-100 text-indigo-700 font-semibold' 
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white/70 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and App Title */}
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-indigo-600 mr-2" />
            <span className="text-xl font-extrabold text-gray-900">AI RFP MVP</span>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={() => setView('rfpList')} 
              className={navItemClass('rfpList')}
            >
              RFPs
            </button>
            <button 
              onClick={() => setView('vendors')} 
              className={navItemClass('vendors')}
            >
              Vendors
            </button>
          </div>
          
          {/* API Status */}
          <div className="flex items-center">
            <div className="flex items-center text-sm text-gray-600 font-medium">
              <Server size={16} className="mr-1 hidden sm:inline" />
              <span className="hidden sm:inline">API Status:</span>
              <span className="sm:hidden">API:</span>
              <div 
                className={`ml-1 h-3 w-3 rounded-full ${pingColor} transition-colors duration-300`} 
                title={isApiReachable === true ? 'API OK' : isApiReachable === false ? `API Error - Check ${BASE_URL}` : 'Checking...'}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}