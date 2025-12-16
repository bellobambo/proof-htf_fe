"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createWalletClient,
  custom,
  createPublicClient,
  http,
  encodeFunctionData,
  parseUnits,
  Hex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { createBundlerClient } from "viem/account-abstraction";
import {
  erc7715ProviderActions,
  erc7710BundlerActions,
} from "@metamask/smart-accounts-kit/actions";
import {
  toMetaMaskSmartAccount,
  Implementation,
} from "@metamask/smart-accounts-kit";
import { formatEther } from "viem";
import { CONTRACT_ADDRESS } from "./contract";

const BUNDLER_URL =
  "https://api.pimlico.io/v2/sepolia/rpc?apikey=pim_ebHNbdP8xTZAriphyLSKMD";

export function useSmartSession() {
  const [session, setSession] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  // --- HELPER: Get (or create) the "Invisible Robot" (Local Key) ---
  const getLocalSigner = () => {
    if (typeof window === "undefined") return null;

    let privKey = localStorage.getItem("session_private_key") as Hex;

    if (!privKey) {
      privKey = generatePrivateKey();
      localStorage.setItem("session_private_key", privKey);
    }

    return privateKeyToAccount(privKey);
  };

  // --- HELPER: Connect to Smart Account ---
  const getSmartAccount = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("No wallet found");
    }

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    const localSigner = getLocalSigner();
    if (!localSigner) throw new Error("Could not load local signer");

    const walletClient = createWalletClient({
      chain: sepolia,
      transport: custom((window as any).ethereum),
    });
    const [ownerAddress] = await walletClient.requestAddresses();

    return toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [ownerAddress, [], [], []],
      deploySalt: "0x",
      signer: { account: localSigner } as any,
    });
  };

  // --- 1. Login / Request Permissions ---
  const requestSession = async () => {
    const baseClient = createWalletClient({
      chain: sepolia,
      transport: custom((window as any).ethereum),
    }).extend(erc7715ProviderActions());

    // 1. Get the Robot
    const localSigner = getLocalSigner();
    if (!localSigner) throw new Error("No local signer found");

    // 2. Get the Smart Account (just to get its address for the context)
    const sessionAccount = await getSmartAccount();

    console.log("Requesting 7715 Permissions...");

    const response = await baseClient.requestExecutionPermissions([
      {
        chainId: sepolia.id,
        expiry: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        signer: {
          type: "account",
          // 🟢 FIX: Authorize the ROBOT address, NOT the Smart Account address
          data: { address: localSigner.address },
        },
        permission: {
          type: "native-token-periodic",
          data: {
            periodAmount: parseUnits("0.1", 18),
            periodDuration: 86400,
          },
        },
        isAdjustmentAllowed: true,
      },
    ]);

    const sessionData = {
      permissionContext: response[0],
      accountAddress: sessionAccount.address,
    };

    // Save "Version 4" to force a fresh login with the correct signer authorization
    localStorage.setItem(
      "smartSession_v4",
      JSON.stringify(sessionData, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    setSession(sessionData);
    setIsReady(true);

    return sessionData;
  };

  const executeTip = useCallback(
    async (recipientAddress: string, amountEther: string) => {
      const currentSession = session;
      if (!currentSession) throw new Error("No active session");

      const bundlerClient = createBundlerClient({
        chain: sepolia,
        transport: http(BUNDLER_URL),
        // paymaster: true, // Keep commented out (User pays gas)
      }).extend(erc7710BundlerActions());

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const smartAccount = await getSmartAccount();

      // 1. Get Balance
      const balance = await publicClient.getBalance({
        address: smartAccount.address,
      });

      // 🟢 FIX: Use formatEther to see decimals properly
      console.log("🤖 ROBOT ADDRESS:", smartAccount.address);
      console.log("💰 ROBOT BALANCE:", formatEther(balance), "ETH");

      const requiredAmount = parseUnits(amountEther, 18);

      // 2. Safety Check (Tip Amount only)
      if (balance < requiredAmount) {
        throw new Error(
          `Not enough ETH to send tip. Have: ${formatEther(balance)}, Need: ${amountEther}`
        );
      }

      // 3. Gas Warning (Heuristic)
      // A UserOp typically costs ~0.0005 ETH on testnets depending on gas price
      const ESTIMATED_GAS_COST = parseUnits("0.0005", 18);
      if (balance < requiredAmount + ESTIMATED_GAS_COST) {
        console.warn("⚠️ Warning: Balance might be too low to cover Gas + Tip");
      }

      console.log(`Sending Tip: ${amountEther} ETH...`);

      const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
        publicClient,
        account: smartAccount,
        calls: [
          {
            to: recipientAddress as `0x${string}`,
            value: requiredAmount,
            data: "0x",
            permissionsContext: currentSession.permissionContext.context,
            delegationManager:
              currentSession.permissionContext.signerMeta.delegationManager,
          },
        ],
        maxFeePerGas: BigInt(2000000000), // 2 Gwei
        maxPriorityFeePerGas: BigInt(2000000000),
      });

      console.log("UserOp Sent! Hash:", userOpHash);

      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      return receipt.receipt.transactionHash;
    },
    [session]
  );

  const executeSmartAction = useCallback(async () => {
    return null;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("smartSession_v4");
    if (saved) {
      setSession(JSON.parse(saved));
      setIsReady(true);
    }
  }, []);

  return {
    requestSession,
    executeSmartAction,
    executeTip,
    isReady,
    smartAccountAddress: session?.accountAddress,
  };
}
