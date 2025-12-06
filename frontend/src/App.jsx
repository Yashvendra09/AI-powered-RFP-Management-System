// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import RfpList from './components/RfpList';
import CreateRfp from './components/CreateRfp';
import Vendors from './components/Vendors';
import RfpDetail from './components/RfpDetail';
import { ToastProvider, useToast } from './components/Toast';
import { request } from './api/api';

/**
 * --- UI/UX DESIGN GUIDANCE FOR EXTERNAL AI TOOL ---
 *
 * This section describes the visual design, mirroring the mockup provided
 * in the conversation history, to guide an image-to-code AI (like Glimmer or Locofy).
 *
 * 1. Global Theme: Modern, clean, and slightly glossy/glassmorphism.
 * 2. Background: Soft gradient from light blue/indigo (top-left) to light cyan (bottom-right).
 * 3. Cards (Glassmorphism):
 * - Style: bg-white/50, backdrop-blur-sm, rounded-2xl.
 * - Border: subtle border border-white/30.
 * - Shadow: shadow-xl.
 * 4. Primary Buttons (Glossy Gradient):
 * - Gradient: Linear from Indigo-600 to Cyan-400.
 * - Hover Effect: Subtly lift the button (y: -1) and scale up (scale: 1.02) using Framer Motion.
 * 5. Layout: All views are centered with max-width of 7xl.
 * 6. RFP Detail View:
 * - Desktop: 2/3 width for content (description, JSON, comparison).
 * - Desktop: 1/3 width for Action Panel (Vendor Checklist, Send, Compare, Simulate) which should be sticky (top-20).
 *
 * The components below implement this design using Tailwind CSS and Framer Motion.
 *
 * -----------------------------------------------------------------
 */

function MainApp() {
  const [currentView, setCurrentView] = useState('rfpList');
  const [selectedRfpId, setSelectedRfpId] = useState(null);
  
  // Vendors are managed in global state here to ensure RfpDetail has the latest list
  const [vendors, setVendors] = useState([]); 
  const [isVendorLoading, setIsVendorLoading] = useState(true);
  const toast = useToast();

  const fetchVendors = async () => {
    setIsVendorLoading(true);
    try {
      // Using the API service wrapper
      const data = await request('/api/vendors', { method: 'GET' });
      setVendors(data);
    } catch (e) {
      // Use toast for error display
      toast.error('Could not load vendors list for global state.');
    } finally {
        setIsVendorLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []); 
  
  // Function passed to Vendors component to trigger a global list refresh
  const refetchVendorsList = () => {
      fetchVendors();
  };


  const renderView = () => {
    switch (currentView) {
      case 'rfpDetail':
        if (!selectedRfpId) {
          setCurrentView('rfpList');
          return null;
        }
        // Pass vendors list and refetch function
        return <RfpDetail 
                  rfpId={selectedRfpId} 
                  setView={setCurrentView} 
                  vendors={vendors} 
                  refetchVendorsList={refetchVendorsList}
                  key={selectedRfpId} // Key ensures component remounts for new ID
                />;
      case 'createRfp':
        return <CreateRfp 
                  setView={setCurrentView} 
                  setSelectedRfpId={setSelectedRfpId}
                />;
      case 'vendors':
        return <Vendors 
                  refetchVendorsList={refetchVendorsList}
                  // Vendors component manages its own fetch state, but we provide the means to update global state
                />;
      case 'rfpList':
      default:
        // RfpList manages its own list fetching
        return <RfpList 
                  setView={setCurrentView} 
                  setSelectedRfpId={setSelectedRfpId}
                />;
    }
  };

  return (
    <>
      <Navbar currentView={currentView} setView={setCurrentView} />
      <main className="min-h-[calc(100vh-64px)] pb-12">
        {renderView()}
      </main>
    </>
  );
}

// Export the main component wrapped in the ToastProvider
export default function App() {
    return (
        <ToastProvider>
            <MainApp />
        </ToastProvider>
    )
}