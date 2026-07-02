import { apiRequest } from "@/lib/api/client";
import type {
  AddProjectMemberPayload,
  ChangeProjectStatusPayload,
  Project,
  ProjectListQuery,
  ProjectListResult,
  ProjectMember,
  ProjectPayload,
} from "@/features/projects/types";

export const projectsApi = {
  list: (params: ProjectListQuery) =>
    apiRequest<ProjectListResult>({
      url: "/projects",
      method: "GET",
      params,
    }),
  get: (id: string) =>
    apiRequest<Project>({
      url: `/projects/${id}`,
      method: "GET",
    }),
  create: (payload: ProjectPayload) =>
    apiRequest<Project>({
      url: "/projects",
      method: "POST",
      data: payload,
    }),
  update: (id: string, payload: Partial<ProjectPayload>) =>
    apiRequest<Project>({
      url: `/projects/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeStatus: (id: string, payload: ChangeProjectStatusPayload) =>
    apiRequest<Project>({
      url: `/projects/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  remove: (id: string) =>
    apiRequest<{ deleted: boolean }>({
      url: `/projects/${id}`,
      method: "DELETE",
    }),
  listMembers: (id: string) =>
    apiRequest<ProjectMember[]>({
      url: `/projects/${id}/members`,
      method: "GET",
    }),
  addMember: (id: string, payload: AddProjectMemberPayload) =>
    apiRequest<ProjectMember>({
      url: `/projects/${id}/members`,
      method: "POST",
      data: payload,
    }),
  removeMember: (projectId: string, memberId: string) =>
    apiRequest<{ deleted: boolean }>({
      url: `/projects/${projectId}/members/${memberId}`,
      method: "DELETE",
    }),
};
