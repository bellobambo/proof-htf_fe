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
            <motion.button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-[#8D6E63] cursor-pointer text-[#F5F5DC] rounded-lg border border-[#6D4C41] hover:bg-[#6D4C41] transition-colors font-medium text-sm"
                whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
            >
                Disconnect
            </motion.button>
        )
    }

    return (
        <motion.button
            onClick={() => metamaskConnector && connect({ connector: metamaskConnector })}
            className="px-6  py-2 bg-[#8D6E63] text-[#F5F5DC] rounded-lg border border-[#6D4C41] hover:bg-[#6D4C41] transition-colors font-medium"
            whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
        >
            Connect Wallet
        </motion.button>
    )
}