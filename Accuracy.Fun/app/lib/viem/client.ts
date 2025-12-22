import { createPublicClient, http } from 'viem';
import { mantleTestnet } from '@/app/config/chains';

export const publicClient = createPublicClient({
    chain: mantleTestnet,
    transport: http(process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz'),
});

