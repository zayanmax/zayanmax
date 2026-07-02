import type { Announcement, AnnouncementAudience, AnnouncementPayload } from "@/features/communication/types";
import type { AnnouncementFormValues } from "@/features/communication/schemas";

export const ALL = "__all__";

export function formatCommunicationDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export function audienceLabel(audiences?: AnnouncementAudience[]) {
  if (!audiences?.length) return "All company";
  return audiences
    .map((audience) => {
      if (audience.audienceType === "ALL_COMPANY") return "All company";
      const id =
        audience.branchId ??
        audience.departmentId ??
        audience.employeeId ??
        audience.roleId;
      return `${audience.audienceType.replaceAll("_", " ")}${id ? ` (${id.slice(0, 8)})` : ""}`;
    })
    .join(", ");
}

export function toAnnouncementPayload(values: AnnouncementFormValues): AnnouncementPayload {
  const audience = {
    audienceType: values.audienceType,
    branchId: values.audienceType === "BRANCH" ? values.branchId.trim() || undefined : undefined,
    departmentId: values.audienceType === "DEPARTMENT" ? values.departmentId.trim() || undefined : undefined,
    employeeId: values.audienceType === "EMPLOYEE" ? values.employeeId.trim() || undefined : undefined,
    roleId: values.audienceType === "ROLE" ? values.roleId.trim() || undefined : undefined,
  };
  return {
    title: values.title.trim(),
    body: values.body.trim(),
    audiences: [audience],
  };
}

export function toAnnouncementUpdatePayload(values: AnnouncementFormValues) {
  return {
    title: values.title.trim(),
    body: values.body.trim(),
  };
}

export function announcementDefaultValues(announcement?: Announcement): AnnouncementFormValues {
  const firstAudience = announcement?.audiences?.[0];
  return {
    title: announcement?.title ?? "",
    body: announcement?.body ?? "",
    audienceType: firstAudience?.audienceType ?? "ALL_COMPANY",
    branchId: firstAudience?.branchId ?? "",
    departmentId: firstAudience?.departmentId ?? "",
    employeeId: firstAudience?.employeeId ?? "",
    roleId: firstAudience?.roleId ?? "",
  };
}
