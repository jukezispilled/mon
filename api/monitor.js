import { Connection, PublicKey } from "@solana/web3.js";

// Initialize the Solana connection
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  try {
    // Convert the wallet address to a PublicKey object
    const publicKey = new PublicKey(walletAddress);

    // Fetch recent transaction signatures for the given wallet address
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });

    // Fetch details of each transaction
    const transactions = await Promise.all(
      signatures.map(async (signatureInfo) => {
        const transaction = await connection.getParsedTransaction(signatureInfo.signature);
        return transaction;
      })
    );

    // Respond with the transaction data
    return res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error fetching Solana transactions:", error);
    return res.status(500).json({ error: "Error fetching transactions" });
  }
}