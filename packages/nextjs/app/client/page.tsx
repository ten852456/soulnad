"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CpuChipIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useSBTData } from "~~/hooks/useSBTData";

// SBT Data interface
interface SBTData {
  tokenId: bigint;
  name: string;
  description: string;
  issuer: string;
  mintedAt: bigint;
  templateId: bigint;
  sessionId: string;
  revoked: boolean;
}

interface EnrichedSBTData extends SBTData {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconGradient: string;
  iconBg: string;
  cardGradient: string;
  borderGradient: string;
  type: string;
  mintDate: string;
}

// Component to fetch and display individual SBT data
const SBTCard = ({ tokenId }: { tokenId: bigint }) => {
  const { sbtData, isLoading, error } = useSBTData(tokenId);

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-slate-500/20 to-slate-600/20 animate-pulse"></div>
        <div className="p-6 space-y-4">
          <div className="animate-pulse bg-white/20 h-6 w-3/4 rounded"></div>
          <div className="animate-pulse bg-white/20 h-4 w-full rounded"></div>
          <div className="animate-pulse bg-white/20 h-4 w-2/3 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !sbtData) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-300" />
        </div>
        <div className="p-6">
          <p className="text-red-200 text-sm">Error loading SBT data</p>
        </div>
      </div>
    );
  }

  const styling = getIconAndStyling(sbtData.name, sbtData.description);
  const IconComponent = styling.icon;
  const mintDate = new Date(Number(sbtData.mintedAt) * 1000).toLocaleDateString();

  return (
    <div
      className={`group bg-gradient-to-br ${styling.cardGradient} backdrop-blur-xl border ${styling.borderGradient} rounded-3xl overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/25`}
    >
      {/* Icon Header */}
      <div
        className={`relative h-48 bg-gradient-to-br ${styling.iconBg} overflow-hidden flex items-center justify-center`}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <div className="absolute top-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>

        {/* Main Icon */}
        <div
          className={`relative z-10 bg-gradient-to-br ${styling.iconGradient} p-8 rounded-3xl shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
        >
          <IconComponent className="h-16 w-16 text-white drop-shadow-lg" />
        </div>

        {/* Type Badge */}
        <div className="absolute top-4 left-4 z-20">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full text-white text-xs font-medium shadow-lg">
            {styling.type}
          </span>
        </div>

        {/* View Button */}
        <div className="absolute top-4 right-4 z-20">
          <button className="p-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl text-white hover:bg-white/30 transition-colors duration-200 shadow-lg">
            <EyeIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-50"></div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-200">
          {sbtData.name}
        </h3>

        <p className="text-slate-300 text-sm mb-4 line-clamp-2">{sbtData.description}</p>

        {/* Issuer Info */}
        <div className="flex items-center mb-4">
          <div className="bg-purple-400/20 p-2 rounded-lg mr-3">
            <ShieldCheckIcon className="h-4 w-4 text-purple-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">Issuer</p>
            <Address address={sbtData.issuer} className="text-xs" />
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-slate-300 text-sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>Minted: {mintDate}</span>
          </div>
          <div className="flex items-center text-slate-300 text-sm">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            <span>Token ID: #{sbtData.tokenId.toString()}</span>
          </div>
        </div>

        {/* Template and Session Info */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-300/30 rounded-lg text-purple-200 text-xs">
            Template: #{sbtData.templateId.toString()}
          </span>
          {sbtData.sessionId !== "0x" && (
            <span className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-300/30 rounded-lg text-blue-200 text-xs">
              Session: {sbtData.sessionId.slice(0, 8)}...
            </span>
          )}
          {sbtData.revoked && (
            <span className="px-2 py-1 bg-red-500/20 border border-red-300/30 rounded-lg text-red-200 text-xs">
              Revoked
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Icon and style mapping based on SBT content
const getIconAndStyling = (name: string, description: string) => {
  const nameAndDesc = (name + " " + description).toLowerCase();

  if (nameAndDesc.includes("hackathon") || nameAndDesc.includes("event") || nameAndDesc.includes("competition")) {
    return {
      icon: TrophyIcon,
      iconGradient: "from-yellow-400 to-orange-500",
      iconBg: "from-yellow-500/20 to-orange-500/20",
      cardGradient: "from-yellow-500/10 to-orange-500/10",
      borderGradient: "border-yellow-300/30",
      type: "Event Participation",
    };
  } else if (
    nameAndDesc.includes("certificate") ||
    nameAndDesc.includes("certification") ||
    nameAndDesc.includes("course")
  ) {
    return {
      icon: AcademicCapIcon,
      iconGradient: "from-blue-400 to-purple-500",
      iconBg: "from-blue-500/20 to-purple-500/20",
      cardGradient: "from-blue-500/10 to-purple-500/10",
      borderGradient: "border-blue-300/30",
      type: "Certification",
    };
  } else if (
    nameAndDesc.includes("achievement") ||
    nameAndDesc.includes("award") ||
    nameAndDesc.includes("recognition")
  ) {
    return {
      icon: StarIcon,
      iconGradient: "from-purple-400 to-pink-500",
      iconBg: "from-purple-500/20 to-pink-500/20",
      cardGradient: "from-purple-500/10 to-pink-500/10",
      borderGradient: "border-purple-300/30",
      type: "Achievement",
    };
  } else if (
    nameAndDesc.includes("contribution") ||
    nameAndDesc.includes("community") ||
    nameAndDesc.includes("volunteer")
  ) {
    return {
      icon: SparklesIcon,
      iconGradient: "from-green-400 to-emerald-500",
      iconBg: "from-green-500/20 to-emerald-500/20",
      cardGradient: "from-green-500/10 to-emerald-500/10",
      borderGradient: "border-green-300/30",
      type: "Community",
    };
  } else {
    // Default styling
    return {
      icon: DocumentTextIcon,
      iconGradient: "from-slate-400 to-slate-500",
      iconBg: "from-slate-500/20 to-slate-500/20",
      cardGradient: "from-slate-500/10 to-slate-500/10",
      borderGradient: "border-slate-300/30",
      type: "SBT",
    };
  }
};

const ClientDashboard: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();

  // Get user's SBT token IDs
  const {
    data: userSBTIds,
    isLoading: isLoadingIds,
    error: idsError,
  } = useScaffoldReadContract({
    contractName: "SBTToken",
    functionName: "getUserSBTs",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: {
      enabled: !!connectedAddress && isConnected,
      staleTime: 30000, // 30 seconds
      refetchInterval: 60000, // 1 minute
    },
  });

  // Get user's total SBT count
  const { data: totalSBTs, isLoading: isLoadingCount } = useScaffoldReadContract({
    contractName: "SBTToken",
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: {
      enabled: !!connectedAddress && isConnected,
      staleTime: 30000,
      refetchInterval: 60000,
    },
  });

  // Simple stats from token IDs
  const totalCount = userSBTIds ? userSBTIds.length : 0;
  // We'll calculate other stats later when individual SBT data is loaded

  // Loading and error states
  const isLoading = isLoadingIds || isLoadingCount;
  const hasError = idsError;

  if (!isConnected) {
    return (
      <>
        {/* Background Pattern */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
        <div
          className="fixed inset-0 opacity-70"
          style={{ background: "radial-gradient(ellipse at top, rgba(120,119,198,0.3), transparent)" }}
        ></div>

        <div className="relative min-h-screen flex items-center justify-center pb-16">
          <div className="text-center p-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 max-w-md mx-auto">
              <UserIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-slate-400 mb-6">Please connect your wallet to view your SBT collection.</p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div>
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div
        className="fixed inset-0 opacity-70"
        style={{
          background: "radial-gradient(ellipse at top, rgba(120,119,198,0.3), transparent)",
        }}
      ></div>

      <div className="relative min-h-screen pb-16">
        {/* Header */}
        <div className="relative z-10 px-6 pt-8 pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <Link
              href="/"
              className="inline-flex items-center text-purple-300 hover:text-purple-200 transition-colors duration-200 mb-6"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Home
            </Link>

            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    My SBT Collection
                  </span>
                </h1>
                <p className="text-slate-300 text-lg">View and verify your Soulbound Tokens</p>
              </div>

              {/* Wallet Info */}
              <div className="mt-6 lg:mt-0">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <UserIcon className="h-4 w-4 text-blue-300 mr-2" />
                    <span className="text-white text-sm font-medium">Connected Wallet</span>
                  </div>
                  <Address address={connectedAddress} />
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-300/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium mb-1">Total SBTs</p>
                    {isLoading ? (
                      <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                    ) : (
                      <p className="text-white text-3xl font-bold">{totalCount}</p>
                    )}
                  </div>
                  <div className="bg-blue-400/20 p-3 rounded-xl">
                    <TrophyIcon className="h-8 w-8 text-blue-300" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-300/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm font-medium mb-1">Achievements</p>
                    {isLoading ? (
                      <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                    ) : (
                      <p className="text-white text-3xl font-bold">-</p>
                    )}
                  </div>
                  <div className="bg-purple-400/20 p-3 rounded-xl">
                    <StarIcon className="h-8 w-8 text-purple-300" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-300/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm font-medium mb-1">Certificates</p>
                    {isLoading ? (
                      <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                    ) : (
                      <p className="text-white text-3xl font-bold">-</p>
                    )}
                  </div>
                  <div className="bg-green-400/20 p-3 rounded-xl">
                    <DocumentTextIcon className="h-8 w-8 text-green-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search SBTs..."
                    className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
              <button className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors duration-200">
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {hasError && (
          <div className="relative z-10 px-6 mb-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-500/20 backdrop-blur-xl border border-red-300/30 rounded-xl p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-300 mr-2" />
                  <p className="text-red-200 text-sm">Error loading SBTs. Please try again.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="relative z-10 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden"
                  >
                    <div className="h-48 bg-gradient-to-br from-slate-500/20 to-slate-600/20 animate-pulse"></div>
                    <div className="p-6 space-y-4">
                      <div className="animate-pulse bg-white/20 h-6 w-3/4 rounded"></div>
                      <div className="animate-pulse bg-white/20 h-4 w-full rounded"></div>
                      <div className="animate-pulse bg-white/20 h-4 w-2/3 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SBT Grid */}
        {!isLoading && !hasError && (
          <div className="relative z-10 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {userSBTIds && userSBTIds.length > 0 ? (
                  userSBTIds.map((tokenId: bigint) => (
                    <SBTCard key={tokenId.toString()} tokenId={tokenId} />
                  ))
                ) : (
                  /* Empty State (when no SBTs) */
                  <div className="text-center py-16 col-span-full">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 max-w-md mx-auto">
                      <TrophyIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">No SBTs Yet</h3>
                      <p className="text-slate-400 mb-6">
                        You haven't received any Soulbound Tokens yet. Participate in events or earn certifications to
                        get your first SBT!
                      </p>
                      <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Explore Events
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
