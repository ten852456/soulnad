"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { decodeEventLog } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const CreateSBT: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();

  // Get contract info for event parsing
  const { data: sbtTemplateContract } = useDeployedContractInfo("SBTTemplate");
  const { data: sbtSessionContract } = useDeployedContractInfo("SBTSession");

  // Form state
  const [formData, setFormData] = useState({
    name: "Monad Bitz 2025 Bangkok",
    description: "Soulbound Token for Developer who intercept with Chao and Monad",
    maxMints: 100,
    duration: 24,
    sessionTitle: "Monad Bitz 2025 Event Registration",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<"template" | "session" | "complete">("template");

  // Contract interactions
  const { writeContractAsync: writeTemplate } = useScaffoldWriteContract("SBTTemplate");
  const { writeContractAsync: writeSession } = useScaffoldWriteContract("SBTSession");

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim() || !formData.description.trim() || !formData.maxMints || !formData.duration) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.maxMints < 1 || formData.duration < 1) {
      alert("Max mints and duration must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    setTemplateId(null);
    setSessionId(null);

    try {
      // Step 1: Create Template
      setCurrentStep("template");
      console.log("Creating template...");

      const templateTx = await writeTemplate({
        functionName: "createTemplate",
        args: [formData.name.trim(), formData.description.trim()],
      });

      console.log("Template creation transaction:", templateTx);

      // Wait for the template creation transaction to be mined and get the real template ID
      console.log("Waiting for template creation transaction to be mined...");
      const templateReceipt = await publicClient?.waitForTransactionReceipt({
        hash: templateTx,
        confirmations: 1,
      });

      if (!templateReceipt) {
        throw new Error("Failed to get template creation transaction receipt");
      }

      // Parse the TemplateCreated event to get the actual template ID
      let realTemplateId: number | null = null;

      if (sbtTemplateContract) {
        for (const log of templateReceipt.logs) {
          try {
            if (log.address.toLowerCase() === sbtTemplateContract.address.toLowerCase()) {
              const decodedLog = decodeEventLog({
                abi: sbtTemplateContract.abi,
                data: log.data,
                topics: log.topics,
              });

              if (decodedLog.eventName === "TemplateCreated") {
                realTemplateId = Number(decodedLog.args.templateId);
                console.log("Real template ID from blockchain:", realTemplateId);
                setTemplateId(realTemplateId);
                break;
              }
            }
          } catch {
            // Skip logs that can't be decoded
            continue;
          }
        }
      }

      if (realTemplateId === null) {
        throw new Error("TemplateCreated event not found in transaction receipt");
      }

      // Step 2: Create Session
      setCurrentStep("session");
      console.log("Creating session with template ID:", realTemplateId);

      const durationInSeconds = formData.duration * 60 * 60; // Convert hours to seconds

      const sessionTx = await writeSession({
        functionName: "createSession",
        args: [
          realTemplateId, // templateId (real ID from blockchain)
          formData.maxMints, // maxMints
          durationInSeconds, // durationInSeconds
          formData.sessionTitle.trim() || `Session for ${formData.name}`, // title
        ],
      });

      console.log("Session creation transaction:", sessionTx);

      // Wait for the session creation transaction to be mined and get the real session ID
      console.log("Waiting for session creation transaction to be mined...");
      const sessionReceipt = await publicClient?.waitForTransactionReceipt({
        hash: sessionTx,
        confirmations: 1,
      });

      if (!sessionReceipt) {
        throw new Error("Failed to get session creation transaction receipt");
      }

      // Parse the SessionCreated event to get the actual session ID
      let realSessionId: string | null = null;

      if (sbtSessionContract) {
        for (const log of sessionReceipt.logs) {
          try {
            if (log.address.toLowerCase() === sbtSessionContract.address.toLowerCase()) {
              const decodedLog = decodeEventLog({
                abi: sbtSessionContract.abi,
                data: log.data,
                topics: log.topics,
              });

              if (decodedLog.eventName === "SessionCreated") {
                realSessionId = decodedLog.args.sessionId as string;
                console.log("Real session ID from blockchain:", realSessionId);
                setSessionId(realSessionId);
                break;
              }
            }
          } catch {
            // Skip logs that can't be decoded
            continue;
          }
        }
      }

      if (realSessionId === null) {
        throw new Error("SessionCreated event not found in transaction receipt");
      }

      setCurrentStep("complete");
    } catch (error) {
      console.error("Error creating template/session:", error);
      alert(`Failed to create ${currentStep}. Please try again.`);
      setCurrentStep("template");
    } finally {
      setIsSubmitting(false);
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
                  <ShieldCheckIcon className="h-4 w-4 text-green-300 mr-2" />
                  <span className="hidden sm:inline">Authorized Issuer:</span>
                  <Address address={connectedAddress} />
                </div>
              </div>
            </div>

            {/* Page Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-300/30 mb-6">
                <SparklesIcon className="h-4 w-4 text-purple-300 mr-2" />
                <span className="text-purple-200 text-sm font-medium">Create New SBT</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Design Your Token
                </span>
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Create a new Soulbound Token template for your event, certification, or achievement program
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-400/20 p-3 rounded-xl mr-4">
                      <DocumentTextIcon className="h-6 w-6 text-purple-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">SBT Details</h2>
                      <p className="text-slate-300">Configure your Soulbound Token metadata</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Token Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => handleInputChange("name", e.target.value)}
                          className="w-full bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300/50 transition-all duration-200"
                          placeholder="Enter token name..."
                          required
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-200"></div>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">This will be the name shown on all minted tokens</p>
                    </div>

                    {/* Description Field */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Description <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={e => handleInputChange("description", e.target.value)}
                        rows={4}
                        className="w-full bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300/50 transition-all duration-200 resize-none"
                        placeholder="Describe what this SBT represents..."
                        required
                      />
                      <p className="text-slate-400 text-sm mt-1">
                        Explain what this SBT represents and its significance
                      </p>
                    </div>

                    {/* Session Configuration */}
                    <div className="border-t border-white/10 pt-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <SparklesIcon className="h-5 w-5 text-purple-400 mr-2" />
                        Session Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Max Mints Field */}
                        <div>
                          <label className="block text-white font-medium mb-2">
                            Max Mints <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.maxMints}
                            onChange={e => handleInputChange("maxMints", parseInt(e.target.value) || 1)}
                            className="w-full bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300/50 transition-all duration-200"
                            placeholder="100"
                            min="1"
                            required
                          />
                          <p className="text-slate-400 text-sm mt-1">Maximum number of tokens that can be minted</p>
                        </div>

                        {/* Duration Field */}
                        <div>
                          <label className="block text-white font-medium mb-2">
                            Duration (Hours) <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.duration}
                            onChange={e => handleInputChange("duration", parseInt(e.target.value) || 1)}
                            className="w-full bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300/50 transition-all duration-200"
                            placeholder="24"
                            min="1"
                            required
                          />
                          <p className="text-slate-400 text-sm mt-1">How long the session will remain active</p>
                        </div>
                      </div>

                      {/* Session Title Field */}
                      <div className="mt-4">
                        <label className="block text-white font-medium mb-2">
                          Session Title <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.sessionTitle}
                          onChange={e => handleInputChange("sessionTitle", e.target.value)}
                          className="w-full bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300/50 transition-all duration-200"
                          placeholder="Enter session title..."
                        />
                        <p className="text-slate-400 text-sm mt-1">Optional title for this minting session</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6">
                      {currentStep === "complete" && sessionId ? (
                        <div className="text-center">
                          <div className="inline-flex items-center px-6 py-4 bg-green-500/20 border border-green-300/30 text-green-200 rounded-xl mb-4">
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            SBT template and session created successfully!
                          </div>
                          <div className="space-y-4">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400">Template ID:</span>
                                  <span className="text-white ml-2">{templateId}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Session ID:</span>
                                  <span className="text-white ml-2 font-mono text-xs">{sessionId.slice(0, 10)}...</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Link
                                href={`/qr/${sessionId}`}
                                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300"
                              >
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                Generate QR Code
                              </Link>
                              <Link
                                href="/issuer"
                                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                              >
                                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                                Back to Dashboard
                              </Link>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              {currentStep === "template"
                                ? "Creating Template..."
                                : currentStep === "session"
                                  ? "Creating Session..."
                                  : "Processing..."}
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              Create SBT & Session
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Info Section */}
              <div className="lg:col-span-1">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sticky top-8">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-400/20 p-3 rounded-xl mr-4">
                      <InformationCircleIcon className="h-6 w-6 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white">What&apos;s Next?</h3>
                  </div>

                  {/* SBT Preview Card */}
                  <div className="bg-gradient-to-br from-purple-400/10 to-pink-400/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden mb-6">
                    {/* Preview Icon Header */}
                    <div className="relative h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 flex items-center justify-center">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-xl">
                        <SparklesIcon className="h-8 w-8 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Preview Content */}
                    <div className="p-4">
                      <h4 className="text-white font-bold mb-2 truncate">
                        {formData.name || "Your SBT Name"}
                      </h4>
                      <p className="text-slate-300 text-sm line-clamp-2">
                        {formData.description || "Your SBT description will appear here..."}
                      </p>
                    </div>
                  </div>

                  {/* Info Steps */}
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-purple-500/20 p-2 rounded-lg mr-3 mt-1">
                        <span className="text-purple-300 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Create Design</h4>
                        <p className="text-slate-300 text-sm">Set up your SBT name and description</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-purple-500/20 p-2 rounded-lg mr-3 mt-1">
                        <span className="text-purple-300 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Create Session</h4>
                        <p className="text-slate-300 text-sm">Set up minting sessions with time limits</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-purple-500/20 p-2 rounded-lg mr-3 mt-1">
                        <span className="text-purple-300 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Distribute</h4>
                        <p className="text-slate-300 text-sm">Generate QR codes or mint directly to wallets</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateSBT;