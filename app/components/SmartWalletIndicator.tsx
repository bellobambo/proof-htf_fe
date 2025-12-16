"use client";

import { useState } from "react";
import { useBalance } from "wagmi"; // 🟢 Import useBalance
import { sepolia } from "viem/chains";
import { CopyOutlined, RobotOutlined, WalletOutlined } from "@ant-design/icons";
import { toast } from "react-hot-toast";
import { useSmartSession } from "@/utils/useSmartSession";

export default function SmartWalletIndicator() {
  const { smartAccountAddress, isReady } = useSmartSession();
  const [isHovered, setIsHovered] = useState(false);

  // 🟢 Fetch Balance for the Smart Account
  const { data: balance } = useBalance({
    address: smartAccountAddress as `0x${string}`,
    chainId: sepolia.id,
    query: {
      enabled: !!smartAccountAddress, // Only fetch if address exists
      refetchInterval: 10000, // Refresh every 10 seconds
    }
  });

  if (!smartAccountAddress) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(smartAccountAddress);
    toast.success("Address copied! Send ETH here to top up.");
  };

  // Helper to format ETH nicely
  const formattedBalance = balance 
    ? (Number(balance.value) / Math.pow(10, balance.decimals)).toFixed(4)
    : "0.0000";

  return (
    <div 
      className="flex items-center gap-3 bg-[#F5F5DC] border-2 border-[#8B4513] rounded-lg px-3 py-1.5 cursor-pointer hover:bg-[#E8E8D0] transition-colors"
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="This is your Session Wallet (Robot). Click to copy address."
    >
      <div className="flex items-center gap-2">
        {/* Status Icon */}
        <div className={`p-1.5 rounded-full flex items-center justify-center ${
            isReady && Number(formattedBalance) > 0 
            ? 'bg-green-100 text-green-700' 
            : 'bg-yellow-100 text-yellow-700'
        }`}>
            <RobotOutlined />
        </div>
        
        {/* Wallet Details */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-[#8B4513] uppercase tracking-wider leading-none">
                Session Wallet
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            {/* Address */}
            <span className="text-xs font-mono text-[#8D6E63]">
                {smartAccountAddress.slice(0, 5)}...{smartAccountAddress.slice(-4)}
            </span>
            
            {/* Separator dot */}
            <div className="w-1 h-1 bg-[#D2B48C] rounded-full"></div>

            {/* 🟢 Balance Display */}
            <span className={`text-xs font-bold font-mono ${
                Number(formattedBalance) === 0 ? 'text-red-500' : 'text-[#5D4037]'
            }`}>
                {formattedBalance} ETH
            </span>
          </div>
        </div>
      </div>

      <div className="h-8 w-[1px] bg-[#D2B48C] mx-1"></div>

      <div className="text-[#8B4513] text-lg">
        {isHovered ? <CopyOutlined /> : <WalletOutlined />}
      </div>
    </div>
  );
}