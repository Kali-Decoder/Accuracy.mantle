'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId, usePublicClient } from 'wagmi';
import { mantleTestnet } from '../config/chains';
import { Address, Abi, decodeEventLog } from 'viem';
import { PredictionMarketFactoryABI, Addresses } from '../config/abi_config';

type UseFactoryConfig = {
    enabled?: boolean;
    chainId?: number;
};
function getFactoryAddress(chainId: number): Address | undefined {
    const chainIdStr = chainId.toString();
    const addresses = Addresses[chainIdStr as keyof typeof Addresses];
    return addresses?.PredictionMarketFactory as Address | undefined;
}
export function useFactoryMaxPlatformFee(config: UseFactoryConfig = {}) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);
    return useReadContract({
        address: factoryAddress,
        abi: PredictionMarketFactoryABI as Abi,
        functionName: 'MAX_PLATFORM_FEE',
        query: {
            enabled: config.enabled !== false && !!factoryAddress,
        },
    });
}

export function useFactoryPlatformFee(config: UseFactoryConfig = {}) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);

    return useReadContract({
        address: factoryAddress,
        abi: PredictionMarketFactoryABI as Abi,
        functionName: 'platformFee',
        query: {
            enabled: config.enabled !== false && !!factoryAddress,
        },
    });
}

export function useFactoryOwner(config: UseFactoryConfig = {}) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);

    return useReadContract({
        address: factoryAddress,
        abi: PredictionMarketFactoryABI as Abi,
        functionName: 'owner',
        query: {
            enabled: config.enabled !== false && !!factoryAddress,
        },
    });
}

export function useFactoryGetAllMarkets(config: UseFactoryConfig = {}) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);

    return useReadContract({
        address: factoryAddress,
        abi: PredictionMarketFactoryABI as Abi,
        functionName: 'getAllMarkets',
        query: {
            enabled: config.enabled !== false && !!factoryAddress,
        },
    });
}
export function useFactoryGetMarketCount(config: UseFactoryConfig = {}) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);

    return useReadContract({
        address: factoryAddress,
        abi: PredictionMarketFactoryABI as Abi,
        functionName: 'getMarketCount',
        query: {
            enabled: config.enabled !== false && !!factoryAddress,
        },
    });
}

export function useFactoryGetMarket(config: UseFactoryConfig = {}, index?: bigint) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);

    return useReadContract({
        address: factoryAddress,
        abi: PredictionMarketFactoryABI as Abi,
        functionName: 'getMarket',
        args: index !== undefined ? [index] : undefined,
        query: {
            enabled: config.enabled !== false && !!factoryAddress && index !== undefined,
        },
    });
}

/**
 * Hook to get markets filtered by status
 * @param status Market status (0=Pending, 1=Active, 2=Resolved, 3=Cancelled)
 */
export function useFactoryGetMarketsByStatus(config: UseFactoryConfig = {}, status?: number) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);

    return useReadContract({
        address: factoryAddress,
        abi: PredictionMarketFactoryABI as Abi,
        functionName: 'getMarketsByStatus',
        args: status !== undefined ? [status] : undefined,
        query: {
            enabled: config.enabled !== false && !!factoryAddress && status !== undefined,
        },
    });
}

/**
 * Hook to get market information for a specific market
 * Returns parsed MarketInfo object
 */
export function useFactoryGetMarketInfo(config: UseFactoryConfig = {}, marketAddress?: Address) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);
   

    const { data: rawMarketInfo, isLoading, error, refetch } = useReadContract({
        address: factoryAddress,
        abi: PredictionMarketFactoryABI as Abi,
        functionName: 'getMarketInfo',
        args: marketAddress ? [marketAddress] : undefined,
        query: {
            enabled: config.enabled !== false && !!factoryAddress && !!marketAddress,
        },
    });

    const [parsedMarketInfo, setParsedMarketInfo] = useState<MarketInfo | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<Error | null>(null);

    // Parse market info when raw data is available
    useEffect(() => {
        if (!rawMarketInfo || !marketAddress) {
            setParsedMarketInfo(null);
            setIsParsing(false);
            return;
        }

        setIsParsing(true);
        setParseError(null);

        try {
            // Helper function to convert BigInt to string
            const toBigIntString = (value: any): string => {
                if (value === null || value === undefined) return '0';
                if (typeof value === 'bigint') return value.toString();
                if (typeof value === 'string') return value;
                return BigInt(value || 0).toString();
            };

            // Handle array response from viem (same as useFactoryGetAllMarketsWithData)
            const marketInfo = rawMarketInfo as any;

            // Structure market info as explicit key-value pairs (same format as useFactoryGetAllMarketsWithData)
            const marketData: MarketInfo = {
                name: marketInfo[0] || '',
                description: marketInfo[1] || '',
                imageUrl: marketInfo[2] || '',
                parameter: marketInfo[3] || '',
                category: marketInfo[4] || '',
                startTime: Number(toBigIntString(marketInfo[5])),
                endTime: Number(toBigIntString(marketInfo[6])),
                minValue: Number(toBigIntString(marketInfo[7])),
                maxValue: Number(toBigIntString(marketInfo[8])),
                step: Number(toBigIntString(marketInfo[9])),
                initialValue: Number(toBigIntString(marketInfo[10])),
                status: Number(marketInfo[11] || 0),
                totalVolume: Number(toBigIntString(marketInfo[12])),
                totalParticipants: Number(toBigIntString(marketInfo[13])),
                finalValue: Number(toBigIntString(marketInfo[14])),
                address: marketAddress as Address,
            };

            setParsedMarketInfo(marketData);
        } catch (err) {
            console.error('Error parsing market info:', err);
            setParseError(err instanceof Error ? err : new Error('Failed to parse market data'));
        } finally {
            setIsParsing(false);
        }
    }, [rawMarketInfo, marketAddress]);

    return {
        data: parsedMarketInfo,
        isLoading: isLoading || isParsing,
        error: error || parseError,
        refetch,
    };
}

export function useFactoryIsValidMarket(config: UseFactoryConfig = {}, marketAddress?: Address) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);

    return useReadContract({
        address: factoryAddress,
        abi: PredictionMarketFactoryABI as Abi,
        functionName: 'isValidMarket',
        args: marketAddress ? [marketAddress] : undefined,
        query: {
            enabled: config.enabled !== false && !!factoryAddress && !!marketAddress,
        },
    });
}


export function useFactoryAllMarkets(config: UseFactoryConfig = {}, index?: bigint) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);

    return useReadContract({
        address: factoryAddress,
        abi: PredictionMarketFactoryABI as Abi,
        functionName: 'allMarkets',
        args: index !== undefined ? [index] : undefined,
        query: {
            enabled: config.enabled !== false && !!factoryAddress && index !== undefined,
        },
    });
}

export function useFactoryWrite(config: UseFactoryConfig = {}) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);
    const { writeContract, data: hash, error, isPending, isSuccess, reset: resetWrite } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
        hash,
    });

    const write = (functionName: string, args?: any[]) => {
        if (!factoryAddress) {
            throw new Error('Factory address not found for current chain');
        }
        return writeContract({
            address: factoryAddress,
            abi: PredictionMarketFactoryABI as Abi,
            functionName,
            args,
        });
    };

    return {
        write,
        hash,
        error,
        isPending,
        isSuccess,
        isConfirming,
        isConfirmed,
        receipt,
        factoryAddress,
        reset: resetWrite,
    };
}

export interface CreateMarketParams {
    name: string;
    description: string;
    imageUrl: string;
    parameter: string;
    category: string;
    startTime: bigint;
    endTime: bigint;
    minValue: bigint;
    maxValue: bigint;
    step: bigint;
    initialValue: bigint;
}

/**
 * Hook to create a new prediction market
 */
export function useFactoryCreateMarket(config: UseFactoryConfig = {}) {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const write = useFactoryWrite(config);
    const [marketAddress, setMarketAddress] = useState<Address | null>(null);

    // Extract market address from transaction receipt
    useEffect(() => {
        if (write.receipt && write.receipt.logs) {
            try {
                for (const log of write.receipt.logs) {
                    try {
                        const decoded = decodeEventLog({
                            abi: PredictionMarketFactoryABI as Abi,
                            eventName: 'MarketCreated',
                            data: log.data,
                            topics: log.topics,
                        }) as any;

                        if (decoded && decoded.args && decoded.args.marketAddress) {
                            setMarketAddress(decoded.args.marketAddress as Address);
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            } catch (error) {
                console.error('Error decoding MarketCreated event:', error);
            }
        }
    }, [write.receipt]);

    const createMarket = async (params: CreateMarketParams) => {
        if (!isConnected || !address) {
            throw new Error('Please connect your wallet to continue.');
        }

        if (chainId !== mantleTestnet.id) {
            throw new Error(`Please switch to ${mantleTestnet.name} (Chain ID: ${mantleTestnet.id}) to continue.`);
        }

        setMarketAddress(null);
        return write.write('createMarket', [
            params.name,
            params.description,
            params.imageUrl,
            params.parameter,
            params.category,
            params.startTime,
            params.endTime,
            params.minValue,
            params.maxValue,
            params.step,
            params.initialValue,
        ]);
    };

    return {
        ...write,
        createMarket,
        marketAddress,
    };
}

/**
 * Hook to set platform fee (owner only)
 */
export function useFactorySetPlatformFee(config: UseFactoryConfig = {}) {
    const write = useFactoryWrite(config);

    const setPlatformFee = async (fee: bigint) => {
        return write.write('setPlatformFee', [fee]);
    };

    return {
        ...write,
        setPlatformFee,
    };
}

/**
 * Hook to transfer ownership (owner only)
 */
export function useFactoryTransferOwnership(config: UseFactoryConfig = {}) {
    const write = useFactoryWrite(config);

    const transferOwnership = async (newOwner: Address) => {
        return write.write('transferOwnership', [newOwner]);
    };

    return {
        ...write,
        transferOwnership,
    };
}

/**
 * Hook to renounce ownership (owner only)
 */
export function useFactoryRenounceOwnership(config: UseFactoryConfig = {}) {
    const write = useFactoryWrite(config);

    const renounceOwnership = async () => {
        return write.write('renounceOwnership', []);
    };

    return {
        ...write,
        renounceOwnership,
    };
}

// ==================== UTILITY HOOKS ====================

/**
 * Market info type returned from getMarketInfo
 */
export type MarketInfo = {
    name: string;
    description: string;
    imageUrl: string;
    parameter: string;
    category: string;
    startTime: number; // BigInt converted to string
    endTime: number; // BigInt converted to string
    minValue: number; // BigInt converted to string
    maxValue: number; // BigInt converted to string
    step: number; // BigInt converted to string
    initialValue: number; // BigInt converted to string
    status: number; // MarketStatus enum (0=Pending, 1=Active, 2=Resolved, 3=Cancelled)
    totalVolume: number; // BigInt converted to string
    totalParticipants: number; // BigInt converted to string
    finalValue: number; // BigInt converted to string
    address: Address; // Market address
};

/**
 * Hook to fetch all markets with their complete data
 * Returns an array of market info objects
 */
export function useFactoryGetAllMarketsWithData(config: UseFactoryConfig = {}) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);
    const publicClient = usePublicClient();
    
    // Fetch all market addresses
    const { data: allMarkets, isLoading: isLoadingAddresses, error: addressesError } = useFactoryGetAllMarkets(config);
    
    const [marketsData, setMarketsData] = useState<MarketInfo[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dataError, setDataError] = useState<Error | null>(null);

    // Fetch market info for each address
    useEffect(() => {
        if (!allMarkets || !Array.isArray(allMarkets) || allMarkets.length === 0) {
            setMarketsData([]);
            setIsLoadingData(false);
            return;
        }

        if (!factoryAddress || !publicClient) {
            return;
        }

        setIsLoadingData(true);
        setDataError(null);

        // Fetch market info for all addresses in parallel
        const fetchAllMarketData = async () => {
            try {
                const marketDataPromises = allMarkets.map(async (marketAddress) => {
                    try {
                        const marketInfo = await publicClient.readContract({
                            address: factoryAddress,
                            abi: PredictionMarketFactoryABI as Abi,
                            functionName: 'getMarketInfo',
                            args: [marketAddress as Address],
                        }) as any;

                       
                        
                        // Helper function to convert BigInt to string
                        const toBigIntString = (value: any): string => {
                            if (value === null || value === undefined) return '0';
                            if (typeof value === 'bigint') return value.toString();
                            if (typeof value === 'string') return value;
                            return BigInt(value || 0).toString();
                        };
                        
                        const marketData: MarketInfo = {
                            name: marketInfo[0] || '',
                            description: marketInfo[1] || '',
                            imageUrl: marketInfo[2] || '',
                            parameter: marketInfo[3] || '',
                            category: marketInfo[4] || '',
                            startTime: Number(toBigIntString(marketInfo[5])),
                            endTime: Number(toBigIntString(marketInfo[6])),
                            minValue: Number(toBigIntString(marketInfo[7])),
                            maxValue: Number(toBigIntString(marketInfo[8])),
                            step: Number(toBigIntString(marketInfo[9])),
                            initialValue: Number(toBigIntString(marketInfo[10])),
                            status: Number(marketInfo[11] || 0),
                            totalVolume: Number(toBigIntString(marketInfo[12])),
                            totalParticipants: Number(toBigIntString(marketInfo[13])),
                            finalValue: Number(toBigIntString(marketInfo[14])),
                            address: marketAddress as Address,
                        };
                        console.log('Market Info:', marketData);

                        return marketData;
                    } catch (error) {
                        console.error(`Error fetching market info for ${marketAddress}:`, error);
                        return null;
                    }
                });

                const results = await Promise.all(marketDataPromises);
                // Filter out null results (failed fetches)
                const validMarkets = results.filter((market): market is MarketInfo => market !== null);
                setMarketsData(validMarkets);
            } catch (error) {
                console.error('Error fetching all market data:', error);
                setDataError(error instanceof Error ? error : new Error('Failed to fetch market data'));
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchAllMarketData();
    }, [allMarkets, factoryAddress, publicClient]);

    return {
        data: marketsData,
        isLoading: isLoadingAddresses || isLoadingData,
        error: addressesError || dataError,
        marketCount: Array.isArray(allMarkets) ? allMarkets.length : 0,
    };
}

/**
 * Hook to get factory address for current chain
 */
export function useFactoryAddress(config: UseFactoryConfig = {}) {
    const chainId = useChainId();
    const factoryAddress = getFactoryAddress(config.chainId || chainId);
    return factoryAddress;
}

/**
 * Combined hook for factory info (platform fee, owner, market count)
 */
export function useFactoryInfo(config: UseFactoryConfig = {}) {
    const platformFee = useFactoryPlatformFee(config);
    const owner = useFactoryOwner(config);
    const marketCount = useFactoryGetMarketCount(config);
    const maxFee = useFactoryMaxPlatformFee(config);

    return {
        platformFee: platformFee.data,
        owner: owner.data,
        marketCount: marketCount.data,
        maxPlatformFee: maxFee.data,
        isLoading: platformFee.isLoading || owner.isLoading || marketCount.isLoading || maxFee.isLoading,
        error: platformFee.error || owner.error || marketCount.error || maxFee.error,
    };
}

