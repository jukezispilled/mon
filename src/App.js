import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [monitoredWallets, setMonitoredWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleMonitor = async () => {
    if (!walletAddress) {
      alert("Please enter a wallet address!");
      return;
    }

    setLoading(true);

    // Add the wallet address to the monitored list
    setMonitoredWallets((prev) => [...prev, walletAddress]);
    setWalletAddress(""); // Reset the input field

    // Poll for transaction updates every 10 seconds for the new wallet
    setInterval(async () => {
      try {
        const response = await axios.post("https://mon-kohl.vercel.app//api/monitor", {
          walletAddresses: monitoredWallets,
        });

        // Update the transactions for the wallets being monitored
        setMonitoredWallets((prev) => {
          return prev.map((walletAddress) => {
            const walletData = response.data.wallets.find(
              (wallet) => wallet.walletAddress === walletAddress
            );
            return {
              ...walletData,
              transactions: walletData.transactions,
            };
          });
        });
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    }, 10000); // Poll every 10 seconds
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Solana Wallet Monitor</h1>

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
        {monitoredWallets.map((wallet, index) => (
          <div key={index} className="p-4 bg-gray-100 rounded shadow">
            <h2 className="text-xl font-bold">{wallet.walletAddress}</h2>
            {wallet.transactions?.map((tx, idx) => (
              <div key={idx} className="mt-4">
                <p><strong>Transaction ID:</strong> {tx.signature}</p>
                <p><strong>Block Time:</strong> {new Date(tx.blockTime * 1000).toLocaleString()}</p>
                <p><strong>Status:</strong> {tx.status}</p>
                <pre>{JSON.stringify(tx.transactionDetails, null, 2)}</pre>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;