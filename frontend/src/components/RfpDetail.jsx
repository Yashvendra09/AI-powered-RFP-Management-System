// src/components/RfpDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Send, FileText, TrendingUp, CheckCircle, XCircle, Info, Zap } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { request } from '../api/api';
import { useToast } from './Toast';

/**
 * Displays full RFP details, vendor selection, sending, and proposal comparison.
 */
export default function RfpDetail({ rfpId, setView, vendors, refetchVendorsList }) {
  const [rfp, setRfp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [sendResults, setSendResults] = useState(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const toast = useToast();

  const vendorMap = useMemo(() => {
    return vendors.reduce((acc, v) => {
      acc[v._id] = v;
      return acc;
    }, {});
  }, [vendors]);

  // --- Fetch RFP Details ---
  useEffect(() => {
    if (!rfpId) return;
    const fetchRfp = async () => {
      setIsLoading(true);
      try {
        // GET /api/rfps/:id
        const data = await request(`/api/rfps/${rfpId}`, { method: 'GET' });
        setRfp(data);
      } catch (e) {
        toast.error('Failed to load RFP details. Returning to list.');
        setView('rfpList');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRfp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfpId]); 

  // --- Vendor Selection Handler ---
  const handleVendorToggle = (vendorId) => {
    setSelectedVendors((prev) => 
      prev.includes(vendorId) 
        ? prev.filter((id) => id !== vendorId) 
        : [...prev, vendorId]
    );
  };

  // --- Send RFP Handler ---
  const handleSendRfp = async () => {
    if (selectedVendors.length === 0) {
      toast.info('Please select at least one vendor to send the RFP to.');
      return;
    }
    setIsSending(true);
    try {
      // POST /api/rfps/:id/send
      const data = await request(`/api/rfps/${rfpId}/send`, {
        method: 'POST',
        body: { vendorIds: selectedVendors, message: `RFP document for ${rfp.title}.` },
      });
      setSendResults(data.results);
      toast.success(`RFP sent successfully to ${data.results.length} vendors!`);
    } catch (e) {
      toast.error(e.message || 'Failed to send RFP.');
    } finally {
      setIsSending(false);
    }
  };

  // --- Compare Proposals Handler ---
  const handleCompareProposals = async () => {
    setIsComparing(true);
    setComparisonResult(null);
    try {
      // GET /api/rfps/:id/compare
      const data = await request(`/api/rfps/${rfpId}/compare`, { method: 'GET' });
      setComparisonResult(data);
      toast.success('AI Comparison complete! Results are below.');
    } catch (e) {
      toast.error(e.message || 'Failed to compare proposals. Ensure vendors have replied.');
    } finally {
      setIsComparing(false);
    }
  };

  // --- Simulate Reply Handler ---
  const handleSimulateReply = async (e) => {
    e.preventDefault();
    const vendorEmail = e.target.elements.vendorEmail.value;
    const subject = e.target.elements.subject.value;
    const body = e.target.elements.body.value;
    
    setIsSimulateModalOpen(false);
    toast.info('Simulating vendor reply...');

    try {
      // POST /api/inbound/email
      const data = await request('/api/inbound/email', {
        method: 'POST',
        body: { 
            from: vendorEmail, 
            subject, 
            body, 
            rfpId,
            // Include dummy data to simulate a complex proposal (optional)
            attachments: [{ filename: "proposal.pdf", text: "Simulated price: $45000. Delivery: 4 weeks." }]
        },
      });
      
      if (data.ok && data.proposal) {
        toast.success(`Simulated reply from ${vendorEmail} processed! Proposal found.`);
      } else {
         toast.error(`Simulated reply processed, but no proposal was parsed.`);
      }
    } catch (e) {
      toast.error(e.message || 'Simulated reply failed.');
    }
  };

  if (isLoading || !rfp) {
    return <p className="text-center p-8 text-gray-500">Loading RFP details...</p>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 sm:mb-0">{rfp.title}</h1>
        <Button onClick={() => setView('rfpList')} secondary>Back to List</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Panel: RFP Details and Comparison Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Description */}
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Description</h2>
            <p className="text-gray-600">{rfp.description || "No detailed description provided."}</p>
            <p className="text-xs text-gray-400 mt-4">RFP ID: {rfpId}</p>
          </Card>

          {/* Structured AI Output */}
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Structured AI Output (JSON)</h2>
            <pre className="bg-gray-800 text-green-400 p-4 rounded-xl overflow-x-auto text-sm shadow-inner max-h-96">
              {JSON.stringify(rfp.structured, null, 2)}
            </pre>
          </Card>
          
          {/* Comparison Results */}
          {comparisonResult && (
            <Card className="border-cyan-400 bg-cyan-50/70">
              <h2 className="text-2xl font-bold text-cyan-700 mb-4 flex items-center">
                <TrendingUp size={24} className="mr-2" /> AI Comparison & Recommendations
              </h2>
              
              <p className="text-lg font-semibold text-gray-800 mb-3">AI Explanation:</p>
              <p className="text-gray-700 italic mb-6 p-3 bg-white/70 rounded-lg border border-cyan-200">
                {comparisonResult.aiExplanation || "No detailed AI explanation provided."}
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-2">Scored Proposals:</h3>
              <div className="space-y-3">
                {comparisonResult.recommendations.sort((a, b) => b.finalScore - a.finalScore).map((rec, index) => (
                  <div key={index} className={`p-4 rounded-xl shadow-md flex justify-between items-center transition-all ${index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white/90 border border-gray-100'}`}>
                    <div>
                      <span className="font-bold text-lg">{rec.vendorName}</span>
                      {index === 0 && <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-400 text-white shadow-md">Recommended</span>}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-indigo-600">${rec.price?.toLocaleString() || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Final Score: <span className="font-bold text-indigo-700">{rec.finalScore}%</span></p>
                    </div>
                  </div>
                ))}
              </div>

            </Card>
          )}

        </div>
        
        {/* Right Panel: Actions (Sticky) */}
        <div className="lg:col-span-1 lg:sticky lg:top-20 h-fit space-y-6">
          
          {/* Send RFP Action Card */}
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Select Vendors & Send</h2>
            
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4 p-1 -m-1 border rounded-lg border-gray-200/50">
              {vendors.length === 0 && <p className="text-sm text-gray-500 p-2">No vendors found. Add them in the Vendors tab.</p>}
              {vendors.map((vendor) => (
                <div 
                  key={vendor._id} 
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedVendors.includes(vendor._id) 
                      ? 'bg-indigo-100 border border-indigo-300' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleVendorToggle(vendor._id)}
                  role="checkbox"
                  aria-checked={selectedVendors.includes(vendor._id)}
                >
                  <span className="font-medium text-gray-700">{vendor.name}</span>
                  {selectedVendors.includes(vendor._id) && <CheckCircle size={18} className="text-indigo-600 flex-shrink-0" />}
                </div>
              ))}
            </div>

            <Button 
              onClick={handleSendRfp} 
              disabled={isSending || selectedVendors.length === 0}
              className="w-full"
            >
              {isSending ? 'Sending...' : <><Send size={20} className="mr-2" /> Send RFP to ({selectedVendors.length})</>}
            </Button>
            
            {/* Send Results Summary */}
            {sendResults && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-semibold text-sm mb-2 text-gray-700">Send Status:</p>
                    <ul className="text-xs space-y-1">
                        {sendResults.map((res, i) => (
                            <li key={i} className={`flex items-center ${res.ok ? 'text-green-600' : 'text-red-600'}`}>
                                {res.ok ? <CheckCircle size={14} className="mr-1 flex-shrink-0" /> : <Info size={14} className="mr-1 flex-shrink-0" />}
                                <span className="truncate">
                                    {vendorMap[res.vendorId]?.name || 'Unknown'}: {res.ok ? 'Success' : `Failed (${res.messageId || 'API Error'})`}
                                </span>
                                {res.previewUrl && <a href={res.previewUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline hover:text-indigo-500 flex-shrink-0">Preview</a>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </Card>
          
          {/* Comparison Action Card */}
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">2. Compare Proposals</h2>
            <p className="text-sm text-gray-600 mb-4">Once replies are received, run the AI comparison engine.</p>
            <Button 
              onClick={handleCompareProposals} 
              disabled={isComparing} 
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              secondary
            >
              {isComparing ? 'Comparing...' : <><Zap size={20} className="mr-2" /> Run AI Comparison</>}
            </Button>
          </Card>

          {/* Simulate Action Card (for demo) */}
          <Card className="bg-yellow-50/50 border-yellow-300">
            <h2 className="text-xl font-bold text-yellow-800 mb-3">DEMO: Simulate Reply</h2>
            <p className="text-sm text-yellow-700 mb-4">Use this to simulate a vendor sending an email proposal to this RFP.</p>
            <Button 
              onClick={() => {
                // Pre-populate modal fields if a vendor is available
                const firstVendor = vendors.find(v => !selectedVendors.includes(v._id));
                if (firstVendor) {
                    const vendorEmailInput = document.getElementById('simulate-vendorEmail');
                    const subjectInput = document.getElementById('simulate-subject');
                    if (vendorEmailInput) vendorEmailInput.value = firstVendor.email;
                    if (subjectInput) subjectInput.value = `Proposal for ${rfp.title} (RFP ${rfpId.substring(0, 6)})`;
                }
                setIsSimulateModalOpen(true);
              }}
              className="w-full bg-yellow-600 hover:bg-yellow-700 shadow-yellow-400/50"
              secondary
            >
              Simulate Vendor Email
            </Button>
          </Card>

        </div>
      </div>
      
      {/* Simulate Modal */}
      <Modal isOpen={isSimulateModalOpen} onClose={() => setIsSimulateModalOpen(false)} title="Simulate Vendor Reply">
        <form onSubmit={handleSimulateReply} className="space-y-4">
          <input
            id="simulate-vendorEmail"
            name="vendorEmail"
            type="email"
            placeholder="Vendor Email (e.g., vendor@example.com)"
            required
            className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            id="simulate-subject"
            name="subject"
            type="text"
            placeholder={`Subject line (e.g., Proposal for RFP ${rfpId.substring(0, 6)})`}
            required
            className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
          <textarea
            name="body"
            rows="6"
            placeholder="Email Body (Include key details like total price and delivery time to simulate a valid proposal)"
            required
            className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
          <Button type="submit" className="w-full">Submit Simulated Reply</Button>
        </form>
      </Modal>

    </div>
  );
}