import React, { createContext, useContext, useState, useEffect } from 'react';
import { SparePart, Transaction, TransactionType, TransactionStatus, User } from '../types';
import { MOCK_PARTS } from '../constants';

interface InventoryContextType {
  parts: SparePart[];
  transactions: Transaction[];
  addPart: (part: SparePart) => void;
  updatePart: (id: string, updates: Partial<SparePart>) => void;
  deletePart: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus, approver?: User) => void;
  getPartById: (id: string) => SparePart | undefined;
  resetData: (confirm?: boolean) => Promise<void>;
  saveSnapshot: () => void;
  restoreSnapshot: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from LocalStorage or Seed
  useEffect(() => {
    const savedParts = localStorage.getItem('slop_store_parts');
    const savedTransactions = localStorage.getItem('slop_store_transactions');

    if (savedParts) {
      try {
        setParts(JSON.parse(savedParts));
      } catch (e) {
        console.error("Failed to parse parts from local storage", e);
        setParts(MOCK_PARTS);
      }
    } else {
      setParts(MOCK_PARTS);
    }

    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (e) {
        console.error("Failed to parse transactions from local storage", e);
        setTransactions([]);
      }
    }
    
    setIsInitialized(true);
  }, []);

  // Persist Parts
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('slop_store_parts', JSON.stringify(parts));
    }
  }, [parts, isInitialized]);

  // Persist Transactions
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('slop_store_transactions', JSON.stringify(transactions));
    }
  }, [transactions, isInitialized]);

  // --- Actions ---

  const resetData = async (confirm = true) => {
    if (confirm && !window.confirm("WARNING: This will wipe the local data and restore FACTORY DEFAULTS (Mock Data). Are you sure?")) {
        return;
    }
    
    setParts(MOCK_PARTS);
    setTransactions([]);
    
    if (confirm) alert("System reset to Factory Defaults.");
  };

  const saveSnapshot = async () => {
    if (!window.confirm("Save current inventory state as the new Restore Point?")) return;
    
    try {
        const snapshot = {
            savedAt: new Date().toISOString(),
            parts: parts,
            transactions: transactions
        };
        localStorage.setItem('slop_store_snapshot', JSON.stringify(snapshot));
        alert("Snapshot saved successfully.");
    } catch (e) {
        console.error("Snapshot failed:", e);
        alert("Failed to save snapshot.");
    }
  };

  const restoreSnapshot = async () => {
    if (!window.confirm("WARNING: This will overwrite current inventory with the last SAVED SNAPSHOT. Continue?")) return;

    try {
        const snapStr = localStorage.getItem('slop_store_snapshot');
        
        if (!snapStr) {
            alert("No saved snapshot found.");
            return;
        }

        const data = JSON.parse(snapStr);
        setParts(data.parts || []);
        setTransactions(data.transactions || []);
        
        alert(`Restored snapshot from ${new Date(data.savedAt).toLocaleString()}`);

    } catch (e) {
        console.error("Restore failed:", e);
        alert("Failed to restore snapshot.");
    }
  };

  const addPart = (part: SparePart) => {
    setParts(prev => [...prev, part]);
  };

  const updatePart = (id: string, updates: Partial<SparePart>) => {
    setParts(prev => prev.map(p => p.id === id ? {
        ...p,
        ...updates,
        lastUpdated: new Date().toISOString()
      } : p));
  };

  const deletePart = (id: string) => {
    setParts(prev => prev.filter(p => p.id !== id));
  };

  const getPartById = (id: string) => parts.find(p => p.id === id);

  const addTransaction = (txData: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newId = `TX-${Date.now()}`;
    const newTx: Transaction = {
      ...txData,
      id: newId,
      timestamp: new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);

    // Handle auto-updates for completed/approved transactions (e.g. self-approved or simple transactions)
    if (newTx.status === TransactionStatus.COMPLETED || newTx.status === TransactionStatus.APPROVED) {
        let delta = 0;
        if (newTx.type === TransactionType.IN) delta = newTx.quantity;
        else if (newTx.type === TransactionType.OUT) delta = -newTx.quantity;
        
        if (delta !== 0) {
           updatePartQuantity(newTx.partId, delta);
        }
    }
  };

  // Helper to update part quantity safely
  const updatePartQuantity = (partId: string, delta: number) => {
      setParts(prevParts => prevParts.map(p => {
          if (p.id === partId) {
              return { 
                  ...p, 
                  quantity: Math.max(0, p.quantity + delta),
                  lastUpdated: new Date().toISOString()
              };
          }
          return p;
      }));
  };

  const updateTransactionStatus = (id: string, newStatus: TransactionStatus, approver?: User) => {
    setTransactions(prev => {
        const txIndex = prev.findIndex(t => t.id === id);
        if (txIndex === -1) return prev;
        
        const tx = prev[txIndex];
        // If already in that status, ignore
        if (tx.status === newStatus) return prev;

        const updatedTx = { 
            ...tx, 
            status: newStatus,
            approverName: approver?.name || tx.approverName
        };
        
        const newTransactions = [...prev];
        newTransactions[txIndex] = updatedTx;

        // Perform side effects for status change
        // We defer state updates to parts to avoid conflicts, or call them directly as they are separate atoms of state
        if (tx.status === TransactionStatus.PENDING && newStatus === TransactionStatus.APPROVED) {
            let delta = 0;
            if (tx.type === TransactionType.IN) delta = tx.quantity;
            else if (tx.type === TransactionType.OUT) delta = -tx.quantity;

            if (delta !== 0) {
                // We need to call setParts. Since this is inside setTransactions callback, 
                // we should be careful. However, React event handlers batch these.
                // To be safe and clean, we execute side effect logic outside the reducer if possible,
                // but here we just call the helper which uses its own functional update.
                setTimeout(() => updatePartQuantity(tx.partId, delta), 0);
            }

            if (tx.type === TransactionType.CREATE && tx.partData) {
                 setTimeout(() => addPart(tx.partData!), 0);
            }
        }
        
        // Add approval log if approver exists
        if (approver) {
             const logId = `LOG-${Date.now()}`;
             const logEntry: Transaction = {
                id: logId,
                partId: tx.partId,
                userId: approver.id,
                userName: approver.name,
                type: TransactionType.APPROVAL,
                quantity: 0,
                timestamp: new Date().toISOString(),
                status: TransactionStatus.COMPLETED,
                relatedTransactionId: id,
                note: `${newStatus} transaction ${id} (${tx.type})`
            };
            // Add log to top
            newTransactions.unshift(logEntry);
        }

        return newTransactions;
    });
  };

  return (
    <InventoryContext.Provider value={{ 
        parts, 
        transactions, 
        addPart, 
        updatePart, 
        deletePart, 
        addTransaction, 
        updateTransactionStatus, 
        getPartById, 
        resetData,
        saveSnapshot,
        restoreSnapshot
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within InventoryProvider");
  return context;
};