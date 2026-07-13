import React, {useState} from 'react';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {getAuthRedirectUrl, rememberReturnTo} from '@site/src/utils/authRedirect';

const AuthTest = () => {
  const {user, authChecked} = useAuthStatus();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      rememberReturnTo();
      const redirectTo = getAuthRedirectUrl();
      const {error: signInError} = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (signInError) {
        setError(signInError.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login.');
    }
  };

  const handleLogout = async () => {
    setError(null);
    try {
      const {error: signOutError} = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to logout.');
    }
  };

  if (!authChecked) {
    return <p>Checking auth status…</p>;
  }

  return (
    <div>
      {user ? (
        <div>
          <p>Signed in as {user.email}</p>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <button type="button" onClick={handleLogin}>
          Login with Google
        </button>
      )}
      {error ? <p style={{color: 'red'}}>{error}</p> : null}
    </div>
  );
};

export default AuthTest;
