"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { MarketCard } from "@/app/components/MarketCard";
import { useFactoryGetAllMarketsWithData, type MarketInfo } from "@/app/hooks/usePredictionMarketFactory";
type Category = "all" | "pending" | "active" | "resolved" | "cancelled";

// Transform market data from blockchain to MarketCard format
const transformMarketData = (market: MarketInfo) => {
  const endTimeDate = new Date(Number(market.endTime) * 1000);
  return {
    id: market.address,
    totalVolumeRaw: market.totalVolume, // Raw volume in wei (will be converted by MarketCard)
    participants: market.totalParticipants || 0,
    endTime: endTimeDate, 
    address: market.address,
    name: market.name,
    description: market.description,
    imageUrl: market.imageUrl,
    parameter: market.parameter,
    category: market.category,
    startTime: market.startTime,
    endTimeRaw: market.endTime, // Raw timestamp value
    minValue: market.minValue,
    maxValue: market.maxValue,
    step: market.step,
    initialValue: market.initialValue,
    status: market.status, // 0 = Pending, 1 = Active, 2 = Resolved, 3 = Cancelled
    totalParticipantsRaw: market.totalParticipants,
    finalValue: market.finalValue,
  };
};
export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  
  // Fetch all markets with their complete data from factory
  const { data: allMarketsData, isLoading: isLoadingMarkets, error: marketsError, marketCount } = useFactoryGetAllMarketsWithData();
  
  useEffect(() => {
    if (allMarketsData && Array.isArray(allMarketsData)) {
      console.log("All Markets Data:", allMarketsData);
      console.log("Total Markets:", allMarketsData.length);
    }
    if (marketsError) {
      console.error("Error fetching markets:", marketsError);
    }
  }, [allMarketsData, marketsError]);

  // Transform blockchain market data to display format
  const transformedMarkets = useMemo(() => {
    if (!allMarketsData || !Array.isArray(allMarketsData) || allMarketsData.length === 0) {
      return [];
    }
    return allMarketsData.map((market) => transformMarketData(market));
  }, [allMarketsData]);

  const filteredMarkets = useMemo(() => {
    if (transformedMarkets.length === 0) {
      return [];
    }

    let filtered = transformedMarkets;

    // Filter by category if not "all"
    if (selectedCategory !== "all") {
      filtered = transformedMarkets.filter((market) => {
        if (selectedCategory === "pending") {
          return market.status === 0; // Pending markets
        } else if (selectedCategory === "active") {
          return market.status === 1; // Active markets
        } else if (selectedCategory === "resolved") {
          return market.status === 2; // Resolved markets
        } else if (selectedCategory === "cancelled") {
          return market.status === 3; // Cancelled markets
        }
        return true;
      });
    }

    // Sort by startTime (most recent first) - descending order
    return filtered.sort((a, b) => {
      const timeA = Number(a.startTime) || 0;
      const timeB = Number(b.startTime) || 0;
      return timeB - timeA; // Descending order (most recent first)
    });
  }, [transformedMarkets, selectedCategory]);

  const categories: { id: Category; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "active", label: "Active" },
    { id: "resolved", label: "Resolved" },
    { id: "cancelled", label: "Cancelled" },
  ];

  // Show custom loader while data is loading
  if (isLoadingMarkets) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-16 w-16 text-monad-purple animate-spin" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Loading Markets</h2>
            <p className="text-gray-400 text-sm">Fetching data from blockchain...</p>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-monad-purple animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-monad-purple animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-monad-purple animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
    

      <header className="mb-12 max-w-7xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Live <span className="text-monad-purple">Range Markets</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Bet in ranges instead of binary outcomes. Small losses when close, big wins when accurate.
        </p>
      </header>

      {/* Category Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex items-center gap-2 border-b border-white/10">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-6 py-3 text-sm font-medium transition-all relative
                ${
                  selectedCategory === category.id
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-300"
                }
              `}
            >
              {category.label}
              {selectedCategory === category.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-monad-purple" />
              )}
            </button>
          ))}
          <div className="ml-auto text-sm text-gray-500">
            {filteredMarkets.length} {filteredMarkets.length === 1 ? "market" : "markets"}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 px-4 sm:px-6">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((market) => (
            <MarketCard
              key={market.id}
              id={market.id}
              title={market.name}
              marketName={market.name}
              description={market.description}
              totalVolumeRaw={market.totalVolumeRaw}
              participants={market.participants}
              endTime={market.endTime}
              parameter={market.parameter}
              category={market.category}
              imageUrl={market.imageUrl}
              startTime={market.startTime}
              minValue={market.minValue}
              maxValue={market.maxValue}
              step={market.step}
              initialValue={market.initialValue}
              status={market.status}
              finalValue={market.finalValue}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 text-lg">
              No {selectedCategory === "all" ? "" : categories.find(c => c.id === selectedCategory)?.label.toLowerCase()} markets found.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
