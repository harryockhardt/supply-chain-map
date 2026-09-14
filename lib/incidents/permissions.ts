// The actor must come from the verified server session and current profile role.
// Database RLS independently enforces the same rule on every write.
export function canManageIncident(actor: { user: { id: string }; isAdmin: boolean }, ownerId: string) {
  return Boolean(actor.user.id) && (actor.isAdmin || actor.user.id === ownerId);
}
