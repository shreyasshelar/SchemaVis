import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foldersApi } from '@/api/folders'

export const folderKeys = {
  all:  ['folders'] as const,
  tree: ['folders', 'tree'] as const,
}

/** Fetch the full project tree (folders + ungrouped sessions) */
export function useFolderTree() {
  return useQuery({
    queryKey: folderKeys.tree,
    queryFn:  () => foldersApi.tree(),
    staleTime: 30_000,
  })
}

/** Create a new folder */
export function useCreateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => foldersApi.create(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.tree })
    },
  })
}

/** Rename a folder */
export function useRenameFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name: string }) =>
      foldersApi.rename(projectId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.tree })
    },
  })
}

/** Delete a folder (sessions inside become ungrouped) */
export function useDeleteFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => foldersApi.delete(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.tree })
    },
  })
}

/** Move a session to a folder (or ungroup it) */
export function useMoveSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, projectId }: { sessionId: string; projectId: string | null }) =>
      foldersApi.moveSession(sessionId, projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.tree })
    },
  })
}
