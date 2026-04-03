import Cookies from 'js-cookie';

export function commitSession(user: { id: string; role: string }) {
  Cookies.set('auth-role', user.role, { expires: 1 });
  Cookies.set('auth-user-id', user.id, { expires: 1 });
}
