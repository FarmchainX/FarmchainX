export function getPortalRouteByRole(role) {
  if (role === 'FARMER') return '/farmer';
  if (role === 'DELIVERY_PARTNER') return '/delivery';
  if (role === 'ADMIN') return '/admin';
  if (role === 'CUSTOMER') return '/customer';
  return '/login';
}

