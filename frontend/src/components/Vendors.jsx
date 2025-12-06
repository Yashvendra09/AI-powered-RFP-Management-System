// src/components/Vendors.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, User, Mail, Trash2 } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { request } from '../api/api';
import { useToast } from './Toast';

/**
 * Manages the list of vendors (Create and List).
 */
export default function Vendors({ refetchVendorsList }) {
  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({ name: '', email: '', contactPerson: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const data = await request('/api/vendors', { method: 'GET' });
      setVendors(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      toast.error('Failed to load vendors list.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!newVendor.name.trim() || !newVendor.email.trim()) {
      toast.info('Name and Email are required.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // POST /api/vendors
      const createdVendor = await request('/api/vendors', {
        method: 'POST',
        body: newVendor,
      });
      setVendors((prev) => [...prev, createdVendor].sort((a, b) => a.name.localeCompare(b.name)));
      setNewVendor({ name: '', email: '', contactPerson: '' });
      toast.success(`Vendor ${createdVendor.name} added successfully.`);
      refetchVendorsList(); // Notify parent to update global state
    } catch (e) {
      toast.error(e.message || 'Failed to create vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVendor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    // NOTE: Assuming DELETE /api/vendors/:id exists, even though not explicitly listed
    try {
      // DELETE /api/vendors/:id (Simulated logic, replace with actual request if needed)
      // await request(`/api/vendors/${id}`, { method: 'DELETE' }); 
      
      // For this MVP, we simulate the delete since the backend contract only defined POST/GET
      setVendors(prev => prev.filter(v => v._id !== id));
      toast.success(`Vendor "${name}" removed (simulated).`);
      refetchVendorsList(); // Notify parent to update global state
    } catch (e) {
      toast.error(e.message || 'Failed to delete vendor.');
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);
  
  const itemVariants = { 
    hidden: { x: -50, opacity: 0 }, 
    visible: { x: 0, opacity: 1 } 
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Vendor Management</h1>

      {/* Add New Vendor Card */}
      <Card className="mb-8 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Plus size={20} className="mr-2 text-indigo-600" /> Add New Vendor
        </h2>
        <form onSubmit={handleCreateVendor} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <input
            type="text"
            placeholder="Name (Required)"
            className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            value={newVendor.name}
            onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
            required
            aria-label="Vendor Name"
          />
          <input
            type="email"
            placeholder="Email (Required)"
            className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            value={newVendor.email}
            onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
            required
            aria-label="Vendor Email"
          />
          <input
            type="text"
            placeholder="Contact Person (Optional)"
            className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            value={newVendor.contactPerson}
            onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
            aria-label="Contact Person"
          />
          <Button type="submit" disabled={isSubmitting} className="min-w-24 h-full py-3">
              {isSubmitting ? 'Adding...' : 'Add Vendor'}
          </Button>
        </form>
      </Card>

      {/* Existing Vendors List */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Existing Vendors ({vendors.length})</h2>
      {isLoading ? (
        <p className="text-center text-gray-500 p-8">Loading vendors...</p>
      ) : (
        <motion.div 
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } }, hidden: {} }}
        >
          {vendors.map((vendor) => (
            <motion.div key={vendor._id} variants={itemVariants}>
                <Card className="p-4 flex justify-between items-center" hoverable>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 flex-shrink-0">
                        <User size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{vendor.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail size={14} className="mr-1" />
                        <a href={`mailto:${vendor.email}`} className="hover:text-indigo-600 transition-colors">{vendor.email}</a>
                        {vendor.contactPerson && <span className="ml-3 text-xs italic">({vendor.contactPerson})</span>}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteVendor(vendor._id, vendor.name)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
                    aria-label={`Delete vendor ${vendor.name}`}
                  >
                    <Trash2 size={20} />
                  </button>
                </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}