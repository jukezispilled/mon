import React, { useState, useEffect } from "react";

const App = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [monitoredWallets, setMonitoredWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear all intervals when component is unmounted
    return () => {
      monitoredWallets.forEach(wallet => {
        if (wallet.intervalId) {
          clearInterval(wallet.intervalId);
        }
      });
    };
  }, [monitoredWallets]);

  const handleMonitor = async () => {
    if (!walletAddress) {
      alert("Please enter a wallet address!");
      return;
    }

    setLoading(true);

    // Add the wallet address to the monitored list
    const newWallet = { walletAddress, transactions: [] };
    setMonitoredWallets((prev) => [...prev, newWallet]);
    setWalletAddress(""); // Reset the input field

    // Poll for transaction updates every 10 seconds
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch("https://mon-ey7n.vercel.app/api/monitor", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddresses: [newWallet.walletAddress],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Find the wallet data in the response and update transactions
        setMonitoredWallets((prev) =>
          prev.map((wallet) => {
            if (wallet.walletAddress === newWallet.walletAddress) {
              return {
                ...wallet,
                transactions: data.wallets.find(
                  (w) => w.walletAddress === wallet.walletAddress
                ).transactions,
              };
            }
            return wallet;
          })
        );
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    }, 10000); // Poll every 10 seconds

    // Store the intervalId in the wallet object to clear it when necessary
    setMonitoredWallets((prev) =>
      prev.map((wallet) =>
        wallet.walletAddress === newWallet.walletAddress
          ? { ...wallet, intervalId }
          : wallet
      )
    );
  };

  const handleRemoveWallet = (walletToRemove) => {
    setMonitoredWallets((prev) => 
      prev.filter((wallet) => {
        if (wallet.walletAddress === walletToRemove) {
          if (wallet.intervalId) {
            clearInterval(wallet.intervalId);
          }
          return false;
        }
        return true;
      })
    );
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-4">Solana Wallet Monitor</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Enter Solana Wallet Address"
          className="p-2 border rounded mr-2 text-black"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
        <button
          onClick={handleMonitor}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Monitor Wallet
        </button>
      </div>

      {loading && monitoredWallets.length === 0 && (
        <p className="text-blue-400">Loading...</p>
      )}

      <div className="space-y-4">
        {monitoredWallets.map((wallet, index) => (
          <div key={index} className="p-4 bg-gray-800 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-blue-400">{wallet.walletAddress}</h2>
              <button
                onClick={() => handleRemoveWallet(wallet.walletAddress)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
            {wallet.transactions?.length > 0 ? (
              wallet.transactions.map((tx, idx) => (
                <div key={idx} className="mt-4 p-3 bg-gray-700 rounded">
                  <p className="text-green-400"><strong>Transaction ID:</strong> {tx.signature}</p>
                  <p><strong>Block Time:</strong> {new Date(tx.blockTime * 1000).toLocaleString()}</p>
                  <p><strong>Status:</strong> 
                    <span className={tx.status === "Success" ? "text-green-400" : "text-red-400"}>
                      {tx.status}
                    </span>
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-400">Transaction Details</summary>
                    <pre className="mt-2 p-2 bg-gray-900 rounded overflow-x-auto">
                      {JSON.stringify(tx.transactionDetails, null, 2)}
                    </pre>
                  </details>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No transactions found</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;