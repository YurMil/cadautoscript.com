import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import clsx from 'clsx';
import type {User} from '@supabase/supabase-js';
import Link from '@docusaurus/Link';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import styles from './NavbarAuth.module.css';

const shouldSilence = (message?: string | null) =>
  !message || message.toLowerCase().includes('auth session missing');

const reportError = (message?: string) => {
  if (!message || shouldSilence(message)) {
    return;
  }
  if (typeof console !== 'undefined') {
    console.error(`[Supabase Auth] ${message}`);
  }
};

export default function NavbarAuth(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number; left: number; width: number} | null>(null);
  const {openLoginModal, closeLoginModal} = useAuthModal();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      try {
        const {data, error} = await supabase.auth.getSession();
        if (!isMounted) {
          return;
        }

        if (error && !shouldSilence(error.message)) {
          reportError(error.message);
        }
        setUser(data?.session?.user ?? null);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Unable to fetch auth session.';
        reportError(message);
      }
    };

    resolveSession();

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setMenuOpen(false);
      closeLoginModal();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [closeLoginModal]);

  useEffect(() => {
    if (!user) return;
    let didUpdate = false;
    const updatePresence = async () => {
      try {
        const now = new Date().toISOString();
        const lastSeen = window.localStorage.getItem('lastSeenAt');
        if (lastSeen && Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000) {
          return;
        }
        window.localStorage.setItem('lastSeenAt', now);
        didUpdate = true;
        await supabase.from('profiles').update({last_seen_at: now}).eq('id', user.id);
      } catch (err) {
        console.error('[Supabase Presence] Unable to update last_seen_at', err);
      }
    };
    void updatePresence();
    return () => {
      if (didUpdate) {
        window.localStorage.removeItem('lastSeenAt');
      }
    };
  }, [user]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (containerRef.current && containerRef.current.contains(target)) ||
        (dropdownRef.current && dropdownRef.current.contains(target))
      ) {
        return;
      }
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const updateDropdownPosition = useCallback(() => {
    if (!menuButtonRef.current) {
      return;
    }
    const rect = menuButtonRef.current.getBoundingClientRect();
    const minWidth = 220;
    const padding = 16;
    const width = Math.max(rect.width, minWidth);
    const viewportWidth = window.innerWidth;
    const maxLeft = viewportWidth - width - padding;
    const left = Math.max(padding, Math.min(rect.left, maxLeft));
    const top = rect.bottom + 10;
    setDropdownPosition({top, left, width});
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) {
      setDropdownPosition(null);
      return;
    }
    updateDropdownPosition();
    const handleReflow = () => {
      updateDropdownPosition();
    };
    window.addEventListener('resize', handleReflow);
    window.addEventListener('scroll', handleReflow, true);
    return () => {
      window.removeEventListener('resize', handleReflow);
      window.removeEventListener('scroll', handleReflow, true);
    };
  }, [menuOpen, updateDropdownPosition]);

  const handleSignOut = async () => {
    const {error: signOutError} = await supabase.auth.signOut();
    if (signOutError && !shouldSilence(signOutError.message)) {
      reportError(signOutError.message);
    }
    setMenuOpen(false);
  };

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? undefined;
  const email = user?.email ?? (user?.user_metadata?.email as string | undefined);
  const displayName =
    (user?.user_metadata?.user_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    undefined;

  const renderSignedOut = () => (
    <button type="button" className={styles.signInButton} onClick={openLoginModal}>
      Sign In
    </button>
  );

  if (!isMounted) {
    return <div className={styles.container}>{renderSignedOut()}</div>;
  }

  return (
    <div className={clsx(styles.container, 'navbar-auth-control')} ref={containerRef}>
      {user ? (
        <>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => setMenuOpen((value) => !value)}
            ref={menuButtonRef}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className={styles.avatarImage} referrerPolicy="no-referrer" />
            ) : (
              <span className={styles.placeholderAvatar}>{initials}</span>
            )}
            {displayName ? <span>{displayName}</span> : null}
          </button>
          {menuOpen
            ? (() => {
                const dropdown = (
                  <div
                    ref={dropdownRef}
                    className={styles.dropdown}
                    style={
                      dropdownPosition
                        ? {
                            position: 'fixed',
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width,
                          }
                        : undefined
                    }
                  >
                    {email ? <p className={styles.email}>{email}</p> : null}
                    <Link
                      to="/profile"
                      className={styles.dropdownButton}
                      onClick={() => setMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button type="button" className={styles.dropdownButton} onClick={handleSignOut}>
                      Sign Out
                    </button>
                  </div>
                );
                return dropdownPosition ? createPortal(dropdown, document.body) : dropdown;
              })()
            : null}
        </>
      ) : (
        renderSignedOut()
      )}
    </div>
  );
}
