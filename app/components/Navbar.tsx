"use client";

import { useAccount, useBalance } from "wagmi";
import { useUsers } from "@/utils/useContractHooks";
import { WalletConnect } from "./WalletConnect";
import TranslationModal from "./TranslationDrawer";
import toast from "react-hot-toast";
import { useSmartAccountContext } from "./SmartAccountContext";

export default function Navbar() {
    const { address, isConnected } = useAccount();
    const { data: userData } = useUsers(address);
    
    // 1. Get Smart Account Address from Context
    const { smartAccountAddress, isLoading: isSmartAccountLoading } = useSmartAccountContext();

    // 2. Get MetaMask (EOA) Balance
    const { data: eoaBalance } = useBalance({
        address: address,
        chainId: 11155111, // Sepolia
    });

    // 3. Get Smart Account Balance (NEW)
    const { data: smartAccountBalance } = useBalance({
        address: smartAccountAddress || undefined, 
        chainId: 11155111,
        query: {
            enabled: !!smartAccountAddress // Only fetch if address exists
        }
    });

    const shortenAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(`${label} copied!`);
        }).catch((err) => {
            toast.error('Failed to copy address');
        });

        console.log("smart account address:", smartAccountAddress);
        console.log("smart account balance:", smartAccountBalance);
    };

    const formatBalance = (value: bigint, decimals: number) => {
        const etherValue = Number(value) / Math.pow(10, decimals);
        return etherValue.toFixed(4);
    };

    const getUserName = () => {
        if (!userData?.isRegistered) return null;
        return userData.name || "Unnamed";
    };

    const getUserRole = () => {
        if (!userData?.isRegistered) return "Unregistered";
        return userData.role === 0 ? "Tutor" : "Student";
    };

    return (
        <nav className="bg-[#F5F5DC] border-b border-[#8D6E63] shadow-sm">
            <div className="px-6 md:px-12">
                <div className="flex justify-between items-center h-20">
                    {/* Left side - Logo/Brand */}
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold text-[#4E342E]">Proof</h1>
                            <p className="text-md text-[#8D6E63] capitalize flex items-center gap-2">
                                {getUserName()} 
                                {userData?.isRegistered && <span className="text-xs bg-[#D2B48C] text-[#4E342E] px-2 py-0.5 rounded-full">{getUserRole()}</span>}
                            </p>
                        </div>
                    </div>

                    {/* Right side - Wallet info */}
                    <div className="flex items-center gap-4">
                        <TranslationModal />

                        {!isConnected ? (
                            <WalletConnect />
                        ) : (
                            <div className="flex items-center gap-3">
                                
                                {/* --- NEW: SMART ACCOUNT DISPLAY --- */}
                                {/* This section is styled darkly to look distinct and "Premium" */}
                                {smartAccountAddress && (
                                    <div className="hidden md:flex flex-col items-end px-3 py-1 bg-[#4E342E] rounded-lg border border-[#8D6E63] shadow-sm">
                                        <span className="text-[10px] text-[#D2B48C] font-bold tracking-wider uppercase">
                                            Smart Account
                                        </span>
                                        <div className="flex items-center gap-2 text-[#F5F5DC]">
                                            <span className="text-sm font-bold">
                                                {smartAccountBalance 
                                                    ? formatBalance(smartAccountBalance.value, smartAccountBalance.decimals) 
                                                    : "0.0000"} ETH
                                            </span>
                                            <span className="text-[#8D6E63]">|</span>
                                            <button 
                                                onClick={() => copyToClipboard(smartAccountAddress, "Smart Account")}
                                                className="text-sm font-mono hover:text-white transition-colors flex items-center gap-1"
                                                title="Copy Smart Account Address"
                                            >
                                                {shortenAddress(smartAccountAddress)}
                                                {/* Copy Icon */}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* --- STANDARD WALLET DISPLAY --- */}
                                <div className="flex items-center bg-white/50 rounded-lg border border-[#8D6E63] overflow-hidden">
                                    {eoaBalance && (
                                        <div className="px-3 py-2 bg-[#EFEBE9] border-r border-[#8D6E63]">
                                            <p className="text-sm font-medium text-[#4E342E]">
                                                {formatBalance(eoaBalance.value, eoaBalance.decimals)} ETH
                                            </p>
                                        </div>
                                    )}
                                    <div 
                                        className="px-3 py-2 cursor-pointer hover:bg-[#EFEBE9] transition-colors flex items-center gap-2"
                                        onClick={() => copyToClipboard(address!, "Wallet Address")}
                                        title="Copy Wallet Address"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <p className="text-sm font-mono text-[#4E342E]">
                                            {shortenAddress(address!)}
                                        </p>
                                    </div>
                                </div>

                                <WalletConnect />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}