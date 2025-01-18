// /api/monitor.js
import { PublicKey } from "@solana/web3.js";

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || "https://api.helius.xyz/v0/addresses/{address}/transactions/?api-key=YOUR_API_KEY";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { walletAddresses } = req.body;

  // Validate walletAddresses
  if (!Array.isArray(walletAddresses) || walletAddresses.length === 0) {
    return res.status(400).json({ error: "walletAddresses must be an array with at least one address" });
  }

  try {
    const allTransactions = await Promise.all(
      walletAddresses.map(async (walletAddress) => {
        try {
          // Validate the wallet address
          new PublicKey(walletAddress); // This will throw if invalid
          
          // Replace {address} in the URL with the actual wallet address
          const apiUrl = HELIUS_RPC_URL.replace("{address}", walletAddress);
          
          // Fetch transactions directly from Helius API
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const transactions = await response.json();
          
          // Format the response to match your existing structure
          return {
            walletAddress,
            transactions: transactions.map(tx => ({
              signature: tx.signature,
              blockTime: tx.timestamp,
              transactionDetails: tx.instructions || [],
              status: tx.success ? "Success" : "Failed",
            }))
          };
        } catch (error) {
          console.error(`Error processing wallet ${walletAddress}:`, error);
          return { walletAddress, transactions: [] };
        }
      })
    );

    return res.status(200).json({ wallets: allTransactions });
  } catch (error) {
    console.error("Error fetching Solana transactions:", error);
    return res.status(500).json({ error: "Error fetching transactions" });
  }
}