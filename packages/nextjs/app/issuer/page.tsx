"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// Mock issuer data
const mockIssuerStats = {
  totalIssued: 1247,
  activeTemplates: 8,
  thisMonth: 156,
  pendingClaims: 23,
};

// Mock issued SBTs with icons
const mockIssuedSBTs = [
  {
    id: 1,
    name: "Monad Bitz 2025 Bangkok",
    description: "Certificate of participation in Monad Bitz 2025 hackathon",
    icon: "🏆",
    iconGradient: "from-yellow-400 to-orange-500",
    iconBg: "from-yellow-500/20 to-orange-500/20",
    totalMinted: 423,
    template: true,
    status: "active",
    createdDate: "2025-01-15",
    distributionMethod: "QR Code",
    claimRate: "89%",
  },
  {
    id: 2,
    name: "Workshop Completion",
    description: "Completion certificate for Smart Contract Development workshop",
    icon: "🎓",
    iconGradient: "from-blue-400 to-purple-500",
    iconBg: "from-blue-500/20 to-purple-500/20",
    totalMinted: 67,
    template: true,
    status: "active",
    createdDate: "2025-01-10",
    distributionMethod: "Batch",
    claimRate: "100%",
  },
  {
    id: 3,
    name: "Speaker Badge",
    description: "Recognition for speaking at the event",
    icon: "🎤",
    iconGradient: "from-green-400 to-emerald-500",
    iconBg: "from-green-500/20 to-emerald-500/20",
    totalMinted: 12,
    template: false,
    status: "completed",
    createdDate: "2025-01-08",
    distributionMethod: "Direct",
    claimRate: "100%",
  },
];

// Mock recent activities
const mockActivities = [
  {
    id: 1,
    type: "mint",
    action: "SBT Minted",
    details: "Monad Bitz 2025 Bangkok minted to 0x1234...5678",
    timestamp: "2 hours ago",
    status: "success",
  },
  {
    id: 2,
    type: "claim",
    action: "QR Code Claimed",
    details: "5 new claims for Workshop Completion certificate",
    timestamp: "4 hours ago",
    status: "success",
  },
  {
    id: 3,
    type: "template",
    action: "Template Created",
    details: "New template created: Advanced Developer Badge",
    timestamp: "1 day ago",
    status: "pending",
  },
  {
    id: 4,
    type: "revoke",
    action: "SBT Revoked",
    details: "Revoked due to policy violation",
    timestamp: "2 days ago",
    status: "warning",
  },
];

const IssuerDashboard: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [templates, setTemplates] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Get issuer's templates (you'll need to implement getIssuerTemplates in your contract)
  const { data: issuerTemplates, isLoading: isLoadingTemplates } = useScaffoldReadContract({
    contractName: "SBTTemplate",
    functionName: "getIssuerTemplates",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: {
      enabled: !!connectedAddress && isConnected,
    },
  });

  // Get total SBTs issued by this issuer (you'll need this function in your contract)
  const { data: totalIssued } = useScaffoldReadContract({
    contractName: "SBTToken",
    functionName: "getIssuerSBTCount",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: {
      enabled: !!connectedAddress && isConnected,
    },
  });

  // Fetch additional data when templates change
  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!issuerTemplates || issuerTemplates.length === 0) {
        setTemplates([]);
        setSessions([]);
        return;
      }

      setIsLoadingData(true);
      try {
        // For now, create formatted template data
        const formattedTemplates = issuerTemplates.map((template: any, index: number) => ({
          id: template.templateId || index + 1,
          name: template.name || `Template #${index + 1}`,
          description: template.description || "Template description",
          icon: "🏆",
          iconGradient: "from-yellow-400 to-orange-500",
          iconBg: "from-yellow-500/20 to-orange-500/20",
          totalMinted: 0, // TODO: Get from contract
          template: true,
          status: template.active ? "active" : "inactive",
          createdDate: new Date(Number(template.createdAt) * 1000).toLocaleDateString(),
          distributionMethod: "QR Code",
          claimRate: "0%",
        }));

        setTemplates(formattedTemplates);
      } catch (error) {
        console.error("Error fetching additional data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAdditionalData();
  }, [issuerTemplates]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-400" />;
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <>
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent)] opacity-70"></div>

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
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    Issuer Dashboard
                  </span>
                </h1>
                <p className="text-slate-300 text-lg">Manage and distribute Soulbound Tokens</p>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/create"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create SBT
                </Link>
                <button className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 rounded-xl transition-colors duration-200">
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                  Generate QR
                </button>
              </div>
            </div>

            {/* Issuer Verification */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-300/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-400/20 p-3 rounded-xl mr-4">
                    <ShieldCheckIcon className="h-8 w-8 text-green-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">Authorized Issuer</h3>
                    <p className="text-green-200">You are verified to issue SBTs on the Monad network</p>
                    <Address address={connectedAddress} />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="px-4 py-2 bg-green-400/20 border border-green-300/30 rounded-xl text-green-200 text-sm font-medium">
                    ✓ Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-300/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-400/20 p-3 rounded-xl">
                    <UsersIcon className="h-6 w-6 text-blue-300" />
                  </div>
                  <span className="text-blue-200 text-sm">Total</span>
                </div>
                <p className="text-white text-3xl font-bold mb-1">
                  {isLoadingTemplates ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                  ) : (
                    (totalIssued || 0).toString()
                  )}
                </p>
                <p className="text-blue-200 text-sm">SBTs Issued</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-300/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-400/20 p-3 rounded-xl">
                    <DocumentArrowUpIcon className="h-6 w-6 text-purple-300" />
                  </div>
                  <span className="text-purple-200 text-sm">Active</span>
                </div>
                <p className="text-white text-3xl font-bold mb-1">
                  {isLoadingTemplates ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                  ) : (
                    templates.filter(t => t.status === "active").length
                  )}
                </p>
                <p className="text-purple-200 text-sm">Templates</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-300/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-400/20 p-3 rounded-xl">
                    <ChartBarIcon className="h-6 w-6 text-green-300" />
                  </div>
                  <span className="text-green-200 text-sm">This Month</span>
                </div>
                <p className="text-white text-3xl font-bold mb-1">0</p>
                <p className="text-green-200 text-sm">New Mints</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-300/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-400/20 p-3 rounded-xl">
                    <ClockIcon className="h-6 w-6 text-yellow-300" />
                  </div>
                  <span className="text-yellow-200 text-sm">Pending</span>
                </div>
                <p className="text-white text-3xl font-bold mb-1">{sessions.length}</p>
                <p className="text-yellow-200 text-sm">Claims</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Issued SBTs */}
              <div className="xl:col-span-2">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Issued SBTs</h2>
                    <button className="text-purple-300 hover:text-purple-200 text-sm font-medium">View All →</button>
                  </div>

                  <div className="space-y-4">
                    {templates.map(sbt => (
                      <div
                        key={sbt.id}
                        className={`bg-gradient-to-r ${sbt.iconBg} backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]`}
                      >
                        <div className="flex items-center space-x-4">
                          {/* Beautiful Icon Display */}
                          <div
                            className={`relative w-16 h-16 bg-gradient-to-br ${sbt.iconGradient} rounded-2xl flex items-center justify-center shadow-lg hover:rotate-6 transition-transform duration-300`}
                          >
                            <span className="text-3xl drop-shadow-lg">{sbt.icon}</span>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-white truncate">{sbt.name}</h3>
                              <span
                                className={`px-2 py-1 rounded-lg text-xs font-medium shadow-sm ${
                                  sbt.status === "active"
                                    ? "bg-green-400/20 text-green-300 border border-green-300/30"
                                    : "bg-gray-400/20 text-gray-300 border border-gray-300/30"
                                }`}
                              >
                                {sbt.status}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm truncate">{sbt.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                              <span className="flex items-center">
                                <UsersIcon className="h-3 w-3 mr-1" />
                                Minted: {sbt.totalMinted}
                              </span>
                              <span>Method: {sbt.distributionMethod}</span>
                              <span className="text-green-400 font-medium">Claim Rate: {sbt.claimRate}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                              <QrCodeIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="xl:col-span-1">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>

                  <div className="space-y-4">
                    {mockActivities.map(activity => (
                      <div
                        key={activity.id}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">{getStatusIcon(activity.status)}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white text-sm font-medium mb-1">{activity.action}</h4>
                            <p className="text-slate-400 text-xs leading-relaxed mb-2">{activity.details}</p>
                            <div className="flex items-center text-xs text-slate-500">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {activity.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-6 py-3 text-purple-300 hover:text-purple-200 text-sm font-medium transition-colors duration-200">
                    View All Activity →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/create"
                className="group bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-300/30 rounded-3xl p-8 text-left hover:scale-105 transition-all duration-300"
              >
                <div className="bg-blue-400/20 p-4 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <PlusIcon className="h-8 w-8 text-blue-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Create New SBT</h3>
                <p className="text-slate-300">Design and deploy a new Soulbound Token template</p>
              </Link>

              <button className="group bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-300/30 rounded-3xl p-8 text-left hover:scale-105 transition-all duration-300">
                <div className="bg-purple-400/20 p-4 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <DocumentArrowUpIcon className="h-8 w-8 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Batch Mint</h3>
                <p className="text-slate-300">Upload CSV to mint SBTs to multiple recipients</p>
              </button>

              <button className="group bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-300/30 rounded-3xl p-8 text-left hover:scale-105 transition-all duration-300">
                <div className="bg-green-400/20 p-4 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ChartBarIcon className="h-8 w-8 text-green-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
                <p className="text-slate-300">View detailed stats and distribution analytics</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IssuerDashboard;
