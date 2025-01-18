import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  const handleMonitor = async () => {
    if (!walletAddress) {
      alert("Please enter a wallet address!");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("https://mon-kohl.vercel.app/api/monitor", { walletAddress });
      setTransactions(response.data.transactions);
      setPolling(true); // Start polling
      setLoading(false);
    } catch (error) {
      console.error("Error starting wallet monitor:", error);
      setLoading(false);
    }
  };

  // Polling to check for new transactions every 10 seconds
  useEffect(() => {
    if (polling) {
      const interval = setInterval(async () => {
        try {
          const response = await axios.post("https://mon-kohl.vercel.app/api/monitor", { walletAddress });
          setTransactions(response.data.transactions);
        } catch (error) {
          console.error("Error fetching new transactions:", error);
        }
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval); // Clean up polling on unmount or stop
    }
  }, [polling, walletAddress]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Live Solana Wallet Monitor</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Enter Solana Wallet Address"
          className="p-2 border rounded mr-2"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
        <button
          onClick={handleMonitor}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Monitor Wallet
        </button>
      </div>

      {loading && <p>Loading...</p>}

      <div className="space-y-4">
        {transactions.map((tx, index) => (
          <div key={index} className="p-4 bg-gray-100 rounded shadow">
            <p><strong>Transaction ID:</strong> {tx.transaction.signatures[0]}</p>
            <p><strong>Block Time:</strong> {new Date(tx.blockTime * 1000).toLocaleString()}</p>
            <p><strong>Slot:</strong> {tx.slot}</p>
            <p><strong>Status:</strong> {tx.meta.err ? "Failed" : "Success"}</p>
            <p><strong>Transaction Details:</strong></p>
            <pre>{JSON.stringify(tx.transaction.message.instructions, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;