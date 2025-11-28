"use client";

import { useAccount, useBalance } from "wagmi";
import { useUsers } from "@/utils/useContractHooks";
import { WalletConnect } from "./WalletConnect";
import TranslationModal from "./TranslationDrawer";
import toast from "react-hot-toast";

export default function Navbar() {
    const { address, isConnected } = useAccount();
    const { data: userData } = useUsers(address);

    // Get Sepolia ETH balance
    const { data: balance } = useBalance({
        address: address,
        chainId: 11155111, // Sepolia chain ID
    });

    // Shorten wallet address
    const shortenAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };


    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Address copied to clipboard!');
        }).catch((err) => {
            toast.error('Failed to copy address');
            console.error('Failed to copy: ', err);
        });
    };


    // Format balance from wei to ETH
    const formatBalance = (value: bigint, decimals: number) => {
        const etherValue = Number(value) / Math.pow(10, decimals);
        return etherValue.toFixed(4);
    };

    const getUserRole = () => {
        if (!userData?.isRegistered) return "Unregistered";
        return userData.role === 0 ? "Tutor" : "Student";
    };

    // Get user name or fallback
    const getUserName = () => {
        if (!userData?.isRegistered) return null;
        return userData.name || "Unnamed";
    };

    return (
        <nav className="bg-[#F5F5DC] border-b border-[#8D6E63] shadow-sm">
            <div className="px-12">
                <div className="flex justify-between items-center h-16">
                    {/* Left side - Logo/Brand */}
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold text-[#4E342E]">Proof</h1>
                            <p className="text-md text-[#8D6E63] capitalize">
                                {getUserName()}  {" "} -  {getUserRole()}
                            </p>
                        </div>
                    </div>

                    {/* Right side - Wallet info */}
                    <div className="flex items-center space-x-4">
                        {!isConnected ? (
                            <div className="flex items-center space-x-4">
                                <TranslationModal />
                                <WalletConnect />
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                {/* Translation Modal */}
                                <TranslationModal />

                                {/* Balance */}
                                {balance && (
                                    <div className="flex items-center h-10 px-3 rounded border border-[#8D6E63]">
                                        <p className="text-md font-semibold text-[#4E342E]">
                                            {formatBalance(balance.value, balance.decimals)} ETH
                                        </p>
                                    </div>
                                )}

                                {/* Wallet Address */}
                                <div
                                    className="flex items-center h-10 px-3  rounded border border-[#8D6E63] cursor-pointer hover:bg-[#F5F5F5] transition-colors"
                                    onClick={() => copyToClipboard(address!)}
                                    title="Click to copy address"
                                >
                                    <p className="text-sm font-mono text-[#4E342E]">
                                        {shortenAddress(address!)}
                                    </p>
                                </div>

                                {/* Disconnect */}
                                <div className="flex items-center px-3 rounded border">
                                    <WalletConnect />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Remove the LocaleSwitcher section since we're using TranslationModal instead */}
                {/* <div className="bg-black">
                    <LocaleSwitcher locales={["en", "es"]} />
                </div> */}
            </div>
        </nav>
    );
}