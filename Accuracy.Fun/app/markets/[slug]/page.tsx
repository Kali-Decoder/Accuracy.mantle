"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  DollarSign,
  BarChart3,
  Activity,
  Copy,
  Terminal,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { useFactoryGetMarketInfo, type MarketInfo } from "@/app/hooks/usePredictionMarketFactory";
import { usePredictionMarketGetAllBets, usePredictionMarketPlaceBet, usePredictionMarketGetCurrentUserBet, usePredictionMarketClaimReward, type ParsedBet } from "@/app/hooks/usePredictionMarket";
import { Address, formatEther, parseEther } from "viem";
import { useToast } from "@/app/hooks/useToast";
import { mantleTestnet } from "@/app/config/chains";
import { useCoinPrice } from "@/app/hooks/useCoinPrice";

function getTimeLeft(endTime: string): string {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}
const SharpCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-black border border-zinc-800 relative flex flex-col ${className}`}>
    <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-zinc-500" />
    <div className="absolute -top-px -right-px w-2 h-2 border-t border-r border-zinc-500" />
    <div className="absolute -bottom-px -left-px w-2 h-2 border-b border-l border-zinc-500" />
    <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-zinc-500" />
    {children}
  </div>
);



const StatRow = ({ label, value, subValue }: { label: string, value: string, subValue?: React.ReactNode }) => (
  <div className="flex justify-between items-end border-b border-dashed border-zinc-800 pb-2 mb-2 last:border-0 hover:bg-zinc-900/30 transition-colors px-1">
    <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider">{label}</span>
    <div className="text-right">
      <div className="text-white font-mono font-bold text-sm">{value}</div>
      {subValue && <div className="text-[10px] text-zinc-400 font-mono">{subValue}</div>}
    </div>
  </div>
);

function WeightedAverageLineGraph({ marketInfo, allBets }: { marketInfo: MarketInfo | null; allBets?: ParsedBet[] }) {
  const marketId = marketInfo?.address;
  
  const data = useMemo(() => {
    const timePoints = 20; // 20 time points
    const minPrice = marketInfo?.minValue ? Number(marketInfo.minValue) : 80000;
    const maxPrice = marketInfo?.maxValue ? Number(marketInfo.maxValue) : 100000;
    
    // If no bets, return empty or default data
    if (!allBets || allBets.length === 0) {
      const initialValue = marketInfo?.initialValue ? Number(marketInfo.initialValue) : (minPrice + maxPrice) / 2;
      return Array.from({ length: timePoints }, (_, i) => ({
        time: i,
        avgPrice: initialValue
      }));
    }
  
    const sortedBets = [...allBets].sort((a, b) => a.timestamp - b.timestamp);
    
    // Get time range
    const startTime = marketInfo?.startTime ? Number(marketInfo.startTime) : sortedBets[0]?.timestamp || Date.now() / 1000;
    // Use current time if market is active, otherwise use end time
    const isActive = marketInfo?.status === 1;
    const endTime = isActive ? Date.now() / 1000 : (marketInfo?.endTime ? Number(marketInfo.endTime) : Date.now() / 1000);
    const timeRange = Math.max(1, endTime - startTime); // Ensure at least 1 second to avoid division by zero
    
    // Calculate weighted average at each time point
    const points: Array<{ time: number; avgPrice: number }> = [];
    
    for (let i = 0; i < timePoints; i++) {
      const progress = i / (timePoints - 1);
      const currentTime = startTime + (timeRange * progress);
      
      // Get all bets up to this point in time
      const betsUpToNow = sortedBets.filter(bet => bet.timestamp <= currentTime);
      
      if (betsUpToNow.length === 0) {
        // No bets yet, use initial value
        const initialValue = marketInfo?.initialValue ? Number(marketInfo.initialValue) : (minPrice + maxPrice) / 2;
        points.push({ time: i, avgPrice: initialValue });
      } else {
        // Calculate weighted average: sum(predictedValue * amount) / sum(amount)
        // Convert amounts from wei to ether for calculation
        let totalWeightedValue = 0;
        let totalWeight = 0;
        
        betsUpToNow.forEach(bet => {
          const predictedValue = Number(bet.predictedValue);
          // Convert amount from wei (string) to ether (number) for weighting
          const amountInEther = parseFloat(formatEther(BigInt(bet.amount)));
          
          totalWeightedValue += predictedValue * amountInEther;
          totalWeight += amountInEther;
        });
        
        const weightedAvg = totalWeight > 0 ? totalWeightedValue / totalWeight : (minPrice + maxPrice) / 2;
        // Clamp to min/max range
        const clampedAvg = Math.max(minPrice, Math.min(maxPrice, weightedAvg));
        points.push({ time: i, avgPrice: clampedAvg });
      }
    }
    
    return points;
  }, [marketId, marketInfo?.minValue, marketInfo?.maxValue, marketInfo?.startTime, marketInfo?.endTime, marketInfo?.initialValue, marketInfo?.status, allBets]);

  const minPrice = Math.min(...data.map(d => d.avgPrice));
  const maxPrice = Math.max(...data.map(d => d.avgPrice));
  const priceRange = maxPrice - minPrice || 1;

  // Convert to SVG coordinates
  const svgPoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.avgPrice - minPrice) / priceRange) * 80 - 10; // 10-90 range
    return { x, y };
  });

  // Create smooth curve using cubic Bezier interpolation
  const createSmoothPath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
    }

    let path = `M${points[0].x},${points[0].y}`;
    const tension = 0.3; // Controls smoothness (0-1)

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Calculate control points for smooth curve
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      // Use cubic Bezier curve
      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path;
  };

  const linePath = createSmoothPath(svgPoints);
  
  // Create smooth area path (same curve but closed at bottom)
  const areaPath = linePath + ` L100,100 L0,100 Z`;

  const formatPrice = (price: number) => {
    return `$${(price / 1000).toFixed(0)}k`;
  };

  const currentPrice = data[data.length - 1]?.avgPrice || 0;
  const startPrice = data[0]?.avgPrice || 0;
  const priceChange = currentPrice - startPrice;
  const priceChangePercent = startPrice !== 0 ? ((priceChange / startPrice) * 100).toFixed(2) : "0.00";
  const maxPriceValue = Math.max(...data.map(d => d.avgPrice));
  const minPriceValue = Math.min(...data.map(d => d.avgPrice));

  return (
    <div className="h-full w-full border border-zinc-800 bg-zinc-900/50 p-3 relative flex flex-col">
      {/* Header with explanation */}
      <div className="mb-2">
        <div className="flex justify-between items-start mb-1">
          <div>
            <div className="text-[9px] font-mono text-zinc-400 uppercase font-bold">
              Market Consensus Price
            </div>
            <div className="text-[7px] font-mono text-zinc-600 mt-0.5 leading-tight">
              Weighted average of all user predictions over time
            </div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-mono text-zinc-500 uppercase">Current</div>
            <div className="text-[10px] font-mono text-white font-bold">
              {formatPrice(currentPrice)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between items-center mb-2 text-[7px] font-mono">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Start:</span>
          <span className="text-zinc-300">{formatPrice(startPrice)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Change:</span>
          <span className={priceChange >= 0 ? "text-green-400" : "text-red-400"}>
            {priceChange >= 0 ? "+" : ""}{formatPrice(priceChange)} ({priceChangePercent}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Range:</span>
          <span className="text-zinc-300">{formatPrice(minPriceValue)} - {formatPrice(maxPriceValue)}</span>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 min-h-0 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`avgGradient-${marketId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#27272a" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#27272a" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#27272a" strokeWidth="0.5" />
          
          <path d={areaPath} fill={`url(#avgGradient-${marketId})`} />
          <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          
          {/* Key data points with labels */}
          {data.map((d, i) => {
            if (i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) {
              const point = svgPoints[i];
              return (
                <g key={i}>
                  <circle cx={point.x} cy={point.y} r="2.5" fill="#f97316" />
                  <text
                    x={point.x}
                    y={point.y - 4}
                    fontSize="6"
                    fill="#f97316"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {formatPrice(d.avgPrice)}
                  </text>
                </g>
              );
            }
            return null;
          })}
          
  
          <circle 
            cx={svgPoints[svgPoints.length - 1]?.x} 
            cy={svgPoints[svgPoints.length - 1]?.y} 
            r="1" 
            fill="#f97316"
            stroke="#000"
            strokeWidth="0.5"
          />
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[6px] font-mono text-zinc-600 pr-1">
          <span>{formatPrice(maxPrice)}</span>
          <span>{formatPrice((maxPrice + minPrice) / 2)}</span>
          <span>{formatPrice(minPrice)}</span>
        </div>
        

        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[6px] font-mono text-zinc-600 pt-1">
          <span>Start</span>
          <span>Mid</span>
          <span>Now</span>
        </div>
      </div>

      {/* Footer explanation */}
      <div className="mt-2 pt-2 border-t border-white">
        <div className="text-[10px] font-mono text-white leading-tight">
          <span className="text-zinc-500">How it works:</span> Each point represents the weighted average price prediction from all users at that time. Higher values indicate users expect higher prices.
        </div>
      </div>
    </div>
  );
}

function HeadToHeadStatsCard({ marketInfo, allBets }: { marketInfo: MarketInfo | null; allBets?: ParsedBet[] }) {
  return (
    <SharpCard className="h-full p-5 flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
        <h4 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500" />
          Market Consensus
        </h4>
      </div>
      <div className=" flex-1 flex flex-col min-h-0">
        <WeightedAverageLineGraph marketInfo={marketInfo} allBets={allBets} />
      </div>
    </SharpCard>
  );
}

function TradingPanelCard({ marketInfo, refetchMarketInfo, refetchAllBets }: { marketInfo: MarketInfo | null; refetchMarketInfo?: () => void; refetchAllBets?: () => void }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address: address,
  });
  const { showSuccess, showError } = useToast();
  
  const [amount, setAmount] = useState<string>('');
  
  // Get market address and resolved status
  const marketAddress = marketInfo?.address;
  const isResolved = marketInfo?.status === 2 || marketInfo?.status === 3;
  const isActive = marketInfo?.status === 1;
  
  // Use the placeBet hook
  const { placeBet, isPending: isPlacingBet, isConfirming: isConfirmingBet, isConfirmed: isBetConfirmed, hash: betHash, error: betError, reset: resetBet } = usePredictionMarketPlaceBet(marketAddress);
  
  // Get user's bet information
  const { data: userBet, isLoading: isLoadingUserBet, refetch: refetchUserBet } = usePredictionMarketGetCurrentUserBet(marketAddress);
  
  // Use claim reward hook
  const { claimReward, isPending: isClaimingReward, isConfirming: isConfirmingClaim, isConfirmed: isClaimConfirmed, hash: claimHash, error: claimError, reset: resetClaim } = usePredictionMarketClaimReward(marketAddress);
  
  // Use market data for slider values, fallback to defaults if not available
  const minValue = marketInfo?.minValue ? Number(marketInfo.minValue) : 0;
  const maxValue = marketInfo?.maxValue ? Number(marketInfo.maxValue) : 100000;
  const step = marketInfo?.step ? Number(marketInfo.step) : 1000;
  const initialValue = marketInfo?.initialValue ? Number(marketInfo.initialValue) : (minValue + maxValue) / 2;
  
  const [predictionValue, setPredictionValue] = useState<number>(initialValue);
  
  // Get user's native token balance (STT)
  const userBalance = useMemo(() => {
    if (!balance?.value) return 0;
    return parseFloat(formatEther(balance.value));
  }, [balance]);
  
  // Update prediction value when marketInfo changes
  useEffect(() => {
    if (marketInfo?.initialValue) {
      setPredictionValue(Number(marketInfo.initialValue));
    }
  }, [marketInfo?.initialValue]);
  
  const [refreshCountdown, setRefreshCountdown] = useState(7);
  const [priceRefreshTrigger, setPriceRefreshTrigger] = useState(0);

  // Fetch SOMI token price
  const { data: somiPriceData, isLoading: isLoadingSomiPrice } = useCoinPrice({
    symbol: "SOMI",
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update prices every 7 seconds
  useEffect(() => {
    if (!marketAddress || isResolved) return;
    
    const interval = setInterval(() => {
      setPriceRefreshTrigger((prev) => prev + 1);
    }, 7000);

    return () => clearInterval(interval);
  }, [marketAddress, isResolved]);

  // Dummy trade data - no contract interaction
  const tradeData = useMemo(() => {
    if (!marketAddress || !amount || parseFloat(amount) <= 0) {
      return null;
    }
    
    // Dummy liquidity
    const liquidity = BigInt(Math.floor(50000 * 1e18)).toString(); // $50k liquidity
    
    const amountNum = parseFloat(amount);
    // Simple calculation: cost = amount (1:1 for now)
    const buyCost = BigInt(Math.floor(amountNum * 1e18)).toString();
    
    return {
      liquidity,
      buyCost,
    };
  }, [marketAddress, amount, priceRefreshTrigger]);


  // Handle bet errors
  useEffect(() => {
    if (betError) {
      const errorMessage = betError.message || 
        (betError as any)?.shortMessage || 
        (betError as any)?.cause?.message ||
        'Failed to place bet. Please try again.';
      showError(errorMessage);
    }
  }, [betError, showError]);

  // Reset bet state when market changes
  useEffect(() => {
    if (betHash && isBetConfirmed) {
      // Reset form after successful bet
      setAmount('');
      // Show success toast with explorer link
      const explorerUrl = `https://sepolia.mantlescan.xyz/tx/${betHash}`;
      showSuccess(
        <span>
          Bet placed successfully!{' '}
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 hover:text-orange-400 underline"
          >
            View on Explorer
          </a>
        </span>
      );
      
      // Refetch with delays to ensure blockchain state has updated
      // First refetch after 1 second
      setTimeout(() => {
        refetchUserBet();
        if (refetchMarketInfo) refetchMarketInfo();
        if (refetchAllBets) refetchAllBets();
      }, 1000);
      
      // Second refetch after 3 seconds to catch any delayed updates
      setTimeout(() => {
        refetchUserBet();
        if (refetchMarketInfo) refetchMarketInfo();
        if (refetchAllBets) refetchAllBets();
      }, 3000);
      
      // Reset bet state after a short delay to show confirmation
      setTimeout(() => {
        resetBet();
      }, 3000); // Reset after 3 seconds to show confirmation state
    }
  }, [betHash, isBetConfirmed, resetBet, refetchUserBet, showSuccess, refetchMarketInfo, refetchAllBets]);
  
  // Refetch user bet when claim is confirmed
  useEffect(() => {
    if (claimHash && isClaimConfirmed) {
      resetClaim();
      // Show success toast with explorer link
      const explorerUrl = `https://sepolia.mantlescan.xyz/tx/${claimHash}`;
      showSuccess(
        <span>
          Reward claimed successfully!{' '}
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 hover:text-orange-400 underline"
          >
            View on Explorer
          </a>
        </span>
      );
      
      // Refetch with delays to ensure blockchain state has updated
      // First refetch after 1 second
      setTimeout(() => {
        refetchUserBet();
        if (refetchMarketInfo) refetchMarketInfo();
        if (refetchAllBets) refetchAllBets();
      }, 1000);
      
      // Second refetch after 3 seconds to catch any delayed updates
      setTimeout(() => {
        refetchUserBet();
        if (refetchMarketInfo) refetchMarketInfo();
        if (refetchAllBets) refetchAllBets();
      }, 3000);
    }
  }, [claimHash, isClaimConfirmed, resetClaim, refetchUserBet, showSuccess, refetchMarketInfo, refetchAllBets]);
  
  // Update prediction value and amount if user has a bet
  useEffect(() => {
    if (userBet?.hasBet && userBet.predictedValue && userBet.amount) {
      const predictedValueNum = Number(userBet.predictedValue);
      const amountNum = parseFloat(formatEther(BigInt(userBet.amount)));
      setPredictionValue(predictedValueNum);
      setAmount(amountNum.toFixed(4));
    }
  }, [userBet]);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const hasAmount = amount && parseFloat(amount) > 0;
    if (!isResolved && hasAmount && marketAddress) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      countdownIntervalRef.current = setInterval(() => {
        setRefreshCountdown((prev) => (prev <= 1 ? 7 : prev - 1));
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (!hasAmount) {
        setRefreshCountdown(7);
      }
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isResolved, marketAddress, amount]);

  // Calculate trade summary
  const { total, toWin, canTrade, maxAmountAvailable, usdtValue } = useMemo(() => {
    if (!tradeData || !marketAddress) {
      return { total: 0, toWin: 0, liquidity: 0, canTrade: false, maxAmountAvailable: 0, usdtValue: 0 };
    }

    const liquidityUSD = Number(tradeData.liquidity) / 1e18;

    if (!amount) {
      return { total: 0, toWin: 0, liquidity: liquidityUSD, canTrade: false, maxAmountAvailable: 0, usdtValue: 0 };
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { total: 0, toWin: 0, liquidity: liquidityUSD, canTrade: false, maxAmountAvailable: 0, usdtValue: 0 };
    }

    let total = 0;
    let toWin = 0;
    let usdtValue = 0;

    if (tradeData.buyCost) {
      total = Number(tradeData.buyCost) / 1e18;
      toWin = amountNum;
      
      // Calculate USDT value from STT amount using SOMI price
      if (somiPriceData?.data?.[0]?.prices?.[0]?.value) {
        const somiPrice = parseFloat(somiPriceData.data[0].prices[0].value);
        if (!isNaN(somiPrice) && somiPrice > 0) {
          usdtValue = amountNum * somiPrice;
        }
      }
    }

    return { total, toWin, liquidity: liquidityUSD, canTrade: true, maxAmountAvailable: liquidityUSD, usdtValue };
  }, [tradeData, amount, marketAddress, somiPriceData]);

  const handleTrade = async () => {
    if (!marketAddress || !isActive || !amount) return;

    // Validate wallet connection
    if (!isConnected || !address) {
      showError('Please connect your wallet to continue.');
      return;
    }

    // Validate chain
    if (chainId !== mantleTestnet.id) {
      showError(`Please switch to ${mantleTestnet.name} (Chain ID: ${mantleTestnet.id}) to continue.`);
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    // Validate prediction value is within range
    if (predictionValue < minValue || predictionValue > maxValue) {
      showError(`Prediction value must be between $${minValue.toLocaleString()} and $${maxValue.toLocaleString()}`);
      return;
    }

    // Validate user has sufficient balance
    if (amountNum > userBalance) {
      showError(`Insufficient balance. You have ${userBalance.toFixed(4)} ${balance?.symbol || 'STT'}`);
      return;
    }

    // Validate amount is positive
    if (amountNum <= 0) {
      showError('Amount must be greater than 0');
      return;
    }

    try {
      // Reset any previous errors
      resetBet();
      
      // Convert prediction value to bigint (it's already a number from the slider)
      const predictedValue = BigInt(Math.floor(predictionValue));
      
      // Convert amount to wei
      const amountWei = parseEther(amountNum.toString());

      // Place bet with predicted value and amount
      const txHash = await placeBet(predictedValue, amountWei);
      console.log('Bet transaction submitted:', txHash);
      // Show info toast that transaction is pending
      showSuccess(`Transaction submitted! Waiting for confirmation...`);
    } catch (err) {
      console.error('Place bet error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
        ? err 
        : 'Failed to place bet. Please try again.';
      showError(errorMessage);
    }
  };

  const handleAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // If no market address, show placeholder
  if (!marketAddress) {
    return (
      <SharpCard className="h-full p-5">
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
          <h4 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-500" />
            Order Entry
          </h4>
        </div>
        <div className="flex items-center justify-center h-full">
          <p className="text-zinc-500 text-sm font-mono">Market not available</p>
        </div>
      </SharpCard>
    );
  }

  return (
    <SharpCard className="h-full p-5 flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
        <h4 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-orange-500" />
          Order Entry
        </h4>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-mono text-zinc-500 uppercase">Prediction Value</label>
          <span className="text-sm font-mono font-bold text-white">${predictionValue.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={minValue}
          max={maxValue}
          step={step}
          value={Math.max(minValue, Math.min(maxValue, predictionValue))}
          onChange={(e) => {
            const newValue = Number(e.target.value);
            const clampedValue = Math.max(minValue, Math.min(maxValue, newValue));
            setPredictionValue(clampedValue);
          }}
          disabled={!isActive || userBet?.hasBet}
          className="w-full h-2 bg-zinc-900 rounded-lg appearance-none accent-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #f97316 0%, #f97316 ${((Math.max(minValue, Math.min(maxValue, predictionValue)) - minValue) / (maxValue - minValue)) * 100}%, #27272a ${((Math.max(minValue, Math.min(maxValue, predictionValue)) - minValue) / (maxValue - minValue)) * 100}%, #27272a 100%)`
          }}
        />
        <div className="flex justify-between text-[12px] text-zinc-600 font-mono mt-1">
          <span>${minValue.toLocaleString()}</span>
          <span className="text-zinc-400">Initial: ${initialValue.toLocaleString()}</span>
          <span>${maxValue.toLocaleString()}</span>
        </div>
      </div>

    
      <div className="mb-4 mt-10">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-mono text-zinc-500 uppercase">
            Amount ({balance?.symbol || "STT"})
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const maxAmount = Math.min(maxAmountAvailable || userBalance, userBalance);
                setAmount((maxAmount * 0.25).toFixed(4));
              }}
              className="text-[10px] text-orange-500 hover:text-orange-400 font-mono px-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!address || userBalance === 0 || !isActive || userBet?.hasBet}
            >
              25%
            </button>
            <button
              onClick={() => {
                const maxAmount = Math.min(maxAmountAvailable || userBalance, userBalance);
                setAmount((maxAmount * 0.5).toFixed(4));
              }}
              className="text-[10px] text-orange-500 hover:text-orange-400 font-mono px-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!address || userBalance === 0 || !isActive || userBet?.hasBet}
            >
              50%
            </button>
            <button
              onClick={() => {
                const maxAmount = Math.min(maxAmountAvailable || userBalance, userBalance);
                setAmount((maxAmount * 0.75).toFixed(4));
              }}
              className="text-[10px] text-orange-500 hover:text-orange-400 font-mono px-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!address || userBalance === 0 || !isActive || userBet?.hasBet}
            >
              75%
            </button>
            <button
              onClick={() => {
                const maxAmount = Math.min(maxAmountAvailable || userBalance, userBalance);
                setAmount(maxAmount.toFixed(4));
              }}
              className="text-[10px] text-orange-500 hover:text-orange-400 font-mono px-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!address || userBalance === 0 || !isActive || userBet?.hasBet}
            >
              MAX
            </button>
          </div>
        </div>
        {address && (
          <div className="mb-2 text-[10px] text-zinc-500 font-mono">
            Balance: {userBalance.toFixed(4)} {balance?.symbol || "STT"}
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm font-mono placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!address || !isActive || userBet?.hasBet}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              onClick={() => {
                const current = parseFloat(amount) || 0;
                const stepAmount = Math.max(0.0001, userBalance * 0.01); // 1% of balance or 0.0001 minimum
                setAmount(Math.max(0, current - stepAmount).toFixed(4));
              }}
              className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!address || userBalance === 0 || !isActive || userBet?.hasBet}
            >
              −
            </button>
            <button
              onClick={() => {
                const current = parseFloat(amount) || 0;
                const stepAmount = Math.max(0.0001, userBalance * 0.01); // 1% of balance or 0.0001 minimum
                const newAmount = Math.min(userBalance, current + stepAmount);
                setAmount(newAmount.toFixed(4));
              }}
              className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!address || userBalance === 0 || !isActive || userBet?.hasBet}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* User Bet Information */}
      {userBet?.hasBet && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">Already Placed Bet</span>
              <span className="text-[8px] font-mono text-zinc-500">
                {new Date(userBet.timestamp * 1000).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Predicted Value</span>
              <span className="text-sm font-mono font-bold text-white">
                ${Number(userBet.predictedValue).toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-zinc-800"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Bet Amount</span>
              <span className="text-sm font-mono font-bold text-white">
                {formatCurrency(parseFloat(formatEther(BigInt(userBet.amount))))}
              </span>
            </div>
            {marketInfo?.status === 2 && marketInfo?.finalValue && marketInfo.finalValue > 0 && (
              <>
                <div className="h-px bg-zinc-800"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Result</span>
                  <span className="text-sm font-mono font-bold text-orange-400">
                    ${Number(marketInfo.finalValue).toLocaleString()}
                  </span>
                </div>
              </>
            )}
            {userBet.rewardAmount && BigInt(userBet.rewardAmount) > BigInt(0) && (
              <>
                <div className="h-px bg-zinc-800"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Reward</span>
                  <span className="text-sm font-mono font-bold text-green-400">
                    {formatCurrency(parseFloat(formatEther(BigInt(userBet.rewardAmount))))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Status</span>
                  <span className={`text-[10px] font-mono font-bold ${userBet.claimed ? 'text-zinc-500' : 'text-green-400'}`}>
                    {userBet.claimed ? 'Claimed' : 'Available'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Trade Summary */}
      {!userBet?.hasBet && (
        <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Total Cost</span>
              <span className="text-sm font-mono font-bold text-white">
                {total > 0 ? `${total.toFixed(4)} STT` : '0.0000 STT'}
              </span>
            </div>
            <div className="h-px bg-zinc-800"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                USDT
              </span>
              <span className="text-sm font-mono font-bold text-green-400">
                {usdtValue > 0 ? formatCurrency(usdtValue) : isLoadingSomiPrice ? 'Loading...' : '$0.00'}
              </span>
            </div>
            {!canTrade && amount && parseFloat(amount) > 0 && (
              <>
                <div className="h-px bg-zinc-800"></div>
                <p className="text-[10px] text-red-400 font-mono">
                  Max {maxAmountAvailable.toFixed(2)} available
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Refresh Indicator */}
      {!isResolved && amount && parseFloat(amount) > 0 && (
        <div className="mb-3 text-center">
          <span className="text-[10px] text-zinc-500 font-mono">
            Refreshing in <span className="text-orange-500 font-bold">{refreshCountdown}s</span>
          </span>
        </div>
      )}

      {/* Error Display - Now handled by toast, but keeping for visual consistency */}
      {betError && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[10px] text-red-400 font-mono">
            {betError.message || (betError as any)?.shortMessage || 'Error placing bet'}
          </p>
        </div>
      )}
      
      {claimError && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[10px] text-red-400 font-mono">
            {claimError.message || (claimError as any)?.shortMessage || 'Error claiming reward'}
          </p>
        </div>
      )}

      {/* Transaction Status */}
      {betHash && (
        <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-[10px] text-green-400 font-mono">
            {isBetConfirmed ? 'Bet Confirmed!' : isConfirmingBet ? 'Confirming...' : 'Transaction Submitted!'} 
            <span className="font-mono text-[8px] ml-1">{betHash.slice(0, 8)}...</span>
          </p>
        </div>
      )}
      
      {claimHash && (
        <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-[10px] text-green-400 font-mono">
            {isClaimConfirmed ? 'Reward Claimed!' : isConfirmingClaim ? 'Confirming...' : 'Transaction Submitted!'} 
            <span className="font-mono text-[8px] ml-1">{claimHash.slice(0, 8)}...</span>
          </p>
        </div>
      )}

      {/* Claim Reward Button */}
      {userBet?.hasBet && userBet.rewardAmount && BigInt(userBet.rewardAmount) > BigInt(0) && !userBet.claimed && (
        <button
          onClick={async () => {
            try {
              // Validate wallet connection
              if (!isConnected || !address) {
                showError('Please connect your wallet to continue.');
                return;
              }

              // Validate chain
              if (chainId !== mantleTestnet.id) {
                showError(`Please switch to ${mantleTestnet.name} (Chain ID: ${mantleTestnet.id}) to continue.`);
                return;
              }

              await claimReward();
            } catch (err) {
              console.error('Claim reward error:', err);
              showError(err instanceof Error ? err.message : 'Failed to claim reward');
            }
          }}
          disabled={isClaimingReward || isConfirmingClaim}
          className={`w-full py-3 rounded-lg font-mono text-sm font-bold transition-all mb-3 ${
            isClaimingReward || isConfirmingClaim
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          {isClaimingReward || isConfirmingClaim ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isClaimingReward ? 'Claiming...' : isConfirmingClaim ? 'Confirming...' : 'Processing...'}
            </span>
          ) : (
            `Claim Reward (${formatCurrency(parseFloat(formatEther(BigInt(userBet.rewardAmount))))})`
          )}
        </button>
      )}

      
      <button
        onClick={handleTrade}
        disabled={
          !isActive ||
          userBet?.hasBet ||
          !amount ||
          parseFloat(amount) <= 0 ||
          isPlacingBet ||
          isConfirmingBet ||
          !canTrade ||
          !marketAddress ||
          (address && parseFloat(amount) > userBalance)
        }
        className={`w-full py-3 rounded-lg font-mono text-sm font-bold transition-all ${
          isPlacingBet || isConfirmingBet
            ? 'bg-blue-600 text-white cursor-wait'
            : isBetConfirmed && betHash
            ? 'bg-green-600 text-white'
            : betError
            ? 'bg-red-600 text-white'
            : isActive &&
              !userBet?.hasBet &&
              amount &&
              parseFloat(amount) > 0 &&
              !isPlacingBet &&
              !isConfirmingBet &&
              canTrade &&
              marketAddress
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
        }`}
      >
        {isPlacingBet || isConfirmingBet ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isPlacingBet ? 'Placing Bet...' : 'Confirming...'}
          </span>
        ) : isBetConfirmed && betHash ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Bet Confirmed!
          </span>
        ) : betError ? (
          <span className="flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Transaction Failed
          </span>
        ) : (
          'Place Bet'
        )}
      </button>
      
      {betHash && !isBetConfirmed && (
        <div className="mt-2 text-center">
          <p className="text-[10px] text-blue-400 font-mono">
            Transaction: <span className="font-bold">{betHash.slice(0, 10)}...</span>
          </p>
        </div>
      )}
    </SharpCard>
  );
}

function WinProbabilityCardContent({ marketInfo, allBets }: { marketInfo: MarketInfo | null; allBets?: ParsedBet[] }) {

  const marketStatus = marketInfo?.status ?? 0;

  const priceRanges = useMemo(() => {
    const minPrice = marketInfo?.minValue ? Number(marketInfo.minValue) : 80000;
    const maxPrice = marketInfo?.maxValue ? Number(marketInfo.maxValue) : 100000;
    
    const colors = [
      "bg-blue-600",
      "bg-cyan-600", 
      "bg-teal-600",
      "bg-green-600",
      "bg-emerald-600",
    ];
    
    // Always create exactly 5 bins based on market price range
    const NUM_BINS = 5;
    const priceSpan = maxPrice - minPrice;
    const binWidth = priceSpan / NUM_BINS;
    
    // Create 5 bins with proper boundaries
    const bins: Array<{ min: number; max: number; count: number }> = [];
    
    for (let i = 0; i < NUM_BINS; i++) {
      const binMin = minPrice + (i * binWidth);
      const binMax = i === NUM_BINS - 1 ? maxPrice : minPrice + ((i + 1) * binWidth);
      
      // Ensure min and max are different and properly rounded
      const finalMin = Math.floor(binMin);
      const finalMax = i === NUM_BINS - 1 ? Math.ceil(binMax) : Math.ceil(binMax);
      
      bins.push({
        min: finalMin,
        max: finalMax,
        count: 0,
      });
    }
    
    // Count bets in each bin if bets exist
    if (allBets && allBets.length > 0) {
      const betValues = allBets.map(bet => Number(bet.predictedValue));
      const totalBets = allBets.length;
      
      betValues.forEach(value => {
        // Find which bin this value belongs to
        for (let i = 0; i < bins.length; i++) {
          const bin = bins[i];
          // Check if value falls in this bin (inclusive of min, exclusive of max, except for last bin)
          if (i === bins.length - 1) {
            // Last bin includes the max value
            if (value >= bin.min && value <= bin.max) {
              bin.count++;
              break;
            }
          } else {
            if (value >= bin.min && value < bin.max) {
              bin.count++;
              break;
            }
          }
        }
      });
      
      // Create ranges with probabilities
      const ranges = bins.map((bin, index) => ({
        min: bin.min,
        max: bin.max,
        count: bin.count,
        probability: totalBets > 0 ? (bin.count / totalBets) * 100 : 0,
        color: colors[index],
      }));
      
      return ranges;
    } else {
      // No bets - return empty bins with 0% probability
      return bins.map((bin, index) => ({
        min: bin.min,
        max: bin.max,
        count: 0,
        probability: 0,
        color: colors[index],
      }));
    }
  }, [marketInfo?.minValue, marketInfo?.maxValue, allBets]);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}k`;
    }
    return `$${price.toFixed(0)}`;
  };

  // Filter out ranges with zero bets
  const rangesWithBets = priceRanges.filter(range => range.count > 0);

  return (
    <div className="space-y-4 pt-2">
      {rangesWithBets.length > 0 ? (
        rangesWithBets.map((range, index) => (
          <div key={index} className="group">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-white font-bold group-hover:text-orange-400">
                {formatPrice(range.min)} - {formatPrice(range.max)}
              </span>
              <div className="flex items-center gap-2">
                {/* <span className="text-zinc-400 text-[10px]">({range.count} bets)</span> */}
                <span className="text-white">{range.probability.toFixed(1)}%</span>
              </div>
            </div>
            <div className="h-8 w-full bg-zinc-900 border border-zinc-800 p-1 relative">
              <div 
                className={`h-full ${range.color} transition-all duration-500`} 
                style={{ width: `${range.probability}%` }} 
              />
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-zinc-500 text-sm font-mono">No bets found</p>
        </div>
      )}
      <div className="mt-auto pt-6">
        <div className="flex gap-2 text-[10px] font-mono text-zinc-500 uppercase">
          <span className="border border-zinc-800 px-1">Status: {
            marketStatus === 0 ? 'PENDING' :
            marketStatus === 1 ? 'ACTIVE' :
            marketStatus === 2 ? 'RESOLVED' :
            marketStatus === 3 ? 'CANCELLED' :
            'UNKNOWN'
          }</span>
        </div>
      </div>
    </div>
  );
}

function WinProbabilityCard({ marketInfo, allBets }: { marketInfo: MarketInfo | null; allBets?: ParsedBet[] }) {
  const isResolved = marketInfo?.status === 2 || marketInfo?.status === 3;
  
  return (
    <SharpCard className="h-full p-5">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
        <h4 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-500" />
          {isResolved ? "Final Result" : "Users Distribution Range"}
        </h4>
      </div>
      <WinProbabilityCardContent marketInfo={marketInfo} allBets={allBets} />
    </SharpCard>
  );
}

function BattleInfoCard({ marketInfo }: { marketInfo: MarketInfo | null }) {
  const { address: connectedAddress } = useAccount();
  const { showSuccess } = useToast();
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Address copied");
  };

  // Use market data - all data comes from marketInfo
  const displayData = marketInfo || {
    startTime: 0,
    endTime: 0,
    status: 0,
    finalValue: 0,
    address: "0x0000000000000000000000000000000000000000" as Address,
  };

  const getStatusText = (status: number) => {
    if (status === 0) return "PENDING";
    if (status === 1) return "ACTIVE";
    if (status === 2) return "RESOLVED";
    if (status === 3) return "CANCELLED";
    return "UNKNOWN";
  };

  // Format values
  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <SharpCard className="h-full p-5">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
        <h4 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-orange-500" />
          Market Info
        </h4>
      </div>

      <div className="space-y-1 mb-6">
        <StatRow 
          label="Start Time" 
          value={new Date(Number(displayData.startTime) * 1000).toLocaleString()} 
        />
        <StatRow 
          label="End Time" 
          value={new Date(Number(displayData.endTime) * 1000).toLocaleString()} 
        />
        <StatRow 
          label="Status" 
          value={getStatusText(displayData.status)} 
        />
        {displayData.finalValue > 0 && (
          <StatRow 
            label="Final Value" 
            value={formatValue(Number(displayData.finalValue))} 
          />
        )}
      </div>

      <div className="mt-auto">
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Addresses</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 group">
              <span className="text-green-500 text-xs font-mono">Market:</span>
              <span className="text-zinc-400 text-[10px] font-mono truncate flex-1">
                {displayData.address || "N/A"}
              </span>
              {displayData.address && (
                <button
                  onClick={() => copyToClipboard(displayData.address)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy address"
                >
                  <Copy className="w-3 h-3 text-zinc-500 hover:text-white" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 group">
              <span className="text-purple-500 text-xs font-mono">Wallet:</span>
              <span className="text-zinc-400 text-[10px] font-mono truncate flex-1">
                {connectedAddress ? connectedAddress : "Not connected"}
              </span>
              {connectedAddress && (
                <button
                  onClick={() => copyToClipboard(connectedAddress)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy address"
                >
                  <Copy className="w-3 h-3 text-zinc-500 hover:text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </SharpCard>
  );
}

function BattleContent({ marketInfo, allBets, refetchMarketInfo, refetchAllBets }: { marketInfo: MarketInfo | null; allBets?: ParsedBet[]; refetchMarketInfo?: () => void; refetchAllBets?: () => void }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { address } = useAccount();
  const { showSuccess } = useToast();
  const marketAddress = marketInfo?.address;
  
  // Get user bet refetch
  const { refetch: refetchUserBet } = usePredictionMarketGetCurrentUserBet(marketAddress);
  
  // Get market ID from address
  const marketId = marketInfo?.address || "0x0000000000000000000000000000000000000000";
  
  // Get isResolved from status
  const isResolved = marketInfo?.status === 2 || marketInfo?.status === 3;

  // Copy market address to clipboard
  const copyMarketAddress = () => {
    navigator.clipboard.writeText(marketId);
    showSuccess("Address copied");
  };
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchMarketInfo?.(),
        refetchAllBets?.(),
        refetchUserBet?.(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchMarketInfo, refetchAllBets, refetchUserBet]);

  // Format TVL from wei to ether and then format for display
  const formattedTVL = useMemo(() => {
    if (!marketInfo?.totalVolume || Number(marketInfo.totalVolume) === 0) {
      return '$0';
    }
    
    try {
      // Convert to BigInt if it's a number or string
      const volumeBigInt = typeof marketInfo.totalVolume === 'bigint' 
        ? marketInfo.totalVolume 
        : BigInt(marketInfo.totalVolume.toString());
      
      // Convert from wei to ether using formatEther
      const volumeInEther = parseFloat(formatEther(volumeBigInt));
      
      // Format for display
      if (volumeInEther >= 1000000) {
        return `$${(volumeInEther / 1000000).toFixed(2)}M`;
      } else if (volumeInEther >= 1000) {
        return `$${(volumeInEther / 1000).toFixed(1)}k`;
      } else {
        return `$${volumeInEther.toFixed(2)}`;
      }
    } catch (error) {
      console.error('Error formatting TVL:', error);
      return '$0';
    }
  }, [marketInfo?.totalVolume]);

  useEffect(() => {
    if (!marketInfo?.endTime) return;
    const endTime = new Date(Number(marketInfo.endTime) * 1000).toISOString();
    const updateTime = () => setTimeLeft(getTimeLeft(endTime));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [marketInfo?.endTime]);

  const title = marketInfo?.name || marketInfo?.parameter || "Market";

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      {/* Header Area */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <Link
          href="/markets"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Markets</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-6">
          {/* Left: Battle Identity */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Terminal className="w-8 h-8 text-zinc-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-mono font-bold tracking-tighter text-white">
                  {title}
                </h1>
                <span className={`${
                  marketInfo?.status === 0 ? 'bg-blue-600' : // Pending
                  marketInfo?.status === 1 ? 'bg-green-600' : // Active
                  marketInfo?.status === 2 ? 'bg-zinc-600' : // Resolved
                  marketInfo?.status === 3 ? 'bg-red-600' : // Cancelled
                  'bg-blue-600' // Default
                } text-black text-[10px] font-mono font-bold px-1 py-0.5`}>
                  {marketInfo?.status === 0 ? 'Pending' :
                   marketInfo?.status === 1 ? 'Active' :
                   marketInfo?.status === 2 ? 'Resolved' :
                   marketInfo?.status === 3 ? 'Cancelled' :
                   'Pending'}
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="ml-2 p-1.5 rounded border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh market data"
                >
                  <RefreshCw 
                    className={`w-3.5 h-3.5 text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} 
                  />
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                <button
                  onClick={copyMarketAddress}
                  className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-pointer"
                  title="Copy market address"
                >
                  <Copy className="w-3 h-3" /> {marketId.slice(0, 8)}...
                </button>
                <span className="text-zinc-700">|</span>
                <span className="text-orange-500">
                  {isResolved ? 'Ended' : `Ends in ${timeLeft}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-8 text-right">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">Volume</span>
              <span className="text-xl font-mono font-bold text-white border-b border-dashed border-zinc-700">
                {formattedTVL}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">Participants</span>
              <span className="text-xl font-mono font-bold text-white border-b border-dashed border-zinc-700">
                {marketInfo?.totalParticipants ? Number(marketInfo.totalParticipants) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[680px]">
          <HeadToHeadStatsCard marketInfo={marketInfo} allBets={allBets} />
        </div>
        <div className="h-[680px]">
          <TradingPanelCard marketInfo={marketInfo} refetchMarketInfo={refetchMarketInfo} refetchAllBets={refetchAllBets} />
        </div>
        <div className="h-[480px]">
          <WinProbabilityCard marketInfo={marketInfo} allBets={allBets} />
        </div>
        <div className="h-[480px]">
          <BattleInfoCard marketInfo={marketInfo} />
        </div>
      </main>
    </div>
  );
}



// --- MAIN PAGE ---
export default function BattleDetailPage() {
  const params = useParams();
  const marketAddress = params.slug as string;

  // Check if it's a valid address (starts with 0x and has correct length)
  const isValidAddress = marketAddress?.startsWith("0x") && marketAddress.length === 42;
  
  // Fetch market data from blockchain
  const { data: marketInfo, isLoading: isLoadingMarket, error: marketError, refetch: refetchMarketInfo } = useFactoryGetMarketInfo(
    {},
    isValidAddress ? (marketAddress as Address) : undefined
  );

  // Get all user bets
  const { data: allBets, isLoading: isLoadingBets, error: betsError, refetch: refetchAllBets } = usePredictionMarketGetAllBets(
    isValidAddress ? (marketAddress as Address) : undefined
  );

  // Console log all bets when they're available
  useEffect(() => {
    if (allBets && allBets.length > 0) {
      console.log("All user bets:", allBets);
    } else if (allBets && allBets.length === 0) {
      console.log("No bets found");
    }
  }, [allBets]);

  if (isLoadingMarket) {
    return (
      <div className="min-h-screen bg-black text-white pt-24 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-gray-400 text-sm font-mono">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (marketError || !marketInfo) {
    return (
      <div className="min-h-screen bg-black text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 text-center py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-2xl font-mono font-bold text-red-500 mb-4">
            {marketError ? "Market not found on blockchain" : "Market not found"}
          </h1>
          <Link href="/markets" className="text-zinc-400 hover:text-white font-mono text-sm">
            ← Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  return <BattleContent marketInfo={marketInfo} allBets={allBets} refetchMarketInfo={refetchMarketInfo} refetchAllBets={refetchAllBets} />;
}
