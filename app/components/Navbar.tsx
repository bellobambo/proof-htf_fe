"use client";

import { useAccount, useBalance } from "wagmi";
import { useUsers } from "@/utils/useContractHooks";
import { WalletConnect } from "./WalletConnect";

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

    // Format balance from wei to ETH
    const formatBalance = (value: bigint, decimals: number) => {
        const etherValue = Number(value) / Math.pow(10, decimals);
        return etherValue.toFixed(4);
    };

    // Get user role display name
    const getUserRole = () => {
        if (!userData?.isRegistered) return "Unregistered";
        return userData.role === 0 ? "Student" : "Tutor";
    };

    // Get user name or fallback
    const getUserName = () => {
        if (!userData?.isRegistered) return null;
        return userData.name || "Unnamed";
    };

    return (
        <nav className="bg-[#F5F5DC] border-b border-[#8D6E63] shadow-sm">
            <div className="px-12  ">
                <div className="flex justify-between items-center h-16">
                    {/* Left side - Logo/Brand */}
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold text-[#4E342E]">Proof</h1>

                            <p className="text-md  text-[#8D6E63] capitalize">
                                {getUserName()}  {" "}  {getUserRole()}
                            </p>
                        </div>
                    </div>

                    {/* Right side - Wallet info */}
                    <div className="flex items-center space-x-4">
                        {!isConnected ? (
                            <WalletConnect />
                        ) : (
                            <div className="flex items-center space-x-4">

                                {/* Balance */}
                                {balance && (
                                    <div className="flex items-center h-10 px-3 rounded border border-[#8D6E63]">
                                        <p className="text-md font-semibold text-[#4E342E]">
                                            {formatBalance(balance.value, balance.decimals)} ETH
                                        </p>
                                    </div>
                                )}

                                {/* Wallet Address */}
                                <div className="flex items-center h-10 px-3 rounded border border-[#8D6E63] ">
                                    <p className="text-sm font-mono text-[#4E342E]">
                                        {shortenAddress(address!)}
                                    </p>
                                </div>



                                {/* Disconnect */}
                                <div className="flex items-center  px-3 rounded border ">
                                    <WalletConnect />
                                </div>

                            </div>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
}