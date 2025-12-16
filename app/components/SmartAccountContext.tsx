'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { toMetaMaskSmartAccount, Implementation, MetaMaskSmartAccount } from '@metamask/smart-accounts-kit'
import { erc7715ProviderActions, erc7710BundlerActions } from "@metamask/smart-accounts-kit/actions";
import { createBundlerClient, createPaymasterClient } from 'viem/account-abstraction'
import { http, parseGwei, encodeFunctionData, Hash, Address, createWalletClient, custom } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

declare global {
  interface Window {
    ethereum?: any;
  }
}

// 1. Fix: Add smartAccount to the Interface
interface SmartAccountContextType {
  smartAccount: MetaMaskSmartAccount | null; // <--- ADDED THIS
  smartAccountAddress: Address | null;
  isPending: boolean;
  error: Error | null;
  userOpHash: Hash | null;
  
  hasSession: boolean;
  requestSession: () => Promise<void>;
  sendSessionTx: (args: { calls: { address: Address; abi: any; functionName: string; args: any[]; value?: bigint }[] }) => Promise<Hash | undefined>;
  sendSmartAccountTx: (args: { abi: any; address: Address; functionName: string; args: any[]; value?: bigint }) => Promise<Hash | undefined>;
}

const SmartAccountContext = createContext<SmartAccountContextType>({
  smartAccount: null, // <--- ADDED THIS
  smartAccountAddress: null,
  isPending: false,
  error: null,
  userOpHash: null,
  hasSession: false,
  requestSession: async () => {},
  sendSessionTx: async () => undefined,
  sendSmartAccountTx: async () => undefined,
});

export function SmartAccountProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(null);
  const [sessionAccount, setSessionAccount] = useState<any | null>(null);
  const [grantedPermissions, setGrantedPermissions] = useState<any | null>(null);

  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userOpHash, setUserOpHash] = useState<Hash | null>(null);

  const getBundler = () => {
    if (!publicClient) throw new Error("Public client not ready");
    const bundlerUrl = "https://api.pimlico.io/v2/sepolia/rpc?apikey=pim_ebHNbdP8xTZAriphyLSKMD";
    
    return createBundlerClient({
      client: publicClient,
      transport: http(bundlerUrl),
      paymaster: createPaymasterClient({ transport: http(bundlerUrl) }),
      paymasterContext: { mode: 'SPONSORED' }
    }).extend(erc7710BundlerActions());
  }

  // --- Initialize Master Account ---
  useEffect(() => {
    if (!isConnected || !publicClient || !address || typeof window === 'undefined' || !window.ethereum) return;

    const initAccount = async () => {
      try {
        const walletClient = createWalletClient({
            account: address,
            chain: sepolia,
            transport: custom(window.ethereum)
        });

        const account = await toMetaMaskSmartAccount({
          client: publicClient,
          implementation: Implementation.Hybrid,
          deployParams: [address, [], [], []],
          deploySalt: '0x',
          signer: { walletClient }, 
        });
        
        setSmartAccount(account);
        setSmartAccountAddress(account.address);
        console.log("🔹 Master Smart Account Ready:", account.address);
      } catch (err: any) {
        console.error("Init Error:", err);
      }
    };
    initAccount();
  }, [isConnected, address, publicClient]);

  // --- Request Session ---
  const requestSession = async () => {
    if (!smartAccountAddress || !window.ethereum) return;
    setIsPending(true);
    
    try {
        const pKey = generatePrivateKey();
        const localAccount = privateKeyToAccount(pKey);
        
        const walletClientWith7715 = createWalletClient({
            transport: custom(window.ethereum),
            chain: sepolia
        }).extend(erc7715ProviderActions());

        if(!publicClient) return;
        
        const tempSessionSmartAccount = await toMetaMaskSmartAccount({
            client: publicClient,
            implementation: Implementation.Hybrid,
            deployParams: [localAccount.address, [], [], []],
            deploySalt: '0x',
            signer: { account: localAccount },
        });

        console.log("👋 Requesting Permission...");
        const permissions = await walletClientWith7715.requestExecutionPermissions([{
            chainId: sepolia.id,
            expiry: Math.floor(Date.now() / 1000) + 86400,
            signer: {
                type: "account",
                data: { address: tempSessionSmartAccount.address },
            },
            permission: {
                type: "native-token-periodic", 
                data: {
                    periodAmount: parseGwei("100000000"),
                    periodDuration: 86400,
                },
            },
            isAdjustmentAllowed: true, 
        }]);

        setGrantedPermissions(permissions[0]);
        setSessionAccount(tempSessionSmartAccount);
    } catch (err: any) {
        console.error("Session Request Failed:", err);
        setError(err);
    } finally {
        setIsPending(false);
    }
  };

  // --- Send Session Transaction ---
  const sendSessionTx = async ({ calls }: { calls: any[] }) => {
    if (!sessionAccount || !grantedPermissions || !publicClient) throw new Error("No active session");
    
    setIsPending(true);
    setError(null);
    setUserOpHash(null);

    try {
        const bundler = getBundler();
        const permissionsContext = grantedPermissions.context;
        const delegationManager = grantedPermissions.signerMeta.delegationManager;

        const formattedCalls = calls.map((call) => ({
             to: call.address,
             data: encodeFunctionData({ abi: call.abi, functionName: call.functionName, args: call.args }),
             value: call.value || BigInt(0),
             permissionsContext,
             delegationManager,
        }));

        const hash = await bundler.sendUserOperationWithDelegation({
            account: sessionAccount,
            calls: formattedCalls,
            maxFeePerGas: parseGwei('20'),
            maxPriorityFeePerGas: parseGwei('2'),
            publicClient
        });
        
        await bundler.waitForUserOperationReceipt({ hash });
        setUserOpHash(hash);
        return hash;
    } catch (err: any) {
        setError(err);
    } finally {
        setIsPending(false);
    }
  };

  // --- Send Standard Transaction ---
  const sendSmartAccountTx = async ({ abi, address: to, functionName, args, value = BigInt(0) }: any) => {
    if (!smartAccount) {
        const msg = "Smart Account not ready. Please connect wallet.";
        console.error(msg);
        setError(new Error(msg));
        return;
    }

    setIsPending(true);
    setError(null);
    setUserOpHash(null);
    
    try {
        // Force connection check
        const tempClient = createWalletClient({ 
            transport: custom(window.ethereum) 
        });
        await tempClient.requestAddresses(); 

        const bundler = getBundler();
        const callData = encodeFunctionData({ abi, functionName, args });

        console.log(`📤 Sending Standard UserOp to ${to}...`);

        const hash = await bundler.sendUserOperation({
            account: smartAccount, 
            calls: [{ to, value, data: callData }],
            maxFeePerGas: parseGwei('20'),
            maxPriorityFeePerGas: parseGwei('2'),
        });
        
        console.log("⏳ Waiting for receipt...", hash);
        await bundler.waitForUserOperationReceipt({ hash });
        
        setUserOpHash(hash);
        return hash;
    } catch (err: any) {
        console.error("Tx Failed:", err);
        setError(err);
    } finally {
        setIsPending(false);
    }
  };

  return (
    <SmartAccountContext.Provider value={{
      smartAccount, // <--- 2. Fix: Pass smartAccount in the value object
      smartAccountAddress,
      isPending,
      error,
      userOpHash,
      hasSession: !!sessionAccount,
      requestSession,
      sendSessionTx,
      sendSmartAccountTx, 
    }}>
      {children}
    </SmartAccountContext.Provider>
  );
}

export const useSmartAccountContext = () => useContext(SmartAccountContext);