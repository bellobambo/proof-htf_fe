'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { toMetaMaskSmartAccount, Implementation, MetaMaskSmartAccount } from '@metamask/smart-accounts-kit'
// 1. IMPORT PAYMASTER CLIENT
import { createBundlerClient, createPaymasterClient } from 'viem/account-abstraction'
import { http, parseGwei, encodeFunctionData, Hash, Address } from 'viem'

interface SmartAccountContextType {
  smartAccountAddress: Address | null;
  smartAccount: MetaMaskSmartAccount | null;
  sendUserOp: (args: { abi: any; address: Address; functionName: string; args: any[]; value?: bigint }) => Promise<Hash | undefined>;
  sendBatchUserOp: (args: { calls: { address: Address; abi: any; functionName: string; args: any[]; value?: bigint }[] }) => Promise<Hash | undefined>;
  isLoading: boolean;
  error: Error | null;
}

const SmartAccountContext = createContext<SmartAccountContextType>({
  smartAccountAddress: null,
  smartAccount: null,
  sendUserOp: async () => undefined,
  sendBatchUserOp: async () => undefined,
  isLoading: false,
  error: null,
});

export function SmartAccountProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 1. Initialize Smart Account
  useEffect(() => {
    if (!isConnected || !walletClient || !publicClient || !address) {
        setSmartAccount(null);
        setSmartAccountAddress(null);
        return;
    }

    const initAccount = async () => {
        setIsLoading(true);
        try {
            const account = await toMetaMaskSmartAccount({
                client: publicClient,
                implementation: Implementation.Hybrid,
                deployParams: [address, [], [], []],
                deploySalt: '0x',
                signer: { walletClient },
            });
            setSmartAccount(account);
            setSmartAccountAddress(account.address);
            
            // Log initial address for debugging
            console.log("🔹 Smart Account Initialized:", account.address);
        } catch (err: any) {
            console.error("Smart Account Init Error:", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    initAccount();
  }, [isConnected, address, walletClient, publicClient]);

  // 2. Helper: Get Bundler with Paymaster
  const getBundler = () => {
    if (!publicClient) throw new Error("Public client not ready");
    const bundlerUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL; 
    if (!bundlerUrl) throw new Error("Bundler URL missing");
    
    // Create Paymaster Client
    const paymasterClient = createPaymasterClient({
        transport: http(bundlerUrl),
    });

    // Create Bundler with Paymaster attached
    return createBundlerClient({
        client: publicClient,
        transport: http(bundlerUrl),
        paymaster: paymasterClient,
        paymasterContext: { mode: 'SPONSORED' } 
    });
  }

  // 3. Helper: Detailed Error Parsing
  const handleSmartAccountError = (err: any, accountAddr: string | undefined) => {
    // A. Log the raw details for you (the developer)
    console.group("🚨 Smart Account Transaction Failed");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    if (err.cause) console.error("Cause:", err.cause);
    if (err.details) console.error("Details:", err.details);
    console.groupEnd();

    // B. Create a user-friendly message
    let friendlyMessage = err.message;

    // Check for Insufficient Funds (AA21)
    if (
        err.message?.includes("AA21") || 
        err.message?.includes("InsufficientPrefundError") ||
        err.name === "InsufficientPrefundError"
    ) {
        friendlyMessage = `Transaction failed: Insufficient funds. Even with a Paymaster, you may need a tiny amount of ETH for deployment or the Paymaster policy might be rejecting this request. Please send 0.01 Sepolia ETH to: ${accountAddr}`;
    }
    // Check for Reverted Transactions
    else if (err.message?.includes("Execution reverted")) {
        if (err.message?.includes("4e6f742061207475746f72")) {
             friendlyMessage = "Transaction failed: You are not registered as a tutor.";
        } else if (err.message?.includes("416c72656164792072656769737465726564")) {
             friendlyMessage = "Transaction failed: User is already registered.";
        } else {
             friendlyMessage = "Transaction reverted by the smart contract. Check your inputs.";
        }
    }

    const friendlyError = new Error(friendlyMessage);
    setError(friendlyError);
    throw friendlyError; 
  };

  // 4. Send Single UserOp
  const sendUserOp = async ({ abi, address: to, functionName, args, value = BigInt(0) }: any) => {
    if (!smartAccount) throw new Error("Smart Account not ready");
    setError(null);
    
    try {
        const bundler = getBundler();
        const callData = encodeFunctionData({ abi, functionName, args });

        console.log(`📤 Sending UserOp to ${to}...`);

        const hash = await bundler.sendUserOperation({
            account: smartAccount,
            calls: [{ to, value, data: callData }],
            maxFeePerGas: parseGwei('20'),
            maxPriorityFeePerGas: parseGwei('2'),
        });
        
        console.log("⏳ UserOp sent. Hash:", hash);
        await bundler.waitForUserOperationReceipt({ hash });
        
        // --- ADDED SUCCESS LOGS ---
        console.group("✅ Transaction Successful!");
        console.log("Transaction Hash:", hash);
        console.log("Sent From Smart Account:", smartAccountAddress);
        console.log("View on Explorer:", `https://sepolia.etherscan.io/tx/${hash}`);
        console.groupEnd();
        
        return hash;
    } catch (err) {
        handleSmartAccountError(err, smartAccountAddress || "your address");
    }
  };

  // 5. Send Batch UserOp
  const sendBatchUserOp = async ({ calls }: any) => {
    if (!smartAccount) throw new Error("Smart Account not ready");
    setError(null);

    try {
        const bundler = getBundler();
        
        const formattedCalls = calls.map((call: any) => ({
            to: call.address,
            value: call.value || BigInt(0),
            data: encodeFunctionData({ abi: call.abi, functionName: call.functionName, args: call.args })
        }));

        console.log(`🚀 Sending Batch of ${formattedCalls.length} calls...`);

        const hash = await bundler.sendUserOperation({
            account: smartAccount,
            calls: formattedCalls,
            maxFeePerGas: parseGwei('20'),
            maxPriorityFeePerGas: parseGwei('2'),
        });

        console.log("⏳ Batch sent. Hash:", hash);
        await bundler.waitForUserOperationReceipt({ hash });
        
        // --- ADDED SUCCESS LOGS ---
        console.group("✅ Batch Transaction Successful!");
        console.log("Transaction Hash:", hash);
        console.log("Sent From Smart Account:", smartAccountAddress);
        console.log("View on Explorer:", `https://sepolia.etherscan.io/tx/${hash}`);
        console.groupEnd();

        return hash;
    } catch (err) {
        handleSmartAccountError(err, smartAccountAddress || "your address");
    }
  };

  return (
    <SmartAccountContext.Provider value={{ 
        smartAccount, 
        smartAccountAddress, 
        sendUserOp, 
        sendBatchUserOp,
        isLoading, 
        error 
    }}>
      {children}
    </SmartAccountContext.Provider>
  );
}

export const useSmartAccountContext = () => useContext(SmartAccountContext);