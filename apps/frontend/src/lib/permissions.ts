export function hasAllPermissions(
  userPermissions: string[] = [],
  required?: string | string[],
) {
  if (!required) return true;
  const permissions = Array.isArray(required) ? required : [required];
  return permissions.every((permission) => userPermissions.includes(permission));
}
