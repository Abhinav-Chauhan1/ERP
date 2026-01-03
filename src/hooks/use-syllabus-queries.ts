"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCachedModulesBySyllabus,
  getCachedSubModulesByModule,
  getPaginatedModules,
  getCachedModuleById,
  getCachedSyllabusProgress,
} from "@/lib/actions/cachedModuleActions";
import {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  type CreateModuleInput,
  type UpdateModuleInput,
  type ReorderModulesInput,
} from "@/lib/actions/moduleActions";
import {
  createSubModule,
  updateSubModule,
  deleteSubModule,
  moveSubModule,
  reorderSubModules,
  type CreateSubModuleInput,
  type UpdateSubModuleInput,
  type MoveSubModuleInput,
  type ReorderSubModulesInput,
} from "@/lib/actions/subModuleActions";

/**
 * Query keys for React Query
 * Organized hierarchically for easy invalidation
 */
export const syllabusQueryKeys = {
  all: ["syllabus"] as const,
  modules: (syllabusId: string) => ["syllabus", "modules", syllabusId] as const,
  modulesPaginated: (syllabusId: string, page: number, pageSize: number) =>
    ["syllabus", "modules", syllabusId, "paginated", page, pageSize] as const,
  module: (moduleId: string) => ["syllabus", "module", moduleId] as const,
  subModules: (moduleId: string) => ["syllabus", "subModules", moduleId] as const,
  progress: (syllabusId: string, teacherId: string) =>
    ["syllabus", "progress", syllabusId, teacherId] as const,
};

/**
 * Hook to fetch modules for a syllabus with caching
 * Requirements: 1.4, 5.1, 6.1
 */
export function useModulesBySyllabus(syllabusId: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: syllabusQueryKeys.modules(syllabusId),
    queryFn: async () => {
      const result = await getCachedModulesBySyllabus(syllabusId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch modules");
      }
      return result.data;
    },
    enabled: !!syllabusId && (options.enabled !== undefined ? options.enabled : true),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch paginated modules for a syllabus
 * Requirements: Performance optimization with pagination
 */
export function usePaginatedModules(
  syllabusId: string,
  options: {
    page?: number;
    pageSize?: number;
    cursor?: string;
  } = {},
  queryOptions: { enabled?: boolean } = {}
) {
  const { page = 1, pageSize = 20, cursor } = options;

  return useQuery({
    queryKey: syllabusQueryKeys.modulesPaginated(syllabusId, page, pageSize),
    queryFn: async () => {
      const result = await getPaginatedModules(syllabusId, { page, pageSize, cursor });
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch paginated modules");
      }
      return result.data;
    },
    enabled: !!syllabusId && (queryOptions.enabled !== undefined ? queryOptions.enabled : true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous page data while fetching new page (v5 way)
  });
}

/**
 * Hook to fetch a single module with all nested data
 */
export function useModuleById(moduleId: string) {
  return useQuery({
    queryKey: syllabusQueryKeys.module(moduleId),
    queryFn: async () => {
      const result = await getCachedModuleById(moduleId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch module");
      }
      return result.data;
    },
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch sub-modules for a module with caching
 * Requirements: 2.2, 2.5, 5.2, 6.2
 */
export function useSubModulesByModule(moduleId: string) {
  return useQuery({
    queryKey: syllabusQueryKeys.subModules(moduleId),
    queryFn: async () => {
      const result = await getCachedSubModulesByModule(moduleId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch sub-modules");
      }
      return result.data;
    },
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch syllabus progress with caching
 * Requirements: 10.3, 10.4
 */
export function useSyllabusProgress(syllabusId: string, teacherId: string) {
  return useQuery({
    queryKey: syllabusQueryKeys.progress(syllabusId, teacherId),
    queryFn: async () => {
      const result = await getCachedSyllabusProgress(syllabusId, teacherId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch syllabus progress");
      }
      return result.data;
    },
    enabled: !!syllabusId && !!teacherId,
    staleTime: 1 * 60 * 1000, // 1 minute (progress changes more frequently)
  });
}

/**
 * Mutation hook to create a module
 * Requirements: 1.1, 1.2
 */
export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateModuleInput) => {
      const result = await createModule(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to create module");
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch modules for this syllabus
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.modules(variables.syllabusId),
      });
      // Invalidate paginated queries
      queryClient.invalidateQueries({
        queryKey: ["syllabus", "modules", variables.syllabusId, "paginated"],
      });
    },
  });
}

/**
 * Mutation hook to update a module
 * Requirements: 1.5
 */
export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateModuleInput) => {
      const result = await updateModule(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to update module");
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific module
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.module(variables.id),
      });
      // Invalidate modules list
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.modules(variables.syllabusId),
      });
      // Invalidate paginated queries
      queryClient.invalidateQueries({
        queryKey: ["syllabus", "modules", variables.syllabusId, "paginated"],
      });
    },
  });
}

/**
 * Mutation hook to delete a module
 * Requirements: 2.3, 3.5
 */
export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, syllabusId }: { id: string; syllabusId: string }) => {
      const result = await deleteModule(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete module");
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate modules list
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.modules(variables.syllabusId),
      });
      // Invalidate paginated queries
      queryClient.invalidateQueries({
        queryKey: ["syllabus", "modules", variables.syllabusId, "paginated"],
      });
      // Remove specific module from cache
      queryClient.removeQueries({
        queryKey: syllabusQueryKeys.module(variables.id),
      });
    },
  });
}

/**
 * Mutation hook to reorder modules
 * Requirements: 8.1
 */
export function useReorderModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReorderModulesInput) => {
      const result = await reorderModules(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to reorder modules");
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate modules list
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.modules(variables.syllabusId),
      });
      // Invalidate paginated queries
      queryClient.invalidateQueries({
        queryKey: ["syllabus", "modules", variables.syllabusId, "paginated"],
      });
    },
  });
}

/**
 * Mutation hook to create a sub-module
 * Requirements: 2.1
 */
export function useCreateSubModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSubModuleInput) => {
      const result = await createSubModule(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to create sub-module");
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate sub-modules for this module
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.subModules(variables.moduleId),
      });
      // Invalidate parent module
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.module(variables.moduleId),
      });
    },
  });
}

/**
 * Mutation hook to update a sub-module
 * Requirements: 2.1
 */
export function useUpdateSubModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSubModuleInput) => {
      const result = await updateSubModule(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to update sub-module");
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate sub-modules for this module
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.subModules(variables.moduleId),
      });
      // Invalidate parent module
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.module(variables.moduleId),
      });
    },
  });
}

/**
 * Mutation hook to delete a sub-module
 * Requirements: 2.3
 */
export function useDeleteSubModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, moduleId }: { id: string; moduleId: string }) => {
      const result = await deleteSubModule(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete sub-module");
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate sub-modules for this module
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.subModules(variables.moduleId),
      });
      // Invalidate parent module
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.module(variables.moduleId),
      });
    },
  });
}

/**
 * Mutation hook to move a sub-module to a different module
 * Requirements: 2.4, 8.3
 */
export function useMoveSubModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: MoveSubModuleInput & { sourceModuleId: string }
    ) => {
      const result = await moveSubModule(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to move sub-module");
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate sub-modules for both source and target modules
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.subModules(variables.sourceModuleId),
      });
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.subModules(variables.targetModuleId),
      });
      // Invalidate both modules
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.module(variables.sourceModuleId),
      });
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.module(variables.targetModuleId),
      });
    },
  });
}

/**
 * Mutation hook to reorder sub-modules
 * Requirements: 2.5, 8.2
 */
export function useReorderSubModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReorderSubModulesInput) => {
      const result = await reorderSubModules(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to reorder sub-modules");
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate sub-modules for this module
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.subModules(variables.moduleId),
      });
      // Invalidate parent module
      queryClient.invalidateQueries({
        queryKey: syllabusQueryKeys.module(variables.moduleId),
      });
    },
  });
}
