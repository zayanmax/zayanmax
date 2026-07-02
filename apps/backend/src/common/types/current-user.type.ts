export type CurrentUser = {
  id: string;
  companyId: string;
  email: string;
  employeeId?: string | null;
  permissions: string[];
};
