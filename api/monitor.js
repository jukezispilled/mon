import { Connection, PublicKey } from "@solana/web3.js";

// Initialize the Solana connection
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

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
        // Ensure walletAddress is a valid PublicKey string
        if (!PublicKey.isOnCurve(walletAddress)) {
          throw new Error(`Invalid wallet address: ${walletAddress}`);
        }

        const publicKey = new PublicKey(walletAddress);

        // Fetch recent transaction signatures for the wallet address
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });

        // Fetch details of each transaction
        const transactions = await Promise.all(
          signatures.map(async (signatureInfo) => {
            const transaction = await connection.getParsedTransaction(signatureInfo.signature);
            if (!transaction) return null;

            return {
              signature: signatureInfo.signature,
              blockTime: transaction.blockTime,
              transactionDetails: transaction.transaction.message.instructions,
              status: transaction.meta.err ? "Failed" : "Success",
            };
          })
        );

        return { walletAddress, transactions: transactions.filter((tx) => tx !== null) };
      })
    );

    return res.status(200).json({ wallets: allTransactions });
  } catch (error) {
    console.error("Error fetching Solana transactions:", error);
    return res.status(500).json({ error: "Error fetching transactions" });
  }
}