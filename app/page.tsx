"use client";

import Image from "next/image";
import { UserRole, useRegisterUser, useUsers } from "@/utils/useContractHooks";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { WalletConnect } from "./components/WalletConnect";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const { address, isConnected } = useAccount();

  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  const { data: userData, refetch } = useUsers(address);
  const isRegistered = userData?.isRegistered ?? false;

  const {
    registerUser,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  } = useRegisterUser();

  useEffect(() => {
    if (isPending) toast("Waiting for wallet confirmation...");
    if (isConfirming) toast("Transaction submitted. Waiting for blockchain...");
    if (isConfirmed) {
      toast.success("Registration successful!");
      refetch();
    }
    if (error) toast.error(error.message);
  }, [isPending, isConfirming, isConfirmed, error]);

  const handleRegister = () => {
    if (!name.trim()) return toast.error("Please enter your name");
    registerUser(name, role);
  };

  // Not connected → Show connect button
  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <WalletConnect />
      </div>
    );
  }

  // Connected + Already registered → Welcome
  if (isRegistered) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="bg-[#5D4037] p-10 rounded-xl border border-[#8D6E63] shadow-md text-center">
          <h2 className="text-2xl font-bold text-[#F5F5DC]">Welcome back 🎉</h2>
          <p className="text-[#F5F5DC] mt-2">You are already registered.</p>
        </div>
      </div>
    );
  }

  // Connected + Not registered → Registration modal with animation
  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <AnimatePresence>
        <motion.main
          key="register-modal"
          initial={{ opacity: 0, scale: 0.85, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 25 }}
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center w-full max-w-lg px-8 py-20 bg-[#5D4037] rounded-lg shadow-lg gap-8 border border-[#F5F5DC]"
        >

          <h1 className="text-2xl font-bold text-[#F5F5DC]">
            Register on Proof
          </h1>

          {/* Full Name */}
          <div className="w-full">
            <label className="text-sm text-[#F5F5DC]">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 mt-1 rounded-md border border-[#8D6E63] text-[#4E342E] bg-[#F5F5DC] placeholder-[#A1887F]"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="w-full">
            <label className="text-sm text-[#F5F5DC]">Select Role</label>
            <select
              className="w-full px-4 py-2 mt-1 rounded-md border border-[#8D6E63] text-[#4E342E] bg-[#F5F5DC]"
              value={role}
              onChange={(e) => setRole(Number(e.target.value))}
            >
              <option value={UserRole.STUDENT}>Student</option>
              <option value={UserRole.TUTOR}>Tutor</option>
            </select>
          </div>

          {/* Register Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRegister}
            disabled={isPending || isConfirming}
            className="w-full py-3 rounded-md bg-[#8D6E63] text-[#F5F5DC] hover:bg-[#A1887F] hover:text-[#4E342E] transition disabled:opacity-40 font-semibold cursor-pointer"
          >
            {isPending
              ? "Confirm in Wallet..."
              : isConfirming
                ? "Registering..."
                : "Register"}
          </motion.button>

          <p className="text-sm text-[#F5F5DC] text-center">
            Your registration will be stored on-chain.
          </p>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
