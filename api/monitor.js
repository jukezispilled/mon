import { PublicKey } from "@solana/web3.js";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY; // Make sure this is set in your .env file

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
          const publicKey = new PublicKey(walletAddress);

          // Use Helius API to fetch transactions
          const response = await fetch(
            `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=10`
          );

          if (!response.ok) {
            throw new Error(`Helius API error: ${response.status}`);
          }

          const data = await response.json();

          // Transform the data to match your frontend's expected format
          const transactions = data.map(tx => ({
            signature: tx.signature,
            blockTime: tx.timestamp ? Math.floor(tx.timestamp / 1000) : null,
            transactionDetails: tx.instructions || [],
            status: tx.success ? "Success" : "Failed"
          }));

          return {
            walletAddress,
            transactions
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