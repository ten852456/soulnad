"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { NextPage } from "next";
import { useAccount, useConnect } from "wagmi";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { Address, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const ClaimPage: NextPage = () => {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const { address: connectedAddress, isConnected } = useAccount();

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");

  // Fetch real session data from the contract
  const { data: sessionInfo, isLoading: isLoadingSession } = useScaffoldReadContract({
    contractName: "SBTSession",
    functionName: "getSession",
    args: sessionId ? [sessionId] : undefined,
    query: {
      enabled: !!sessionId,
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  });

  // Fetch template data for the session
  const { data: templateInfo, isLoading: isLoadingTemplate } = useScaffoldReadContract({
    contractName: "SBTTemplate",
    functionName: "getTemplate",
    args: sessionInfo ? [sessionInfo.templateId] : undefined,
    query: {
      enabled: !!sessionInfo?.templateId,
    },
  });

  // Check if session is still claimable
  const { data: isSessionClaimable } = useScaffoldReadContract({
    contractName: "SBTSession",
    functionName: "isSessionClaimable",
    args: sessionId ? [sessionId] : undefined,
    query: {
      enabled: !!sessionId,
      refetchInterval: 30000,
    },
  });

  const [sessionData, setSessionData] = useState<any>(null);

  // Process real session and template data
  useEffect(() => {
    if (sessionInfo && templateInfo) {
      const processedData = {
        sessionId: sessionInfo.sessionId,
        templateId: sessionInfo.templateId,
        name: templateInfo.name || "SBT Token",
        description: templateInfo.description || "Soulbound Token",
        issuer: sessionInfo.issuer,
        maxMints: Number(sessionInfo.maxMints),
        currentMints: Number(sessionInfo.currentMints),
        endTimestamp: Number(sessionInfo.endTimestamp) * 1000, // Convert to milliseconds
        active: sessionInfo.active && isSessionClaimable,
        title: sessionInfo.title || templateInfo.name || "Token Claim Session",
      };
      setSessionData(processedData);
    } else if (!isLoadingSession && !isLoadingTemplate && sessionId) {
      // Fallback to mock data if contract calls fail
      setSessionData({
        sessionId: sessionId,
        templateId: 1,
        name: "Monad Bitz 2025 Bangkok",
        description: "Soulbound Token for Developer who intercept with Chao and Monad",
        issuer: "0x1234567890123456789012345678901234567890",
        maxMints: 100,
        currentMints: 25,
        endTimestamp: Date.now() + 24 * 60 * 60 * 1000,
        active: true,
        title: "Monad Bitz 2025 Event Registration",
      });
    }
  }, [sessionInfo, templateInfo, isSessionClaimable, isLoadingSession, isLoadingTemplate, sessionId]);

  // Contract interaction for self-service minting
  const { writeContractAsync } = useScaffoldWriteContract("SBTToken");

  // Check if user already claimed (mock for now)
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  useEffect(() => {
    // Mock check if user already claimed
    if (connectedAddress) {
      // In real app: useScaffoldReadContract("SBTToken", "hasTokenFromSession", [connectedAddress, sessionId])
      setAlreadyClaimed(false); // Mock: user hasn't claimed yet
    }
  }, [connectedAddress, sessionId]);

  useEffect(() => {
    if (!sessionData?.endTimestamp) return;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = sessionData.endTimestamp - now;

      if (remaining <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [sessionData?.endTimestamp]);

  const handleClaim = async () => {
    if (!connectedAddress) {
      setError("Please connect your wallet first");
      return;
    }

    if (alreadyClaimed) {
      setError("You have already claimed from this session");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setTransactionHash(null);

    try {
      // Call the self-service minting function
      const tx = await writeContractAsync({
        functionName: "claimFromSession",
        args: [sessionId],
      });

      setTransactionHash(tx);
      setAlreadyClaimed(true);

      console.log("SBT claimed successfully:", tx);
    } catch (error) {
      console.error("Error claiming SBT:", error);
      setError("Failed to claim SBT. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingMints = sessionData ? sessionData.maxMints - sessionData.currentMints : 0;
  const isExpired = sessionData ? Date.now() > sessionData.endTimestamp : false;
  const isMaxedOut = sessionData ? sessionData.currentMints >= sessionData.maxMints : false;
  const isClaimable = sessionData ? sessionData.active && !isExpired && !isMaxedOut && !alreadyClaimed : false;

  return (
    <>
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent)] opacity-70"></div>

      <div className="relative min-h-screen pb-16">
        {/* Header */}
        <div className="relative z-10 px-6 pt-8 pb-6">
          <div className="max-w-2xl mx-auto">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/"
                className="inline-flex items-center text-purple-300 hover:text-purple-200 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Home
              </Link>

              {/* Session Info */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3">
                <div className="flex items-center text-white text-sm">
                  <SparklesIcon className="h-4 w-4 text-purple-300 mr-2" />
                  <span className="font-mono text-xs">{sessionId.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Claim Your SBT
                </span>
              </h1>
              <p className="text-xl text-slate-300">Connect your wallet and claim your Soulbound Token instantly</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 px-6">
          <div className="max-w-2xl mx-auto">
            {!sessionData ? (
              /* Loading State */
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white">Loading session data...</p>
              </div>
            ) : transactionHash ? (
              /* Success State */
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-6">
                  <CheckCircleIcon className="h-8 w-8 text-green-300" />
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">SBT Claimed Successfully!</h2>
                <p className="text-slate-300 mb-6">
                  Your Soulbound Token has been minted to your wallet and is now part of your digital identity.
                </p>

                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transaction:</span>
                      <span className="text-white font-mono text-xs">
                        {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Your Address:</span>
                      <Address address={connectedAddress} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/client"
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    View My SBTs
                  </Link>
                  <Link
                    href="/"
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Home
                  </Link>
                </div>
              </div>
            ) : (
              /* Claim Interface */
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
                {/* SBT Preview */}
                <div className="bg-gradient-to-br from-purple-400/10 to-pink-400/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-8">
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl mr-4">
                      <SparklesIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{sessionData.name}</h2>
                      <p className="text-slate-300 text-sm">
                        by <Address address={sessionData.issuer} />
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-300 mb-4">{sessionData.description}</p>

                  {/* Session Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3">
                      <div className="flex items-center text-blue-300 mb-1">
                        <UsersIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Available</span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {remainingMints} / {sessionData.maxMints}
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3">
                      <div className="flex items-center text-purple-300 mb-1">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Time Left</span>
                      </div>
                      <div className="text-lg font-bold text-white">{timeRemaining}</div>
                    </div>
                  </div>
                </div>

                {/* Connection & Claim Section */}
                {!isConnected ? (
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                    <p className="text-slate-300 mb-6">Connect your wallet to claim your Soulbound Token</p>
                    <RainbowKitCustomConnectButton />
                  </div>
                ) : !isClaimable ? (
                  <div className="text-center">
                    {alreadyClaimed ? (
                      <div className="inline-flex items-center px-6 py-4 bg-green-500/20 border border-green-300/30 text-green-200 rounded-xl">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Already Claimed
                      </div>
                    ) : isExpired ? (
                      <div className="inline-flex items-center px-6 py-4 bg-red-500/20 border border-red-300/30 text-red-200 rounded-xl">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        Session Expired
                      </div>
                    ) : isMaxedOut ? (
                      <div className="inline-flex items-center px-6 py-4 bg-yellow-500/20 border border-yellow-300/30 text-yellow-200 rounded-xl">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        All SBTs Claimed
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-6 py-4 bg-gray-500/20 border border-gray-300/30 text-gray-200 rounded-xl">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        Session Inactive
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Ready to Claim</h3>
                    <p className="text-slate-300 mb-6">Click below to mint your SBT directly to your wallet</p>

                    {error && (
                      <div className="mb-4 p-4 bg-red-500/20 border border-red-300/30 rounded-xl">
                        <p className="text-red-200 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={handleClaim}
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Claiming SBT...
                        </>
                      ) : (
                        <>
                          <ShieldCheckIcon className="h-5 w-5 mr-2" />
                          Claim My SBT
                        </>
                      )}
                    </button>

                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-300/30 rounded-xl">
                      <div className="flex items-start">
                        <InformationCircleIcon className="h-5 w-5 text-blue-300 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-blue-200 font-medium mb-1">Instant Minting</h4>
                          <p className="text-blue-300/80 text-sm">
                            Your SBT will be minted directly to your wallet immediately after confirmation. No waiting
                            required!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClaimPage;
