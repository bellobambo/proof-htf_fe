'use client';

import { useState, useCallback } from 'react';
import { useWalletClient, usePublicClient, useAccount } from 'wagmi';
import { toMetaMaskSmartAccount, Implementation } from '@metamask/smart-accounts-kit';
import { createBundlerClient } from 'viem/account-abstraction';
import { http, parseGwei, encodeFunctionData, type Hash, type Address } from 'viem';

// 1. Define the shape of a transaction call
export interface SmartAccountCall {
  address: Address;
  abi: any;
  functionName: string;
  args: any[];
  value?: bigint;
}

export function useSmartAccount() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userOpHash, setUserOpHash] = useState<Hash | null>(null);

  // Helper: Initialize the Client and Bundler
  // This ensures we always get the same deterministic account
  const getClient = async () => {
    if (!walletClient || !publicClient || !address) return null;

    // A. Create Smart Account
    const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [address, [], [], []], // Owner is the connected wallet
        deploySalt: '0x',                    // '0x' ensures address stays the same forever
        signer: { walletClient },
    });

    // Save address to state so we can check it later (e.g. isRegistered)
    setSmartAccountAddress(smartAccount.address);

    // B. Create Bundler Client
    const bundlerUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
    if (!bundlerUrl) throw new Error("Bundler URL missing in .env");

    const bundlerClient = createBundlerClient({
        client: publicClient,
        transport: http(bundlerUrl),
    });

    return { smartAccount, bundlerClient };
  };

  // ---------------------------------------------------------
  // CORE FUNCTION: Send a Batch of Transactions (1 or many)
  // ---------------------------------------------------------
  const sendBatchTx = useCallback(async (calls: SmartAccountCall[]) => {
    setIsPending(true);
    setError(null);
    setUserOpHash(null);

    try {
      const clients = await getClient();
      if (!clients) return;
      const { smartAccount, bundlerClient } = clients;

      // 1. Map calls to the format expected by the Bundler
      const formattedCalls = calls.map(call => ({
        to: call.address,
        value: call.value || BigInt(0),
        data: encodeFunctionData({
          abi: call.abi,
          functionName: call.functionName,
          args: call.args
        })
      }));

      console.log(`🚀 Sending Batch of ${formattedCalls.length} calls...`);

      // 2. Send the User Operation
      const hash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: formattedCalls,
        // Explicit gas overrides to satisfy Infura/Alchemy minimums
        maxFeePerGas: parseGwei('20'),
        maxPriorityFeePerGas: parseGwei('2'),
      });

      console.log('✅ UserOp Hash:', hash);
      setUserOpHash(hash);
      
      // 3. Wait for confirmation
      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
      return receipt.receipt.transactionHash;

    } catch (err: any) {
      console.error("Smart Account Error:", err);
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [address, walletClient, publicClient]);

  // ---------------------------------------------------------
  // WRAPPER: Send Single Transaction (Backward Compatibility)
  // ---------------------------------------------------------
  const sendSmartAccountTx = useCallback(async (call: SmartAccountCall) => {
    return await sendBatchTx([call]);
  }, [sendBatchTx]);

  return {
    sendSmartAccountTx, // Use this for single calls
    sendBatchTx,        // Use this for multiple calls (auto-register + create)
    isPending,
    error,
    userOpHash,
    smartAccountAddress // Exposed so you can check `isRegistered` against this address
  };
}