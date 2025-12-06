// src/components/RfpList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Search, Send } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { request } from '../api/api';
import { useToast } from './Toast';

/**
 * Displays the list of RFPs with search and quick actions.
 */
export default function RfpList({ setView, setSelectedRfpId }) {
  const [rfps, setRfps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchRfps = async () => {
    setIsLoading(true);
    try {
      const data = await request('/api/rfps', { method: 'GET' });
      // Sort by creation date (newest first)
      const sortedRfps = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRfps(sortedRfps);
    } catch (e) {
      toast.error('Failed to load RFPs. Check API connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRfps();
  }, []);

  const filteredRfps = useMemo(() => {
    return rfps.filter(rfp => {
      const term = searchTerm.toLowerCase();
      return rfp.title?.toLowerCase().includes(term) ||
             rfp.description?.toLowerCase().includes(term)
    });
  }, [rfps, searchTerm]);

  const handleOpenRfp = (rfpId) => {
    setSelectedRfpId(rfpId);
    setView('rfpDetail');
  };

  const RfpCard = ({ rfp }) => (
    <Card hoverable className="flex flex-col justify-between h-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 truncate mb-1">{rfp.title || `RFP ${rfp._id?.substring(0, 8)}`}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{rfp.description || 'No description provided.'}</p>
        <p className="text-xs text-gray-400 mt-2">
          Created: {new Date(rfp.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex space-x-3 mt-auto">
        <Button 
          onClick={() => handleOpenRfp(rfp._id)}
          className="flex-1"
        >
          <FileText size={16} className="mr-1" /> Open
        </Button>
        <Button 
          secondary
          onClick={() => handleOpenRfp(rfp._id)} // Opens detail view, where 'Send' happens
          className="flex-1 bg-cyan-500/80 hover:bg-cyan-600"
        >
          <Send size={16} className="mr-1" /> Send
        </Button>
      </div>
    </Card>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1 
      } 
    },
  };

  const itemVariants = { 
    hidden: { y: 20, opacity: 0 }, 
    visible: { y: 0, opacity: 1 } 
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">RFP List</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search Input */}
        <div className="relative flex-grow">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 transition-shadow shadow-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search RFPs"
          />
        </div>
        
        {/* Create New RFP Button */}
        <Button 
          onClick={() => setView('createRfp')}
          className="flex items-center justify-center md:w-auto w-full min-w-40"
        >
          <Plus size={20} className="mr-2" /> Create New RFP
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 p-8">Loading RFPs...</p>
      ) : filteredRfps.length === 0 ? (
        <p className="text-center text-gray-500 p-8">No RFPs found matching "{searchTerm}". Try creating one!</p>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredRfps.map((rfp) => (
            <motion.div key={rfp._id} variants={itemVariants}>
              <RfpCard rfp={rfp} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}