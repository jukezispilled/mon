// /api/monitor.js
import { Connection, PublicKey } from "@solana/web3.js";

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";

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
    // Initialize Solana connection
    const connection = new Connection(HELIUS_RPC_URL, "confirmed");

    const allTransactions = await Promise.all(
      walletAddresses.map(async (walletAddress) => {
        try {
          const publicKey = new PublicKey(walletAddress);
          
          // Get recent signatures
          const signatures = await connection.getSignaturesForAddress(
            publicKey,
            { limit: 10 }
          );

          // Get transaction details
          const transactions = await Promise.all(
            signatures.map(async (sig) => {
              try {
                const tx = await connection.getParsedTransaction(sig.signature);
                return {
                  signature: sig.signature,
                  blockTime: sig.blockTime,
                  transactionDetails: tx?.transaction?.message?.instructions || [],
                  status: tx?.meta?.err ? "Failed" : "Success",
                };
              } catch (error) {
                console.error(`Error fetching transaction ${sig.signature}:`, error);
                return null;
              }
            })
          );

          return {
            walletAddress,
            transactions: transactions.filter(Boolean)
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