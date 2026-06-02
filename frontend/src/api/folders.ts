import { apiClient } from './client'
import type { FolderSummary, ProjectTree } from '@/types/api'

export const foldersApi = {
  /** Full sidebar tree: folders with sessions + ungrouped sessions */
  tree: () =>
    apiClient.get<ProjectTree>('/api/projects').then((r) => r.data),

  /** Create a new folder */
  create: (name: string) =>
    apiClient.post<FolderSummary>('/api/projects', { name }).then((r) => r.data),

  /** Rename a folder */
  rename: (projectId: string, name: string) =>
    apiClient
      .put<FolderSummary>(`/api/projects/${projectId}/name`, { name })
      .then((r) => r.data),

  /** Delete a folder — sessions inside become ungrouped */
  delete: (projectId: string) =>
    apiClient.delete(`/api/projects/${projectId}`).then(() => undefined as void),

  /** Move a session into a folder, or ungroup it (projectId = null) */
  moveSession: (sessionId: string, projectId: string | null) =>
    apiClient
      .put(`/api/sessions/${sessionId}/project`, { projectId })
      .then(() => undefined as void),
}
