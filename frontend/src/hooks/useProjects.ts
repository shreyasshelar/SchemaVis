// Re-exports from useFolders for backward compatibility.
// New code should use useFolders directly.
export { folderKeys as projectKeys, useFolderTree as useProjects } from '@/hooks/useFolders'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '@/api/sessions'
import { foldersApi } from '@/api/folders'
import { useAppStore } from '@/store/appStore'
import { folderKeys } from '@/hooks/useFolders'

/** Rename a session (still used by legacy code paths if any) */
export function useRenameProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, name }: { sessionId: string; name: string }) =>
      sessionsApi.rename(sessionId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: folderKeys.tree }),
  })
}

/** Delete a session (still used by legacy code paths if any) */
export function useDeleteProject() {
  const qc = useQueryClient()
  const { resetSession, sessionId: activeId } = useAppStore()
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.remove(sessionId),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: folderKeys.tree })
      if (sessionId === activeId) resetSession()
    },
  })
}
