"use client";

import { useSmartSession } from "@/utils/useSmartSession";
import React, { createContext, useContext, ReactNode, useMemo } from "react";
// import { useSmartSession } from "@/hooks/useSmartSession";
useSmartSession

interface SmartSessionContextType {
  requestSession: () => Promise<any>;
  executeTip: (recipient: string, amount: string) => Promise<string>;
  clearSmartAccountCache: () => void;
  isReady: boolean;
  userAddress: string | null;
  smartAccountAddress: string | null;
}

const SmartSessionContext = createContext<SmartSessionContextType | undefined>(undefined);

export function SmartSessionProvider({ children }: { children: ReactNode }) {
  const session = useSmartSession();
  const value = useMemo(() => ({ ...session }), [session]);

  return (
    <SmartSessionContext.Provider value={value}>
      {children}
    </SmartSessionContext.Provider>
  );
}

export function useSmartAccount() {
  const context = useContext(SmartSessionContext);
  if (!context) throw new Error("useSmartAccount must be used within a SmartSessionProvider");
  return context;
}