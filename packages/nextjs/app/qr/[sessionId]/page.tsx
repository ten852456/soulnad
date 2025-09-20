"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ArrowLeftIcon,
  QrCodeIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// Mock function to generate QR code (in real app, you'd use a QR library)
const generateQRCodeURL = (sessionId: string) => {
  const claimURL = `${window.location.origin}/claim/${sessionId}`;
  // Using a free QR code service for demo (in production, use a proper QR library)
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(claimURL)}`;
};

const QRDisplayPage: NextPage = () => {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const { address: connectedAddress, isConnected } = useAccount();

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

  const [sessionData, setSessionData] = useState<any>(null);

  const [timeRemaining, setTimeRemaining] = useState("");
  const [qrCodeURL, setQrCodeURL] = useState("");
  const [claimURL, setClaimURL] = useState("");
  const [copied, setCopied] = useState(false);

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
        active: sessionInfo.active,
        title: sessionInfo.title || templateInfo.name || "Token Claim Session"
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
        endTimestamp: Date.now() + (24 * 60 * 60 * 1000),
        active: true,
        title: "Monad Bitz 2025 Event Registration"
      });
    }
  }, [sessionInfo, templateInfo, isLoadingSession, isLoadingTemplate, sessionId]);

  useEffect(() => {
    if (sessionId) {
      const claimURL = `${window.location.origin}/claim/${sessionId}`;
      setClaimURL(claimURL);
      setQrCodeURL(generateQRCodeURL(sessionId));
    }
  }, [sessionId]);

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
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sessionData?.endTimestamp]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(claimURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeURL;
    link.download = `sbt-claim-qr-${sessionId.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const remainingMints = sessionData ? sessionData.maxMints - sessionData.currentMints : 0;
  const isExpired = sessionData ? Date.now() > sessionData.endTimestamp : false;
  const isMaxedOut = sessionData ? sessionData.currentMints >= sessionData.maxMints : false;
  const isActive = sessionData ? sessionData.active && !isExpired && !isMaxedOut : false;

  return (
    <>
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent)] opacity-70"></div>

      <div className="relative min-h-screen pb-16">
        {/* Header */}
        <div className="relative z-10 px-6 pt-8 pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/issuer"
                className="inline-flex items-center text-purple-300 hover:text-purple-200 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>

              {/* Wallet Info */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3">
                <div className="flex items-center text-white text-sm">
                  <QrCodeIcon className="h-4 w-4 text-blue-300 mr-2" />
                  <span className="hidden sm:inline">Session:</span>
                  <span className="font-mono text-xs ml-1">{sessionId.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  QR Code Generator
                </span>
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Share this QR code for users to claim their SBT directly
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 px-6">
          <div className="max-w-4xl mx-auto">
            {!sessionData ? (
              /* Loading State */
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white">Loading session data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* QR Code Section */}
              <div className="order-2 lg:order-1">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-6">Scan to Claim SBT</h2>

                    {/* QR Code */}
                    <div className="bg-white rounded-2xl p-6 mb-6 inline-block">
                      <img
                        src={qrCodeURL}
                        alt="QR Code for SBT Claim"
                        className="w-64 h-64 mx-auto"
                      />
                    </div>

                    {/* Share Options */}
                    <div className="space-y-3">
                      <button
                        onClick={copyToClipboard}
                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-500/20 backdrop-blur-xl border border-blue-300/30 text-blue-200 hover:bg-blue-500/30 rounded-xl transition-all duration-200"
                      >
                        {copied ? (
                          <>
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                            Copy Claim Link
                          </>
                        )}
                      </button>

                      <button
                        onClick={downloadQR}
                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-purple-500/20 backdrop-blur-xl border border-purple-300/30 text-purple-200 hover:bg-purple-500/30 rounded-xl transition-all duration-200"
                      >
                        <ShareIcon className="h-5 w-5 mr-2" />
                        Download QR Code
                      </button>
                    </div>

                    {/* Claim URL Display */}
                    <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
                      <p className="text-slate-400 text-sm mb-2">Claim URL:</p>
                      <p className="text-white font-mono text-xs break-all">{claimURL}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Info Section */}
              <div className="order-1 lg:order-2">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Session Details</h3>

                  {/* Session Status */}
                  <div className="mb-6">
                    {isActive ? (
                      <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-300/30 text-green-200 rounded-xl">
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Active
                      </div>
                    ) : isExpired ? (
                      <div className="inline-flex items-center px-4 py-2 bg-red-500/20 border border-red-300/30 text-red-200 rounded-xl">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                        Expired
                      </div>
                    ) : isMaxedOut ? (
                      <div className="inline-flex items-center px-4 py-2 bg-yellow-500/20 border border-yellow-300/30 text-yellow-200 rounded-xl">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                        Maxed Out
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-4 py-2 bg-gray-500/20 border border-gray-300/30 text-gray-200 rounded-xl">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                        Inactive
                      </div>
                    )}
                  </div>

                  {/* SBT Info */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">{sessionData.name}</h4>
                      <p className="text-slate-300 text-sm">{sessionData.description}</p>
                    </div>

                    <div className="flex items-center text-sm">
                      <span className="text-slate-400">Issuer:</span>
                      <Address address={sessionData.issuer} className="ml-2" />
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                      <div className="flex items-center text-blue-300 mb-2">
                        <UsersIcon className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">Minted</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {sessionData.currentMints} / {sessionData.maxMints}
                      </div>
                      <div className="text-xs text-slate-400">
                        {remainingMints} remaining
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                      <div className="flex items-center text-purple-300 mb-2">
                        <ClockIcon className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">Time Left</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {timeRemaining}
                      </div>
                      <div className="text-xs text-slate-400">
                        Until expiration
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-4 bg-blue-500/10 border border-blue-300/30 rounded-xl">
                    <div className="flex items-start">
                      <InformationCircleIcon className="h-5 w-5 text-blue-300 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-blue-200 font-medium mb-1">How it works</h4>
                        <p className="text-blue-300/80 text-sm">
                          Users scan the QR code or visit the claim link, connect their wallet, and instantly mint the SBT to their address. No approval needed!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default QRDisplayPage;