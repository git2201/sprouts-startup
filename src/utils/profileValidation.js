export const VALID_ROLES = [
  "technical", "engineer", "developer", // Technical
  "marketing", "sales", "growth", "visionary", // Non-Technical
  "designer", "product manager", "generalist", "operator", "media & brand" // Neutral
];

export const hasDeprecatedRolesOrMissingFields = (user) => {
  if (!user) return true;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  return (
    roles.some(role => !VALID_ROLES.includes(role.toLowerCase())) ||
    !user.age || !user.location || !user.availability
  );
}; 