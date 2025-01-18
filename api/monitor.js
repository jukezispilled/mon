import { PublicKey } from "@solana/web3.js";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { walletAddresses } = req.body;

  if (!Array.isArray(walletAddresses) || walletAddresses.length === 0) {
    return res.status(400).json({ error: "walletAddresses must be an array with at least one address" });
  }

  try {
    const allTransactions = await Promise.all(
      walletAddresses.map(async (walletAddress) => {
        try {
          const publicKey = new PublicKey(walletAddress);

          // Use Helius API to fetch transactions with a higher limit to ensure we get enough successful ones
          const response = await fetch(
            `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=20`
          );

          if (!response.ok) {
            throw new Error(`Helius API error: ${response.status}`);
          }

          const data = await response.json();

          // Filter for successful transactions and transform the data
          const transactions = data
            .filter(tx => tx.success === true) // Only keep successful transactions
            .slice(0, 10) // Take only the 10 most recent successful ones
            .map(tx => ({
              signature: tx.signature,
              blockTime: tx.timestamp ? Math.floor(tx.timestamp / 1000) : null,
              transactionDetails: tx.instructions || [],
              status: "Success" // We know it's always Success now
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