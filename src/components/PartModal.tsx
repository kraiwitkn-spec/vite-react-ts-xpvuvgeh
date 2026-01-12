import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Box, Upload, ImageIcon, AlertTriangle } from 'lucide-react';
import { SparePart, StoreArea, TransactionType, TransactionStatus } from '../types';
import { STORE_LAYOUT } from '../constants';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';

interface PartModalProps {
  part?: SparePart;
  isOpen: boolean;
  onClose: () => void;
  isReadOnly?: boolean;
}

export const PartModal: React.FC<PartModalProps> = ({ part, isOpen, onClose, isReadOnly = false }) => {
  const { addPart, updatePart, deletePart, addTransaction } = useInventory();
  const { currentUser } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState<Partial<SparePart>>({
    name: '',
    model: '',
    spec: '',
    area: 'A1',
    quantity: 0,
    minLevel: 0,
    imageUrl: ''
  });

  useEffect(() => {
    if (part) {
      setFormData(part);
      setShowDeleteConfirm(false); // Reset delete confirm on open/change
    } else {
      setFormData({
         name: '',
         model: '',
         spec: '',
         area: 'A1',
         quantity: 0,
         minLevel: 5,
         imageUrl: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`
      });
      setShowDeleteConfirm(false);
    }
  }, [part, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (part) {
      // Update existing part (Assuming only Approvers/Admin can reach here via 'Edit')
      updatePart(part.id, formData);
      
      addTransaction({
        partId: part.id,
        userId: currentUser.id,
        userName: currentUser.name,
        type: TransactionType.UPDATE,
        quantity: formData.quantity || 0,
        status: TransactionStatus.COMPLETED
      });
      
      onClose();

    } else {
      // Create new part
      const newPartId = `P${Date.now().toString().slice(-4)}`;
      const newPart = {
        ...formData,
        id: newPartId,
        lastUpdated: new Date().toISOString()
      } as SparePart;

      // CHECK: Does this user need approval?
      if (!currentUser.canApprove) {
          // Send for APPROVAL
          addTransaction({
              partId: newPartId,
              userId: currentUser.id,
              userName: currentUser.name,
              type: TransactionType.CREATE,
              quantity: formData.quantity || 0,
              status: TransactionStatus.PENDING,
              partData: newPart // Attach data for later approval
          });
          alert("New Part Request has been sent to KraiwitN for approval.");
      } else {
          // Direct CREATE
          addPart(newPart);
          addTransaction({
            partId: newPartId,
            userId: currentUser.id,
            userName: currentUser.name,
            type: TransactionType.CREATE,
            quantity: formData.quantity || 0,
            status: TransactionStatus.COMPLETED
          });
          alert("Part added successfully.");
      }
      onClose();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!showDeleteConfirm) {
        setShowDeleteConfirm(true);
        return;
    }

    if (!currentUser || !part) return;

    deletePart(part.id);
    
    // Log Deletion
    addTransaction({
    partId: part.id,
    userId: currentUser.id,
    userName: currentUser.name,
    type: TransactionType.DELETE,
    quantity: part.quantity,
    status: TransactionStatus.COMPLETED
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Box className="text-brand-600" />
            {isReadOnly ? 'Part Details' : (part ? 'Edit Spare Part' : 'Add New Spare Part')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formData.model}
                  onChange={e => setFormData({...formData, model: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specification</label>
                <textarea
                  required
                  disabled={isReadOnly}
                  value={formData.spec}
                  onChange={e => setFormData({...formData, spec: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-gray-100 h-24"
                />
              </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700">Part Image</label>
                 
                 {/* Image Preview Area */}
                 <div className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 overflow-hidden relative group hover:border-brand-400 transition-colors">
                    {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Part Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <span className="text-xs">No image</span>
                        </div>
                    )}
                    
                    {!isReadOnly && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                            <label className="cursor-pointer bg-white text-gray-800 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 hover:bg-gray-100 shadow-sm">
                                <Upload size={14} /> Upload File
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                            <span className="text-white text-[10px] drop-shadow-md">or paste URL below</span>
                        </div>
                    )}
                 </div>

                 {/* URL Input */}
                 {!isReadOnly && (
                    <input
                        type="text"
                        placeholder="...or paste image URL"
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                 )}
               </div>
               
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Area</label>
                <select
                  disabled={isReadOnly}
                  value={formData.area}
                  onChange={e => setFormData({...formData, area: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-gray-100"
                >
                  {STORE_LAYOUT.map(area => (
                    <option key={area.id} value={area.id}>{area.id} - {area.name}</option>
                  ))}
                </select>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  disabled={isReadOnly}
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-gray-100"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stock Level</label>
                <input
                  type="number"
                  min="0"
                  required
                  disabled={isReadOnly}
                  value={formData.minLevel}
                  onChange={e => setFormData({...formData, minLevel: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-gray-100"
                />
             </div>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                {part && (
                    <button 
                        type="button" 
                        onClick={handleDeleteClick}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all mr-auto ${showDeleteConfirm ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-600 hover:bg-red-50'}`}
                    >
                        {showDeleteConfirm ? (
                             <>
                                <AlertTriangle size={18} /> Confirm Delete?
                             </>
                        ) : (
                             <>
                                <Trash2 size={18} /> Delete Part
                             </>
                        )}
                    </button>
                )}
                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg shadow-sm transition-all"
                >
                    <Save size={18} /> 
                    {part ? 'Update Part' : (currentUser?.canApprove ? 'Create Part' : 'Request Creation')}
                </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};