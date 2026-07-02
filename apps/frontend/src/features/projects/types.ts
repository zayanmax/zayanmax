import type { ApiMeta } from "@/types/api";
import type { Client } from "@/features/clients/types";

export type ProjectStatus =
  | "PLANNED"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type ProjectCounts = {
  members?: number;
  tasks?: number;
};

export type ProjectMember = {
  id: string;
  companyId: string;
  projectId: string;
  userId?: string | null;
  employeeId?: string | null;
  role?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type ProjectTaskSummary = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string | null;
};

export type Project = {
  id: string;
  companyId: string;
  clientId?: string | null;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  client?: Pick<Client, "id" | "name"> | null;
  members?: ProjectMember[];
  tasks?: ProjectTaskSummary[];
  _count?: ProjectCounts;
};

export type ProjectPayload = {
  name: string;
  description?: string;
  clientId?: string;
  status?: ProjectStatus;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
};

export type ProjectListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: ProjectStatus;
  clientId?: string;
  memberUserId?: string;
  memberEmployeeId?: string;
};

export type ProjectListResult = {
  data: Project[];
  meta: Required<ApiMeta>;
};

export type AddProjectMemberPayload = {
  userId?: string;
  employeeId?: string;
  role?: string;
};

export type ChangeProjectStatusPayload = {
  status: ProjectStatus;
  completedAt?: string;
};
