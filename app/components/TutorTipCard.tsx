"use client";

import { useTipTutor } from "@/utils/useContractHooks";
import { useState } from "react";
// import { useTipTutor } from "@/hooks/useContractHooks";


interface Props {
  tutorName: string;
  tutorAddress: string;
}

export function TutorTipCard({ tutorName, tutorAddress }: Props) {
  const { sendTip, isPending, tipHash, error } = useTipTutor();
  const [amount, setAmount] = useState("");

  const handleTip = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    sendTip(tutorAddress, amount);
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white max-w-sm">
      <h3 className="font-bold text-lg mb-2">Tip {tutorName}</h3>
      <p className="text-gray-600 text-sm mb-4">
        Support your tutor directly with ETH.
      </p>

      <div className="flex gap-2 mb-3">
        <div className="relative grow">
          <span className="absolute left-3 top-2 text-gray-500">Ξ</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            step="0.001"
            min="0"
            disabled={isPending}
            className="w-full pl-7 pr-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          onClick={handleTip}
          disabled={isPending || !amount}
          className={`px-4 py-2 rounded font-medium text-white transition-colors ${
            isPending || !amount
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isPending ? "Sending..." : "Send Tip"}
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-2 bg-red-50 text-red-600 text-sm rounded">
          ⚠️ {error}
        </div>
      )}
      
      {tipHash && (
        <div className="p-2 bg-green-50 text-green-700 text-sm rounded break-all">
          ✅ <b>Sent!</b> <br />
          <a 
            href={`https://sepolia.etherscan.io/tx/${tipHash}`} 
            target="_blank" 
            rel="noreferrer"
            className="underline"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
}