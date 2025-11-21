// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useUsers } from "@/utils/useContractHooks";
import { WalletConnect } from "./components/WalletConnect";
import Registration from "./components/Registration";
import Courses from "./components/Courses";


export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: userData } = useUsers(address);
  
  const [showCourses, setShowCourses] = useState(false);

  // Check if user is already registered on component mount
  useEffect(() => {
    if (userData?.isRegistered) {
      setShowCourses(true);
    }
  }, [userData?.isRegistered]);

  const handleRegistrationComplete = () => {
    setShowCourses(true);
  };

  // Not connected → Show connect button
  if (!isConnected) {
    return (
      <div className="flex min-h-screen bg-[#8B4513] items-center justify-center">
        <WalletConnect />
      </div>
    );
  }

  // Connected and registered → Show courses dashboard
  if (showCourses) {
    return <Courses />;
  }

  // Connected but not registered → Show registration
  return (
    <Registration onRegistrationComplete={handleRegistrationComplete} />
  );
}