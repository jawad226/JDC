import Cookies from 'js-cookie';
import { ACCESS_TOKEN_COOKIE } from '@/lib/api/axios.config';

const SESSION_DAYS = 7;

export function commitSession(user: { id: string; role: string }, accessToken?: string) {
  Cookies.set('auth-role', user.role, { expires: SESSION_DAYS, sameSite: 'lax' });
  Cookies.set('auth-user-id', user.id, { expires: SESSION_DAYS, sameSite: 'lax' });
  if (accessToken) {
    Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, { expires: SESSION_DAYS, sameSite: 'lax' });
  }
}

export function clearSessionCookies() {
  Cookies.remove('auth-role');
  Cookies.remove('auth-user-id');
  Cookies.remove(ACCESS_TOKEN_COOKIE);
}
