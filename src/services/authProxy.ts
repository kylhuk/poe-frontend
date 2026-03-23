import { supabase } from '@/integrations/supabase/client';

export const POE_OAUTH_MESSAGE = 'poe-oauth-result';

export function getAuthProxyUrl(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/api-proxy`;
}

export async function authProxyFetch(path: string, init?: RequestInit): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(getAuthProxyUrl(), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-proxy-path': `/api/v1/auth${path}`,
      ...(init?.headers || {}),
    },
  });
}

export function getOAuthPopupFeatures(): string {
  const width = 560;
  const height = 760;
  const left = window.screenX + Math.max(0, Math.round((window.outerWidth - width) / 2));
  const top = window.screenY + Math.max(0, Math.round((window.outerHeight - height) / 2));

  return [
    'popup=yes',
    'resizable=yes',
    'scrollbars=yes',
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
  ].join(',');
}
