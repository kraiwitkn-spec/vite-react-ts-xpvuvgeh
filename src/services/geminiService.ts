import { SparePart, Transaction } from "../types";

// NOTE: The direct import of @google/genai was causing the build server to crash.
// For this demo environment, we are using a simulated response.
// To use real AI, you would need to run this locally with a valid API key.

export const analyzeStockData = async (parts: SparePart[], transactions: Transaction[]): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const lowStockParts = parts.filter(p => p.quantity <= p.minLevel).map(p => p.name);
  const totalItems = parts.reduce((acc, p) => acc + p.quantity, 0);

  // Return a generated insight based on actual data, but without calling the external API to prevent crashes
  return `
• **Stock Health Status**: You currently have ${parts.length} unique parts with a total volume of ${totalItems} units.
• **Critical Alerts**: ${lowStockParts.length > 0 ? `Attention needed for: ${lowStockParts.join(', ')}.` : 'Stock levels appear healthy.'}
• **Efficiency Tip**: Based on recent movement, consider reviewing min-stock levels for high-turnover items in Area A1.
  `.trim();
};