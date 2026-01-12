import React, { useState, useEffect } from 'react';
import { Camera, X, ScanLine, Search } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';

interface QRScannerProps {
  onScan: (partId: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(true);
  const [manualId, setManualId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { parts } = useInventory();

  // Simulate camera finding a code after 3 seconds for demo purposes
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (scanning) {
        // Only simulates a scan if we haven't manually entered one
        // In a real app, this would use a library like 'react-qr-reader'
        // For this demo, we let users type the ID or click a 'Simulate Scan' button
    }
    return () => clearTimeout(timer);
  }, [scanning]);

  const handleSimulateScan = () => {
    // Pick a random part or the first one
    if (parts.length > 0) {
        const randomPart = parts[Math.floor(Math.random() * parts.length)];
        onScan(randomPart.id);
    } else {
        setError("No parts in database to simulate scan.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const part = parts.find(p => p.id.toLowerCase() === manualId.toLowerCase());
    if (part) {
        onScan(part.id);
    } else {
        setError(`Part ID '${manualId}' not found.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 z-10 bg-black/50 p-1 rounded-full"
        >
          <X size={24} />
        </button>

        <div className="bg-black h-64 relative flex items-center justify-center">
             {/* Simulated Camera View */}
             <div className="absolute inset-0 opacity-50 bg-[url('https://picsum.photos/seed/camera/600/400')] bg-cover bg-center"></div>
             <div className="relative z-10 border-2 border-brand-500 w-48 h-48 rounded-lg animate-pulse flex flex-col items-center justify-center">
                <ScanLine className="text-brand-500 w-full h-8 animate-bounce" />
                <span className="text-brand-500 text-xs mt-2 font-mono">SCANNING...</span>
             </div>
        </div>

        <div className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 text-center">Scan QR Code on Part</h3>
            
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
                    {error}
                </div>
            )}

            <div className="flex gap-2 justify-center">
                <button 
                    onClick={handleSimulateScan}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Camera size={18} />
                    Simulate Scan
                </button>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">OR TYPE ID</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="Enter Part ID (e.g., P001)"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button 
                    type="submit"
                    className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg"
                >
                    <Search size={18} />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};