import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// Replace with the environment variable for the Helius API key
const HELIUS_RPC_URL = "https://solana-api.helius.xyz/v0/transactions"; // Helius RPC URL
const HELIUS_API_KEY = process.env.HELIUS_API_KEY; // Use the API key from the environment variables

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
        // Validate wallet address format
        if (!/^[1-9A-HJ-NP-Za-km-zA-HJ-NP-Z1-9]{32,44}$/.test(walletAddress)) {
          throw new Error(`Invalid wallet address: ${walletAddress}`);
        }

        try {
          // Fetch recent transactions from Helius API for each wallet
          const response = await axios.get(HELIUS_RPC_URL, {
            params: {
              publicKey: walletAddress,
              apiKey: HELIUS_API_KEY,  // API key passed from environment variable
              limit: 10,
            },
          });

          const transactions = response.data.transactions.map((tx) => {
            return {
              signature: tx.signature,
              blockTime: tx.blockTime,
              transactionDetails: tx.transaction.message.instructions,
              status: tx.meta.err ? "Failed" : "Success",
            };
          });

          return { walletAddress, transactions };
        } catch (error) {
          console.error(`Error fetching transactions for ${walletAddress}:`, error);
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