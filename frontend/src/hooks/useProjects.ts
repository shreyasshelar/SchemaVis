import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '@/api/sessions'
import { useAppStore } from '@/store/appStore'

export const projectKeys = {
  all: ['projects'] as const,
}

/** Fetch all schema projects for the current user */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn:  () => sessionsApi.list(),
    staleTime: 30_000,
  })
}

/** Rename a project */
export function useRenameProject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, name }: { sessionId: string; name: string }) =>
      sessionsApi.rename(sessionId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

/** Delete a project */
export function useDeleteProject() {
  const qc = useQueryClient()
  const { resetSession, sessionId: activeId } = useAppStore()

  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.remove(sessionId),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: projectKeys.all })
      // If the deleted project was the active one, reset the chat panel
      if (sessionId === activeId) resetSession()
    },
  })
}
