// components/RegistrationComponent.tsx
"use client";

import { UserRole, useRegisterUser, useUsers } from "@/utils/useContractHooks";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

interface RegistrationComponentProps {
  onRegistrationComplete: () => void;
}

export default function Registration({ onRegistrationComplete }: RegistrationComponentProps) {
  const { address } = useAccount();
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
      // Call the callback to notify parent component
      setTimeout(() => {
        onRegistrationComplete();
      }, 1000);
    }
    if (error) toast.error(error.message);
  }, [isPending, isConfirming, isConfirmed, error, onRegistrationComplete]);

  // If already registered, call the completion callback
  useEffect(() => {
    if (isRegistered) {
      onRegistrationComplete();
    }
  }, [isRegistered, onRegistrationComplete]);

  const handleRegister = () => {
    if (!name.trim()) return toast.error("Please enter your name");
    registerUser(name, role);
  };

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
            All Interactions are stored on-chain.
          </p>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}