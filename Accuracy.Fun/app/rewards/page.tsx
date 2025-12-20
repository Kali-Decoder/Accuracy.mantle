"use client";

import Link from "next/link";
import { ArrowLeft, Award } from "lucide-react";
import { RewardDistributionFlow } from "../components/RewardDistributionFlow";

export default function RewardsPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-monad-purple flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Reward Distribution <span className="text-monad-purple">Flow</span>
              </h1>
              <p className="text-gray-400 mt-2">
                Understand how rewards are calculated and distributed based on prediction accuracy
              </p>
            </div>
          </div>
        </div>

        {/* Key Information */}
        <div className="mb-12 rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Key Factors</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-monad-purple mt-1">•</span>
                  <span>Equal bet amounts for all users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-monad-purple mt-1">•</span>
                  <span>Minimum users required to start</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-monad-purple mt-1">•</span>
                  <span>Defined betting period</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-monad-purple mt-1">•</span>
                  <span>Pool period longer than betting period</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-monad-purple mt-1">•</span>
                  <span>100% pool distribution guaranteed</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Formulas</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg border border-white/10 bg-black/20">
                  <div className="text-gray-400 mb-1">Distance Calculation</div>
                  <div className="text-white font-mono">Distance(i) = |Predicted - Actual|</div>
                </div>
                <div className="p-3 rounded-lg border border-white/10 bg-black/20">
                  <div className="text-gray-400 mb-1">Accuracy Score</div>
                  <div className="text-white font-mono">Accuracy(i) = 1 / (Distance(i) + 1)</div>
                </div>
                <div className="p-3 rounded-lg border border-white/10 bg-black/20">
                  <div className="text-gray-400 mb-1">Reward Distribution</div>
                  <div className="text-white font-mono">
                    Reward(i) = (Accuracy(i) / Total Accuracy) × Pool
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Flow */}
        <div className="mb-8">
          <RewardDistributionFlow />
        </div>

        {/* Additional Information */}
        <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white mb-4">How It Works</h3>
          <div className="space-y-4 text-gray-300">
            <p>
              The reward distribution system ensures that <span className="text-white font-semibold">100% of the pool is distributed</span> among all participants based on their prediction accuracy. The closer your prediction is to the actual score, the higher your accuracy score and reward share.
            </p>
            <p>
              <span className="text-white font-semibold">Perfect matches</span> (distance = 0) receive the highest accuracy score of 1.0, while predictions further from the actual score receive proportionally lower accuracy scores. The entire pool is then distributed relative to each user's accuracy score.
            </p>
            <p className="text-sm text-gray-400">
              This mechanism guarantees fairness and ensures that all participants have a chance to earn rewards based on their prediction accuracy, with the entire pool being distributed without any leftover funds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

