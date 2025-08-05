import { useQuery } from "@tanstack/react-query";
import { vaultApi } from "../services/api/vaultApi";
import { transformVaultData } from "../utils/vaultTransform";
import { VaultData, BackendVaultResponse } from "../types/api";

// Query keys for React Query
export const VAULT_QUERY_KEYS = {
  all: ["vaults"] as const,
  lists: () => [...VAULT_QUERY_KEYS.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...VAULT_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...VAULT_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...VAULT_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Hook to fetch all vaults
 */
export const useVaults = () => {
  return useQuery({
    queryKey: VAULT_QUERY_KEYS.lists(),
    queryFn: async (): Promise<VaultData[]> => {
      const backendVaults = await vaultApi.getAllVaults();
      return backendVaults.map((vault: BackendVaultResponse, index: number) =>
        transformVaultData(vault, index)
      );
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (previously cacheTime)
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
