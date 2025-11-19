'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { motion } from 'framer-motion'

export function WalletConnect() {
    const { address, isConnected } = useAccount()
    const { connect, connectors } = useConnect()
    const { disconnect } = useDisconnect()

    const metamaskConnector = connectors.find(
        (c) => c.name.toLowerCase().includes('meta')
    )

    if (isConnected) {
        return (
            <div className="flex items-center gap-4 p-4 bg-[#F5F5DC] rounded-xl border-2 border-[#D2B48C] shadow-sm">
                <span className="text-sm font-medium text-[#8B4513]">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <motion.button
                    onClick={() => disconnect()}
                    className="px-4 py-2 bg-[#D2B48C] text-[#8B4513] rounded-lg border-2 border-[#8B4513] font-medium hover:bg-[#C19A6B] transition-colors"
                    whileHover={{
                        scale: 1.05,
                        transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    Disconnect
                </motion.button>
            </div>
        )
    }

    return (
        <div className="flex gap-2 mt-[180px]">
            <motion.button
                onClick={() => metamaskConnector && connect({ connector: metamaskConnector })}
                className="px-6 py-3 bg-[#D2B48C] cursor-pointer text-[#8B4513] rounded-lg border-2 border-[#8B4513] font-medium hover:bg-[#C19A6B] transition-colors"
                whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
            >
                Connect To Proof
            </motion.button>
        </div>
    )
}