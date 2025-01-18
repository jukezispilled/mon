import React, { useState } from "react";
import axios from "axios";

const SolanaTransactionMonitor = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleMonitor = async () => {
    if (!walletAddress) {
      alert("Please enter a wallet address!");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/monitor", { walletAddress });
      setTransactions(response.data.transactions);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Solana Wallet Transactions</h1>
      <input
        type="text"
        placeholder="Enter Solana Wallet Address"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
      />
      <button onClick={handleMonitor}>Monitor Wallet</button>

      {loading && <p>Loading...</p>}

      <div>
        {transactions.map((tx, index) => (
          <div key={index}>
            <p><strong>Transaction ID:</strong> {tx.signature}</p>
            <p><strong>Block Time:</strong> {new Date(tx.blockTime * 1000).toLocaleString()}</p>
            <p><strong>Status:</strong> {tx.status}</p>
            <p><strong>Transaction Details:</strong></p>
            <pre>{JSON.stringify(tx.transactionDetails, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SolanaTransactionMonitor;