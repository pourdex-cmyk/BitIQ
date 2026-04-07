"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BidWithRelations } from "@/types";

export function useBids(projectId: string) {
  return useQuery({
    queryKey: ["bids", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/bids?projectId=${projectId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as BidWithRelations[];
    },
    enabled: !!projectId,
  });
}

export function useScoreBids(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/score-bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}

export function useSelectBid(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bidId: string) => {
      const res = await fetch(`/api/bids/${bidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select" }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}
