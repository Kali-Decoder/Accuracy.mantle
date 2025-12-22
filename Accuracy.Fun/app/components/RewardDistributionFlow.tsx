"use client";

import { useState, useEffect } from "react";
import { Users, Clock, Target, TrendingUp, Award, Calculator, ArrowRight, CheckCircle2 } from "lucide-react";

interface User {
  id: number;
  name: string;
  predictedScore: number;
  distance?: number;
  accuracy?: number;
  reward?: number;
}

export function RewardDistributionFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Example data
  const actualScore = 850;
  const poolAmount = 400;
  const betAmount = 100;
  const minUsers = 3;
  const bettingPeriod = "7 days";
  const poolPeriod = "10 days";

  const users: User[] = [
    { id: 1, name: "Alice", predictedScore: 820 },
    { id: 2, name: "Bob", predictedScore: 850 },
    { id: 3, name: "Charlie", predictedScore: 880 },
    { id: 4, name: "Diana", predictedScore: 830 },
  ];

  // Calculate distances
  const usersWithCalculations = users.map((user) => {
    const distance = Math.abs(user.predictedScore - actualScore);
    const accuracy = 1 / (distance + 1);
    return { ...user, distance, accuracy };
  });

  // Calculate total accuracy
  const totalAccuracy = usersWithCalculations.reduce((sum, user) => sum + (user.accuracy || 0), 0);

  // Calculate rewards
  const usersWithRewards = usersWithCalculations.map((user) => {
    const reward = ((user.accuracy || 0) / totalAccuracy) * poolAmount;
    return { ...user, reward };
  });

  const steps = [
    {
      title: "Users Place Bets",
      description: `All users bet equal amount: ${betAmount} tokens`,
      icon: Users,
      showUsers: true,
      showPool: false,
      showCalculations: false,
    },
    {
      title: "Minimum Users Check",
      description: `Pool requires minimum ${minUsers} users to start`,
      icon: CheckCircle2,
      showUsers: true,
      showPool: false,
      showCalculations: false,
    },
    {
      title: "Betting Period",
      description: `Betting period: ${bettingPeriod}`,
      icon: Clock,
      showUsers: true,
      showPool: true,
      showCalculations: false,
    },
    {
      title: "Pool Period",
      description: `Pool period: ${poolPeriod} (longer than betting period)`,
      icon: Clock,
      showUsers: true,
      showPool: true,
      showCalculations: false,
    },
    {
      title: "Actual Score Calculated",
      description: `Actual Score: ${actualScore}`,
      icon: Target,
      showUsers: true,
      showPool: true,
      showCalculations: false,
      showActualScore: true,
    },
    {
      title: "Calculate Distances",
      description: "Distance = |Predicted - Actual|",
      icon: Calculator,
      showUsers: true,
      showPool: true,
      showCalculations: true,
      showDistances: true,
    },
    {
      title: "Calculate Accuracy Scores",
      description: "Accuracy = 1 / (Distance + 1)",
      icon: TrendingUp,
      showUsers: true,
      showPool: true,
      showCalculations: true,
      showAccuracy: true,
    },
    {
      title: "Distribute Rewards",
      description: "Reward = (Accuracy / Total Accuracy) × Pool",
      icon: Award,
      showUsers: true,
      showPool: true,
      showCalculations: true,
      showRewards: true,
    },
  ];

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isPlaying, steps.length]);

  const currentStepData = steps[currentStep];

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => {
            setIsPlaying(!isPlaying);
            if (!isPlaying) setCurrentStep(0);
          }}
          className="px-6 py-2 rounded-xl bg-monad-purple text-white font-semibold transition-all hover:shadow-[0_0_20px_-5px_rgba(135,109,255,0.5)]"
        >
          {isPlaying ? "Pause" : "Start Animation"}
        </button>
        <button
          onClick={() => setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length)}
          className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white transition-all hover:border-monad-purple/50"
        >
          ← Prev
        </button>
        <button
          onClick={() => setCurrentStep((prev) => (prev + 1) % steps.length)}
          className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white transition-all hover:border-monad-purple/50"
        >
          Next →
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentStep
                ? "w-8 bg-monad-purple"
                : index < currentStep
                ? "w-2 bg-monad-purple/50"
                : "w-2 bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Current Step Info */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-lg bg-monad-purple flex items-center justify-center">
            <currentStepData.icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">{currentStepData.title}</h3>
        </div>
        <p className="text-gray-400 text-lg">{currentStepData.description}</p>
      </div>

      {/* Visualization */}
      <div className="relative min-h-[500px] rounded-2xl border border-white/5 bg-white/5 p-8 backdrop-blur-sm">
        {/* Pool Display - Fixed positioning */}
        {currentStepData.showPool && (
          <div className="mb-6 flex justify-center md:justify-end animate-fade-in">
            <div className="rounded-xl border border-monad-purple/30 bg-monad-purple/10 p-4 w-full md:w-auto md:min-w-[180px] text-center md:text-left">
              <div className="text-xs text-gray-400 mb-1">Total Pool</div>
              <div className="text-2xl font-bold text-monad-purple">{poolAmount} tokens</div>
              {currentStep >= 4 && (
                <div className="mt-2 text-xs text-gray-400">
                  <div>Actual Score: <span className="text-white font-semibold">{actualScore}</span></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Grid */}
        {currentStepData.showUsers && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {users.map((user, index) => {
              const userData = usersWithRewards[index];
              const isAnimated = currentStep >= index + 1;
              
              return (
                <div
                  key={user.id}
                  className={`rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm transition-all ${
                    isAnimated ? "opacity-100 animate-fade-in" : "opacity-50"
                  }`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-monad-purple flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{user.name[0]}</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{user.name}</div>
                      <div className="text-xs text-gray-400">Bet: {betAmount} tokens</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Predicted Score</div>
                      <div className="text-lg font-bold text-white">{user.predictedScore}</div>
                    </div>

                    {currentStepData.showDistances && userData.distance !== undefined && (
                      <div className="mt-3 pt-3 border-t border-white/10 animate-fade-in">
                        <div className="text-xs text-gray-400 mb-1">Distance</div>
                        <div className="text-sm font-mono text-yellow-400">
                          |{user.predictedScore} - {actualScore}| = {userData.distance}
                        </div>
                      </div>
                    )}

                    {currentStepData.showAccuracy && userData.accuracy !== undefined && (
                      <div className="mt-3 pt-3 border-t border-white/10 animate-fade-in">
                        <div className="text-xs text-gray-400 mb-1">Accuracy</div>
                        <div className="text-sm font-mono text-green-400">
                          1 / ({userData.distance} + 1) = {userData.accuracy.toFixed(4)}
                        </div>
                      </div>
                    )}

                    {currentStepData.showRewards && userData.reward !== undefined && (
                      <div className="mt-3 pt-3 border-t border-monad-purple/30 bg-monad-purple/10 rounded-lg p-3 animate-fade-in">
                        <div className="text-xs text-gray-400 mb-1">Reward Share</div>
                        <div className="text-xl font-bold text-monad-purple">
                          {userData.reward.toFixed(2)} tokens
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 font-mono">
                          ({userData.accuracy?.toFixed(4)} / {totalAccuracy.toFixed(4)}) × {poolAmount}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Formula Display */}
        {currentStepData.showCalculations && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6 animate-fade-in">
            {currentStep >= 5 && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Distance Formula</div>
                <div className="text-sm font-mono text-white bg-black/30 p-3 rounded-lg">
                  Distance(i) = |Predicted Score - Actual Score|
                </div>
              </div>
            )}
            {currentStep >= 6 && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Accuracy Formula</div>
                <div className="text-sm font-mono text-white bg-black/30 p-3 rounded-lg">
                  Accuracy(i) = 1 / (Distance(i) + 1)
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Total Accuracy = {totalAccuracy.toFixed(4)}
                </div>
              </div>
            )}
            {currentStep >= 7 && (
              <div>
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Reward Formula</div>
                <div className="text-sm font-mono text-white bg-black/30 p-3 rounded-lg">
                  Reward(i) = (Accuracy(i) / Total Accuracy) × Pool
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>100% of pool distributed: {usersWithRewards.reduce((sum, u) => sum + (u.reward || 0), 0).toFixed(2)} tokens</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        {(currentStep === 2 || currentStep === 3) && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-2">Betting Period</div>
                <div className="h-3 bg-monad-purple/30 rounded-full relative overflow-hidden">
                  <div className="h-full bg-monad-purple rounded-full" style={{ width: "70%" }} />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-mono">
                    {bettingPeriod}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-2">Pool Period</div>
                <div className="h-3 bg-green-500/30 rounded-full relative overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-mono">
                    {poolPeriod}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500 text-center">
              Pool period is always longer than betting period
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

