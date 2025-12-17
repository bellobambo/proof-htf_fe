"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createWalletClient,
  custom,
  createPublicClient,
  http,
  parseUnits,
  Hex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  createBundlerClient,
  createPaymasterClient,
} from "viem/account-abstraction";
import {
  erc7715ProviderActions,
  erc7710BundlerActions,
} from "@metamask/smart-accounts-kit/actions";
import {
  toMetaMaskSmartAccount,
  Implementation,
} from "@metamask/smart-accounts-kit";

const BUNDLER_URL =
  process.env.NEXT_PUBLIC_BUNDLER_URL ||
  "https://api.pimlico.io/v2/sepolia/rpc?apikey=pim_ebHNbdP8xTZAriphyLSKMD";

export function useSmartSession() {
  const [session, setSession] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null
  );

  const getLocalAccount = useCallback(() => {
    if (typeof window === "undefined") return null;
    let privKey = localStorage.getItem("session_private_key") as Hex;
    if (!privKey) {
      privKey = generatePrivateKey();
      localStorage.setItem("session_private_key", privKey);
    }
    return privateKeyToAccount(privKey);
  }, []);

  const getSessionAccount = async () => {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
    const account = getLocalAccount();
    if (!account) throw new Error("Could not load local account");

    return await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [account.address, [], [], []],
      deploySalt: "0x",
      signer: { account },
    });
  };

  const updateSmartAccountAddress = async () => {
    try {
      const smartAccount = await getSessionAccount();
      setSmartAccountAddress(smartAccount.address);
    } catch (e) {
      console.error("Failed to fetch smart account address", e);
    }
  };

  const requestSession = async () => {
    if (typeof window === "undefined") return;

    const walletClient = createWalletClient({
      chain: sepolia,
      transport: custom((window as any).ethereum),
    }).extend(erc7715ProviderActions());

    const [address] = await walletClient.requestAddresses();
    setUserAddress(address);

    const sessionAccount = await getSessionAccount();

    try {
      const response = await walletClient.requestExecutionPermissions([
        {
          chainId: sepolia.id,
          expiry: Math.floor(Date.now() / 1000) + 86400,
          signer: {
            type: "account",
            data: { address: sessionAccount.address },
          },
          permission: {
            type: "native-token-periodic",
            data: {
              periodAmount: parseUnits("0.1", 18),
              periodDuration: 86400,
              justification:
                "Allow the robot to send tips on your behalf (Up to 0.1 ETH/day)",
            },
          },
          isAdjustmentAllowed: true,
        },
      ]);

      const sessionData = {
        permissionContext: response[0],
        userAddress: address,
        expiry: Math.floor(Date.now() / 1000) + 86400,
      };

      localStorage.setItem("smartSession_v5", JSON.stringify(sessionData));
      setSession(sessionData);
      setIsReady(true);
      setSmartAccountAddress(sessionAccount.address);
      return sessionData;
    } catch (error) {
      console.error("Permission request failed:", error);
      throw error;
    }
  };

  const executeTip = useCallback(
    async (recipientAddress: string, amountEther: string) => {
      let currentSession = session;
      if (!currentSession && typeof window !== "undefined") {
        const stored = localStorage.getItem("smartSession_v5");
        if (stored) currentSession = JSON.parse(stored);
      }

      if (!currentSession) throw new Error("No active session.");

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const pimlicoUrl =
        "https://api.pimlico.io/v2/sepolia/rpc?apikey=pim_ebHNbdP8xTZAriphyLSKMD";

      // 1. Create Paymaster Client
      const paymasterClient = createPaymasterClient({
        transport: http(pimlicoUrl),
      });

      // 2. Create Bundler Client
      const bundlerClient = createBundlerClient({
        chain: sepolia,
        transport: http(pimlicoUrl),
        paymaster: paymasterClient,
      }).extend(erc7710BundlerActions());

      const sessionAccount = await getSessionAccount();
      const { context, signerMeta } = currentSession.permissionContext;

      // 🟢 CRITICAL FIX: Fetch gas prices from Pimlico directly
      const gasPriceResponse = await fetch(pimlicoUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "pimlico_getUserOperationGasPrice",
          params: [],
          id: 1,
        }),
      });

      const gasPriceData = await gasPriceResponse.json();
      const { fast } = gasPriceData.result;

      const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
        publicClient,
        account: sessionAccount,
        maxFeePerGas: BigInt(fast.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(fast.maxPriorityFeePerGas),
        calls: [
          {
            to: recipientAddress as `0x${string}`,
            value: parseUnits(amountEther, 18),
            data: "0x",
            permissionsContext: context,
            delegationManager: signerMeta.delegationManager,
          },
        ],
      });

      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });
      return receipt.receipt.transactionHash;
    },
    [session]
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem("smartSession_v5");
    setSession(null);
    setIsReady(false);
    setUserAddress(null);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      updateSmartAccountAddress();
      const saved = localStorage.getItem("smartSession_v5");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.expiry && parsed.expiry < Date.now() / 1000) {
          clearSession();
        } else {
          setSession(parsed);
          setUserAddress(parsed.userAddress);
          setIsReady(true);
        }
      }
    }
  }, [clearSession]);

  return {
    requestSession,
    executeTip,
    clearSmartAccountCache: clearSession,
    isReady,
    userAddress,
    smartAccountAddress,
  };
}