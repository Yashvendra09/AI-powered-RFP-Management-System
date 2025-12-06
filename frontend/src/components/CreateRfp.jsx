// src/components/CreateRfp.jsx
import React, { useState } from 'react';
import { Send, FileText, Lightbulb, Zap } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { request } from '../api/api';
import { useToast } from './Toast';

/**
 * Form to create a new RFP from natural language text, triggering AI parsing.
 */
export default function CreateRfp({ setView, setSelectedRfpId }) {
  const [nlText, setNlText] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newRfp, setNewRfp] = useState(null);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nlText.trim()) {
      toast.info('Please enter some text for the RFP requirements.');
      return;
    }

    setIsLoading(true);
    setNewRfp(null); // Reset previous result

    try {
      // POST /api/rfps
      const data = await request('/api/rfps', {
        method: 'POST',
        body: { 
            nl_text: nlText, 
            title: title.trim() || undefined // Only send title if provided
        },
      });
      
      setNewRfp(data.rfp);
      setTitle(data.rfp.title || ''); // Update title with AI-generated one if empty
      toast.success(`RFP "${data.rfp.title}" created and parsed successfully!`);
    } catch (e) {
      toast.error(e.message || 'Failed to create RFP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRfp = () => {
    if (newRfp) {
      setSelectedRfpId(newRfp._id);
      setView('rfpDetail');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
        <Lightbulb size={24} className="mr-2 text-indigo-600" /> Create New RFP
      </h1>

      <Card className="mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nl_text" className="block text-sm font-medium text-gray-700 mb-2">
              Natural Language RFP Requirements (Required)
            </label>
            <textarea
              id="nl_text"
              rows="8"
              className="w-full p-4 border border-gray-300 rounded-xl shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              placeholder="E.g., We need 20 high-end laptops (16GB RAM minimum), 15 monitors, and a quote for cloud migration services. Budget is around $50,000. Delivery by Q2 2026."
              value={nlText}
              onChange={(e) => setNlText(e.target.value)}
              required
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Optional Title
            </label>
            <input
              id="title"
              type="text"
              className="w-full p-3 border border-gray-300 rounded-xl shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              placeholder="e.g., Q2 IT Procurement Request"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="min-w-52"
            >
              {isLoading ? 'Creating & Parsing...' : <><Zap size={20} className="mr-2" /> Create (AI Parse)</>}
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Display AI Parsing Result */}
      {newRfp && (
        <Card className="border-cyan-400 bg-cyan-50/70">
          <h2 className="text-xl font-bold text-gray-800 flex items-center mb-3">
            <Zap size={24} className="mr-2 text-cyan-600" /> AI Parsing Result
          </h2>
          <p className="mb-4 text-gray-700">
            RFP created successfully: <span className="font-semibold text-indigo-700">{newRfp.title}</span>
          </p>
          
          <h3 className="text-md font-semibold text-gray-700 mb-2">Structured Requirements (JSON)</h3>
          <pre className="bg-gray-800 text-green-400 p-4 rounded-xl overflow-x-auto text-sm shadow-inner max-h-80">
            {JSON.stringify(newRfp.structured, null, 2)}
          </pre>

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleOpenRfp} 
              secondary 
              className="bg-indigo-600 hover:bg-indigo-700 flex items-center"
            >
              <FileText size={16} className="mr-2" /> View RFP Details
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}