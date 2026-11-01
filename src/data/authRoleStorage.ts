// Role and authentication management for Yimeo's home
// Controls access permissions between "chủ khu tự trị" (Admin) and "người xem" (Viewer)

export type UserRole = 'admin' | 'viewer';

const ROLE_KEY = 'yimeo_user_role';
export const ADMIN_PASSWORD = 'sweetbites_.';

export function getUserRole(): UserRole | null {
  if (typeof sessionStorage === 'undefined') return null;
  const role = sessionStorage.getItem(ROLE_KEY);
  if (role === 'admin' || role === 'viewer') return role;
  return null;
}

export function setUserRole(role: UserRole): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(ROLE_KEY, role);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_role_changed', { detail: role }));
  }
}

export function clearUserRole(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(ROLE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_role_changed', { detail: null }));
  }
}

export function isAdminUser(): boolean {
  return getUserRole() === 'admin';
}

export function isViewerUser(): boolean {
  return getUserRole() === 'viewer';
}

export function verifyAdminPassword(inputPass: string): boolean {
  return inputPass === ADMIN_PASSWORD;
}
