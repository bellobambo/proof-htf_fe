"use client";

import { useState } from "react";
import { useBalance } from "wagmi";
import { sepolia } from "viem/chains";
import { formatEther } from "viem";
import { RobotOutlined, CopyOutlined, WalletOutlined, ReloadOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { toast } from "react-hot-toast";
import { useSmartAccount } from "./SmartSessionContext";
// import { useSmartAccount } from "@/context/SmartSessionContext";


export default function SmartWalletIndicator() {
  const { smartAccountAddress, isReady, requestSession, clearSmartAccountCache } = useSmartAccount();
  const [isCreating, setIsCreating] = useState(false);

  const { data: balance } = useBalance({
    address: smartAccountAddress as `0x${string}`,
    chainId: sepolia.id,
    query: { enabled: !!smartAccountAddress, refetchInterval: 5000 }
  });

  const formattedBalance = balance ? Number(formatEther(balance.value)).toFixed(4) : "0.0000";

  if (!smartAccountAddress) return <div className="h-10 w-32 animate-pulse bg-stone-200 rounded-lg" />;

  if (!isReady) {
    return (
      <button
        onClick={async () => {
          try {
            setIsCreating(true);
            await requestSession();
            toast.success("Wallet Authorized!");
            
            // Reload the page after successful wallet creation
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            
          } catch (e) {
            toast.error("Authorization failed");
            setIsCreating(false);
          }
        }}
        className="flex items-center cursor-pointer gap-2 bg-[#8B4513] text-[#F5F5DC] px-4 py-1.5 rounded-lg border-2 border-[#5D4037] hover:bg-[#6D4C41] transition-all font-semibold text-sm shadow-sm"
      >
        <PlusCircleOutlined spin={isCreating} />
        <span>{isCreating ? "Connecting..." : "Enable Support"}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div 
        className="flex items-center gap-3 bg-[#F5F5DC] border-2 border-[#8B4513] rounded-lg px-3 py-1.5 cursor-pointer hover:bg-[#E8E8D0] transition-colors"
        onClick={() => {
          navigator.clipboard.writeText(smartAccountAddress);
          toast.success("Address copied!");
        }}
      >
        <div className={`p-1.5 rounded-full ${Number(formattedBalance) > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          <RobotOutlined />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-[#8B4513] uppercase leading-none">Session Wallet</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono text-[#8D6E63]">{smartAccountAddress.slice(0, 4)}...{smartAccountAddress.slice(-4)}</span>
            <span className="text-xs font-bold font-mono text-[#5D4037]">{formattedBalance} ETH</span>
          </div>
        </div>
        <WalletOutlined style={{ color: "#8B4513" }} />
      </div>
      <button 
        onClick={() => confirm("Reset wallet?") && clearSmartAccountCache()}
        className="p-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
      >
        <ReloadOutlined />
      </button>
    </div>
  );
}