'use client';

import { useState } from 'react';
import { useWalletClient, usePublicClient, useAccount } from 'wagmi';
import { toMetaMaskSmartAccount, Implementation } from '@metamask/smart-accounts-kit';
import { createBundlerClient } from 'viem/account-abstraction';
import { http, parseEther, parseGwei } from 'viem'; // Added parseGwei
import { sepolia } from 'viem/chains';

export default function SmartAccountControl() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // 1. Create the Smart Account Client
  const createSmartAccount = async () => {
    if (!walletClient || !publicClient || !address) return;
    setLoading(true);

    try {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [address, [], [], []],
        deploySalt: '0x', 
        signer: { walletClient },
      });

      setSmartAccountAddress(smartAccount.address);
      console.log('Smart Account Created:', smartAccount.address);
      
      return smartAccount;
    } catch (error) {
      console.error('Error creating smart account:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Send a User Operation
  const sendUserOp = async () => {
    setLoading(true);
    try {
      const account = await createSmartAccount();
      if (!account) return;

      const bundlerUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL; 
      
      if (!bundlerUrl) {
          console.error("Bundler URL not found in environment variables");
          return;
      }

      const bundlerClient = createBundlerClient({
        client: publicClient!,
        transport: http(bundlerUrl),
      });

      // --- FIXED SECTION: Set explicit gas fees ---
      const maxPriorityFeePerGas = parseGwei('2'); // 2 Gwei (Satisfies the >0.1 Gwei requirement)
      const maxFeePerGas = parseGwei('20');        // 20 Gwei (Buffer for network spikes)

      const userOpHash = await bundlerClient.sendUserOperation({
        account: account,
        calls: [
          {
            to: '0x1234567890123456789012345678901234567890', 
            value: parseEther('0.0001'),
          },
        ],
        maxFeePerGas,         // <--- Added
        maxPriorityFeePerGas, // <--- Added
      });

      console.log('UserOp Hash:', userOpHash);
      
      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
      setTxHash(receipt.receipt.transactionHash);

    } catch (error) {
      console.error('Error sending UserOp:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!address) return <div>Please connect your wallet first.</div>;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">MetaMask Smart Account</h2>
      
      <div className="space-y-4">
        <button 
          onClick={createSmartAccount}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Initializing...' : 'Initialize Smart Account'}
        </button>

        {smartAccountAddress && (
          <div className="p-2 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">Smart Account Address:</p>
            <code className="break-all">{smartAccountAddress}</code>
          </div>
        )}

        <button 
          onClick={sendUserOp}
          disabled={!smartAccountAddress || loading}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 ml-2"
        >
          Send Test Transaction (UserOp)
        </button>

        {txHash && (
          <div className="text-green-600">
            Success! Tx: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="underline">View on Etherscan</a>
          </div>
        )}
      </div>
    </div>
  );
}