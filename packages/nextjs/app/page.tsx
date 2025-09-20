"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BoltIcon, CogIcon, ShieldCheckIcon, SparklesIcon, UserIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent)] opacity-70"></div>

      <div className="relative flex items-center flex-col grow pt-12 min-h-screen">
        {/* Hero Section */}
        <div className="px-6 text-center max-w-6xl z-10">
          <div className="mb-12">
            {/* Animated Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-300/30 mb-8">
              <SparklesIcon className="h-4 w-4 text-purple-300 mr-2" />
              <span className="text-purple-200 text-sm font-medium">Powered by Monad Blockchain</span>
            </div>

            {/* Main Title with Fancy Effects */}
            <h1 className="text-center mb-8">
              <span className="block text-4xl md:text-6xl mb-4 font-black">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                  Soul
                </span>
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Nad
                </span>
              </span>
              <span className="block text-lg md:text-xl text-purple-200 font-light tracking-wider">
                Soulbound Tokens for the Future
              </span>
            </h1>

            {/* Subtitle */}
            <div className="mb-8">
              <p className="text-xl md:text-2xl text-slate-300 mb-4 font-light">Monad Bitz 2025 Bangkok</p>
              <div className="max-w-4xl mx-auto">
                <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
                  Create <span className="text-purple-300 font-semibold">non-transferable digital certificates</span>{" "}
                  and achievements on the
                  <span className="text-blue-300 font-semibold"> Monad blockchain</span>. Perfect for events,
                  certifications, and digital identity.
                </p>
              </div>
            </div>
          </div>

          {/* Wallet Connection Card */}
          <div className="flex justify-center mb-16">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-center mb-3">
                <BoltIcon className="h-5 w-5 text-yellow-400 mr-2" />
                <span className="text-white font-medium">Wallet Status</span>
              </div>
              <Address address={connectedAddress} />
              <div className="mt-4 flex items-center justify-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${connectedAddress ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                ></div>
                <span className={`text-sm font-medium ${connectedAddress ? "text-green-300" : "text-red-300"}`}>
                  {connectedAddress ? "🔗 Connected to Monad Network" : "⚠️ Please connect your wallet"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="w-full px-6 pb-16 z-10">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Choose Your Path
                </span>
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Select your role to access the SBT ecosystem features
              </p>
            </div>

            {/* Cards Container */}
            <div className="flex justify-center items-stretch gap-8 flex-col lg:flex-row max-w-5xl mx-auto">
              {/* Client Card */}
              <div className="group flex-1 max-w-lg">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-300/30 rounded-3xl p-8 h-full transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
                  <div className="text-center">
                    {/* Icon */}
                    <div className="bg-gradient-to-br from-blue-400 to-purple-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                      <UserIcon className="h-10 w-10 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">View My SBTs</h3>

                    {/* Description */}
                    <p className="text-slate-300 mb-8 leading-relaxed text-lg">
                      Explore your collection of Soulbound Tokens. View certificates, achievements, and participation
                      badges from events and organizations.
                    </p>

                    {/* Button */}
                    <Link
                      href="/client"
                      className="group inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/30"
                    >
                      <span>Enter Client Dashboard</span>
                      <SparklesIcon className="h-5 w-5 ml-2 group-hover:animate-pulse" />
                    </Link>

                    {/* Badge */}
                    <div className="mt-6 flex items-center justify-center text-blue-300">
                      <ShieldCheckIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Blockchain Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issuer Card */}
              <div className="group flex-1 max-w-lg">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-300/30 rounded-3xl p-8 h-full transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
                  <div className="text-center">
                    {/* Icon */}
                    <div className="bg-gradient-to-br from-purple-400 to-pink-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                      <CogIcon className="h-10 w-10 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">Manage & Issue</h3>

                    {/* Description */}
                    <p className="text-slate-300 mb-8 leading-relaxed text-lg">
                      Create and distribute Soulbound Tokens to participants. Generate QR codes for events and track
                      distribution analytics.
                    </p>

                    {/* Button */}
                    <Link
                      href="/issuer"
                      className="group inline-flex items-center justify-center w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/30"
                    >
                      <span>Enter Issuer Dashboard</span>
                      <BoltIcon className="h-5 w-5 ml-2 group-hover:animate-pulse" />
                    </Link>

                    {/* Badge */}
                    <div className="mt-6 flex items-center justify-center text-purple-300">
                      <ShieldCheckIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Authorized Issuers Only</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-green-400/20 to-emerald-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheckIcon className="h-8 w-8 text-green-300" />
                </div>
                <h4 className="font-bold mb-3 text-white text-lg">Non-Transferable</h4>
                <p className="text-slate-400 leading-relaxed">
                  Permanently bound to your identity, cannot be sold or transferred
                </p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-br from-blue-400/20 to-cyan-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <UserIcon className="h-8 w-8 text-blue-300" />
                </div>
                <h4 className="font-bold mb-3 text-white text-lg">Verifiable Identity</h4>
                <p className="text-slate-400 leading-relaxed">
                  Cryptographically prove achievements with blockchain verification
                </p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-br from-purple-400/20 to-pink-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BoltIcon className="h-8 w-8 text-purple-300" />
                </div>
                <h4 className="font-bold mb-3 text-white text-lg">Easy Distribution</h4>
                <p className="text-slate-400 leading-relaxed">QR codes, batch uploads, or direct wallet distribution</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
