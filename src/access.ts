/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  const signedIn = Boolean(currentUser);
  const isAdmin = currentUser?.access === 'admin';
  return {
    canAdmin: isAdmin,
    canReadOperations: signedIn,
    canOperate: signedIn,
    canExport: isAdmin,
    canManageSystem: isAdmin,
    canEditDigitalTwin: isAdmin,
  };
}
