"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, Users, Sparkles, Target, Award, Youtube, Twitter, Instagram, Zap, CheckCircle2, Coins } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
    
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-monad-purple/30 bg-monad-purple/10 mb-8">
            <Sparkles className="h-3 w-3 text-monad-purple" />
            <span className="text-xs font-medium text-monad-purple uppercase tracking-wider">
              Range-Based Prediction Market
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Bet in{" "}
            <span className="text-monad-purple">
              Range
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 mb-4 max-w-3xl mx-auto leading-relaxed">
            Move beyond binary predictions. Bet on ranges and turn small losses into big wins.
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            That's how accuracy works. Predict within a range and earn rewards proportional to your precision.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/markets"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-monad-purple text-white font-semibold text-lg transition-all hover:shadow-[0_0_30px_-5px_rgba(135,109,255,0.5)] hover:scale-105"
            >
              Explore Markets
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/markets/create"
              className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold text-lg transition-all hover:border-monad-purple/50 hover:bg-white/10"
            >
              Start Range Betting
            </Link>
          </div>

        </div>
      </section>

      {/* Problem Statement */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-12 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Beyond <span className="text-monad-purple">Binary Predictions</span>
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed mb-6">
              Traditional prediction markets force you into binary choices—win or lose. We believe accuracy should be rewarded. <span className="text-white font-semibold">Bet on ranges instead of exact outcomes</span> and earn rewards based on how close you get.
            </p>
            <p className="text-base text-gray-500">
              Small losses when you're close, big wins when you're precise. That's how accuracy works.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            How It <span className="text-monad-purple">Works</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Simple steps to start range betting and earn rewards based on accuracy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm hover:border-monad-purple/30 transition-all">
            <div className="h-12 w-12 rounded-lg bg-monad-purple flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-white">1</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Login</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Connect via Farcaster, Google SignIn, or Wallet Connect
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm hover:border-monad-purple/30 transition-all">
            <div className="h-12 w-12 rounded-lg bg-monad-purple flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-white">2</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Create Profile</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Set up your avatar and choose a cool username
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm hover:border-monad-purple/30 transition-all">
            <div className="h-12 w-12 rounded-lg bg-monad-purple flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-white">3</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Choose Market</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Explore available markets and select what you want to predict
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm hover:border-monad-purple/30 transition-all">
            <div className="h-12 w-12 rounded-lg bg-monad-purple flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-white">4</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Bet in Range</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Select your prediction range instead of a single value. More accurate = bigger rewards
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm hover:border-monad-purple/30 transition-all">
            <div className="h-12 w-12 rounded-lg bg-monad-purple flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-white">5</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Earn by Accuracy</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Rewards scale with precision. Small losses when close, big wins when accurate
            </p>
          </div>
        </div>
      </section>

      {/* Score Mechanism */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Range-Based <span className="text-monad-purple">Rewards</span>
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Unlike binary markets, we reward accuracy through ranges. Predict within a range and earn proportionally. The closer you are, the more you win. Small losses when you're close, big wins when you're precise.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/5">
                <CheckCircle2 className="h-5 w-5 text-monad-purple flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Range Selection</h4>
                  <p className="text-sm text-gray-400">Choose your prediction range instead of a single value</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/5">
                <CheckCircle2 className="h-5 w-5 text-monad-purple flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Proportional Rewards</h4>
                  <p className="text-sm text-gray-400">Earn more when your prediction is more accurate</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/5">
                <CheckCircle2 className="h-5 w-5 text-monad-purple flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Small Losses, Big Wins</h4>
                  <p className="text-sm text-gray-400">Lose small when close, win big when precise</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/5">
                <CheckCircle2 className="h-5 w-5 text-monad-purple flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Accuracy Matters</h4>
                  <p className="text-sm text-gray-400">That's how accuracy works—reward precision over binary outcomes</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-8 backdrop-blur-sm">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Time Validity Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  {["1 Day", "7 Days", "1 Month", "Custom"].map((time) => (
                    <div
                      key={time}
                      className="p-3 rounded-lg border border-white/10 bg-white/5 text-center text-sm text-white"
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">Reward Distribution</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Rewards scale with accuracy. Predictions within range earn proportionally—the closer you are, the more you win. No all-or-nothing binary outcomes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Supported <span className="text-monad-purple">Markets</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Bet on cryptocurrencies, social media metrics, and various markets using range-based predictions
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "Cryptocurrencies", icon: Coins, color: "text-yellow-400" },
            { name: "Bitcoin", icon: Coins, color: "text-orange-500" },
            { name: "Ethereum", icon: Coins, color: "text-blue-400" },
            { name: "Altcoins", icon: TrendingUp, color: "text-green-400" },
            { name: "YouTube", icon: Youtube, color: "text-red-500" },
            { name: "Twitter", icon: Twitter, color: "text-blue-400" },
            { name: "Instagram", icon: Instagram, color: "text-pink-500" },
            { name: "Farcaster", icon: Users, color: "text-purple-400" },
          ].map((platform) => (
            <div
              key={platform.name}
              className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm hover:border-monad-purple/30 transition-all text-center"
            >
              <platform.icon className={`h-8 w-8 ${platform.color} mx-auto mb-3`} />
              <h3 className="text-white font-semibold">{platform.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Platform <span className="text-monad-purple">Features</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-xl border border-white/5 bg-white/5 p-8 backdrop-blur-sm hover:border-monad-purple/30 transition-all">
            <div className="h-12 w-12 rounded-lg bg-monad-purple flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Range Betting</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Move beyond binary predictions. Bet on ranges and earn rewards based on accuracy
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-8 backdrop-blur-sm hover:border-monad-purple/30 transition-all">
            <div className="h-12 w-12 rounded-lg bg-monad-purple flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Proportional Rewards</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Small losses when close, big wins when accurate. That's how accuracy works
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-8 backdrop-blur-sm hover:border-monad-purple/30 transition-all">
            <div className="h-12 w-12 rounded-lg bg-monad-purple flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Fair Distribution</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Transparent reward system that scales with prediction precision
            </p>
          </div>
        </div>
      </section>

      {/* Future Scope */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-12 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Future <span className="text-monad-purple">Scope</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Betting for specific posts",
                "PolyMarket Integration",
                "Limitless Bets",
                "Hybrid Betting Options",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5"
                >
                  <Sparkles className="h-4 w-4 text-monad-purple flex-shrink-0" />
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 mb-32">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center backdrop-blur-sm">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to <span className="text-monad-purple">Bet in Range?</span>
          </h2>
          <p className="text-gray-400 mb-8 text-lg max-w-2xl mx-auto">
            Move beyond binary predictions. Bet on ranges, earn based on accuracy. Small losses, big wins—that's how accuracy works.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/markets"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-monad-purple text-white font-semibold text-lg transition-all hover:shadow-[0_0_30px_-5px_rgba(135,109,255,0.5)] hover:scale-105"
            >
              Explore Markets
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/markets/create"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold text-lg transition-all hover:border-monad-purple/50 hover:bg-white/10"
            >
              Start Range Betting
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
