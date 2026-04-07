"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectWithRelations } from "@/types";

async function fetchProject(id: string): Promise<ProjectWithRelations> {
  const res = await fetch(`/api/projects/${id}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

async function fetchProjects(): Promise<ProjectWithRelations[]> {
  const res = await fetch("/api/projects");
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
