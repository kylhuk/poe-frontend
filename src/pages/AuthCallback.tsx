import { useEffect, useState } from 'react';
import { API_BASE } from '@/services/config';

type CallbackState = 'loading' | 'success' | 'error';

const AuthCallback = () => {
  const [state, setState] = useState<CallbackState>('loading');
  const [message, setMessage] = useState('Completing secure login session...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payload = {
      code: params.get('code'),
      state: params.get('state'),
      error: params.get('error'),
      error_description: params.get('error_description'),
    };
    window.history.replaceState({}, '', window.location.pathname);

    const finish = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/auth/callback`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`Callback failed (${response.status})`);
        }
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'poe_auth_callback_complete', status: 'success', reason: '' }, window.location.origin);
          window.close();
          return;
        }
        setState('success');
        setMessage('Login complete. You can return to the app.');
      } catch (error) {
        setState('error');
        setMessage(error instanceof Error ? error.message : 'Login failed');
      }
    };

    void finish();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm text-center space-y-3">
        <p className="text-muted-foreground text-sm font-mono">{message}</p>
        {state === 'error' && (
          <a href={`${API_BASE}/api/v1/auth/login`} className="text-xs text-primary underline">
            Try signing in again
          </a>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
