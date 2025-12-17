"use client";

import { useSmartSession } from "@/utils/useSmartSession";
import { useState } from "react";

export default function TipCard() {
  const {
    requestSession,
    executeTip,
    isReady,
    userAddress,
    smartAccountAddress,
  } = useSmartSession();

  const [recipient, setRecipient] = useState("");
  // CHANGED: Default value removed (empty string)
  const [amount, setAmount] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Copy states
  const [isOwnerCopied, setIsOwnerCopied] = useState(false);
  const [isSmartCopied, setIsSmartCopied] = useState(false);

  const copyToClipboard = (text: string | null, setCopied: (v: boolean) => void) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setStatus("Requesting permissions...");
      await requestSession();
      setStatus(null);
    } catch (err) {
      console.error(err);
      setStatus("Connection failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleTip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Basic Validation
    if (!recipient) return alert("Please enter a wallet address");
    if (!amount || isNaN(parseFloat(amount))) return alert("Please enter a valid amount");

    try {
      setLoading(true);
      setStatus("Sending tip... (Smart Wallet paying gas)");
      
      const txHash = await executeTip(recipient, amount);
      setStatus(`Success! Tx: ${txHash}`);

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "";

      // 2. Enhanced Error Handling
      if (
        errorMessage.includes("0xb5863604") || // The "Out of Gas" error code
        errorMessage.includes("AA21") ||       
        errorMessage.includes("prefund")
      ) {
        setStatus("⚠️ Error: Smart Wallet out of Gas. Please send ETH to the Smart Wallet address above!");
      } else if (errorMessage.includes("period limit")) {
        setStatus("⚠️ Error: Daily spending limit reached.");
      } else {
        setStatus(`Error: ${errorMessage.slice(0, 60)}...`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-md mx-auto bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4">One-Click Tipping 💸</h2>

      {!isReady ? (
        <div className="text-center">
          <p className="text-gray-500 mb-4 text-sm">
            Enable a session to tip users instantly without signing every transaction.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Enable Smart Tipping"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleTip} className="space-y-4">
          
          {/* 1. Linked Owner */}
          <div className="bg-green-50 p-2 rounded-lg text-xs text-green-700 flex justify-between items-center border border-green-200">
            <div className="flex flex-col">
              <span className="font-bold text-[10px] uppercase text-green-800">Owner (MetaMask)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(userAddress, setIsOwnerCopied)}
                  className="hover:text-green-900"
                >
                  {isOwnerCopied ? "✓" : "📋"}
                </button>
              </div>
            </div>
            {/* <button type="button" onClick={clearSession} className="underline hover:text-green-900">
              Disconnect
            </button> */}
          </div>

          {/* 2. Smart Wallet (The Robot) */}
          <div className="bg-amber-50 p-2 rounded-lg text-xs text-amber-700 border border-amber-200">
             <div className="flex flex-col">
              <span className="font-bold text-[10px] uppercase text-amber-800">Smart Wallet (Gas Payer)</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono truncate w-48">{smartAccountAddress || "Loading..."}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(smartAccountAddress, setIsSmartCopied)}
                  className="hover:text-amber-900 font-bold text-sm"
                  title="Copy Full Address"
                >
                  {isSmartCopied ? "✓" : "📋"}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-amber-600 font-medium">
                ⚠️ Send ETH here to pay for gas.
              </p>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Recipient</label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-2 border text-black bg-gray-50 rounded mt-1 font-mono text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Amount (ETH)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border text-black bg-gray-50 rounded mt-1 font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Processing..." : "Send Tip 🚀"}
          </button>
        </form>
      )}

      {status && (
        <div className={`mt-4 p-3 rounded text-xs break-all ${status.includes("Error") ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"}`}>
          {status}
        </div>
      )}
    </div>
  );
}