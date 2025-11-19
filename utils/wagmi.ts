import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''

export const config = createConfig({
    chains: [sepolia],
    connectors: [
        injected(),
        ...(projectId ? [walletConnect({
            projectId,
            showQrModal: true,
            qrModalOptions: {
                themeMode: 'light',
            }
        })] : []),
    ],
    transports: {
        [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    },
    ssr: true,
})

declare module 'wagmi' {
    interface Register {
        config: typeof config
    }
}