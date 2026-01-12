import React from 'react';
import { STORE_LAYOUT } from '../constants';
import { useInventory } from '../contexts/InventoryContext';
import { Package } from 'lucide-react';

interface StoreLayoutProps {
  onSelectArea: (areaId: string) => void;
  selectedArea: string | null;
}

export const StoreLayout: React.FC<StoreLayoutProps> = ({ onSelectArea, selectedArea }) => {
  const { parts } = useInventory();

  // Calculate grid dimensions
  const maxRow = Math.max(...STORE_LAYOUT.map(a => a.row));
  const maxCol = Math.max(...STORE_LAYOUT.map(a => a.col));

  const getAreaStats = (areaId: string) => {
    const areaParts = parts.filter(p => p.area === areaId);
    return {
      count: areaParts.length,
      lowStock: areaParts.filter(p => p.quantity <= p.minLevel).length
    };
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <Package className="w-5 h-5" />
        Store Layout Map
      </h3>
      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${maxRow}, minmax(120px, auto))`
        }}
      >
        {STORE_LAYOUT.map(area => {
          const stats = getAreaStats(area.id);
          const isSelected = selectedArea === area.id;
          
          return (
            <div
              key={area.id}
              onClick={() => onSelectArea(area.id)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden group
                ${isSelected 
                  ? 'border-brand-600 bg-brand-50 shadow-md transform scale-[1.02]' 
                  : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                }
                ${stats.lowStock > 0 ? 'border-red-300 bg-red-50' : ''}
              `}
              style={{ gridRow: area.row, gridColumn: area.col }}
            >
              <div className="flex flex-col h-full justify-between z-10 relative">
                <span className="font-bold text-gray-700">{area.id}</span>
                <span className="text-sm text-gray-500">{area.name}</span>
                <div className="mt-2 text-xs flex gap-2">
                  <span className="bg-gray-200 px-2 py-1 rounded text-gray-700">
                    {stats.count} Items
                  </span>
                  {stats.lowStock > 0 && (
                     <span className="bg-red-200 text-red-800 px-2 py-1 rounded animate-pulse">
                     {stats.lowStock} Low
                   </span>
                  )}
                </div>
              </div>
              {/* Decorative background icon */}
              <Package className="absolute -bottom-2 -right-2 w-16 h-16 text-gray-200/50 group-hover:text-brand-200/50 transition-colors" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
