import React, {useEffect, useMemo, useState} from 'react';
import clsx from 'clsx';
import type {User} from '@supabase/supabase-js';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {listUtilityUsage, type UtilityUsageStat} from '@site/src/shared/utility-usage';
import UsageRanking from '@site/src/components/UtilityUsage/UsageRanking';
import styles from './index.module.css';

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'author' | 'admin' | null;
};

const shouldSilence = (message?: string | null) =>
  !message || message.toLowerCase().includes('auth session missing');

const formatRelative = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Last opened just now';
  if (minutes < 60) return `Last opened ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last opened ${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Last opened ${days} day${days > 1 ? 's' : ''} ago`;
  return `Last opened ${new Date(value).toLocaleDateString()}`;
};

export default function ProfilePage(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({
    username: '',
    fullName: '',
    bio: '',
    avatarUrl: '',
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [promptedLogin, setPromptedLogin] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<UtilityUsageStat[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const {openLoginModal} = useAuthModal();

  const fallbackName = useMemo(
    () =>
      (user?.user_metadata?.full_name as string | undefined) ??
      user?.email ??
      '',
    [user],
  );

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      try {
        const {data, error} = await supabase.auth.getSession();
        if (!isMounted) {
          return;
        }
        if (error && !shouldSilence(error.message)) {
          console.error('[Supabase Auth] Unable to fetch session', error.message);
        }
        setUser(data?.session?.user ?? null);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Unable to fetch auth session.';
        console.error('[Supabase Auth] Unable to fetch session', message);
      } finally {
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    };

    resolveSession();

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authChecked && !user && !promptedLogin) {
      openLoginModal();
      setPromptedLogin(true);
      setLoadingProfile(false);
    }
  }, [authChecked, openLoginModal, promptedLogin, user]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsEditing(false);
      setFormState({
        username: '',
        fullName: '',
        bio: '',
        avatarUrl: '',
      });
      setLoadingProfile(false);
      return;
    }

    let isMounted = true;
    setLoadingProfile(true);
    setError(null);

    const fetchProfile = async () => {
      const {data, error: profileError} = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (profileError && !shouldSilence(profileError.message)) {
        console.error('[Supabase Profile] Unable to load profile', profileError.message);
        setError('Unable to load your profile. Please try again.');
      }

      const nextProfile = data ?? null;
      setProfile(nextProfile);
      setIsEditing(!nextProfile);
      setFormState({
        username: nextProfile?.username ?? '',
        fullName: nextProfile?.full_name ?? fallbackName ?? '',
        bio: nextProfile?.bio ?? '',
        avatarUrl:
          nextProfile?.avatar_url ??
          ((user.user_metadata?.avatar_url as string | undefined) ?? ''),
      });
      setLoadingProfile(false);
    };

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [fallbackName, user]);

  useEffect(() => {
    if (!user) {
      setUsageStats([]);
      return;
    }

    let isMounted = true;
    setUsageLoading(true);

    const loadUsage = async () => {
      try {
        const stats = await listUtilityUsage();
        if (isMounted) {
          setUsageStats(stats);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load utility usage.';
        if (!shouldSilence(message)) {
          console.warn('[Profile] Unable to load utility usage', message);
        }
        if (isMounted) {
          setUsageStats([]);
        }
      } finally {
        if (isMounted) {
          setUsageLoading(false);
        }
      }
    };

    void loadUsage();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const usageRankingItems = useMemo(
    () =>
      [...usageStats]
        .sort((a, b) => b.launchCount - a.launchCount)
        .map((stat) => ({
          utilityId: stat.utilityId,
          count: stat.launchCount,
          meta: formatRelative(stat.lastOpenedAt),
        })),
    [usageStats],
  );

  const totalLaunches = useMemo(
    () => usageStats.reduce((sum, stat) => sum + stat.launchCount, 0),
    [usageStats],
  );

  const handleInputChange = (field: keyof typeof formState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleCancel = () => {
    if (profile) {
      setFormState({
        username: profile.username ?? '',
        fullName: profile.full_name ?? fallbackName ?? '',
        bio: profile.bio ?? '',
        avatarUrl: profile.avatar_url ?? '',
      });
      setIsEditing(false);
    } else {
      setFormState({
        username: '',
        fullName: fallbackName ?? '',
        bio: '',
        avatarUrl: '',
      });
    }
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);

    const username = formState.username.trim();
    const fullName = formState.fullName.trim();
    const bio = formState.bio.trim();
    const avatarUrl = formState.avatarUrl.trim();

    if (!username) {
      setError('Username is required.');
      setSaving(false);
      return;
    }

    const {data: existingUsernames, error: usernameError} = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id);

    if (usernameError && !shouldSilence(usernameError.message)) {
      console.error('[Supabase Profile] Unable to validate username', usernameError.message);
      setError('Unable to validate username. Please try again.');
      setSaving(false);
      return;
    }

    if (existingUsernames && existingUsernames.length > 0) {
      setError('That username is already taken. Please choose another.');
      setSaving(false);
      return;
    }

    const {data, error: upsertError} = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username,
        full_name: fullName || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      })
      .select('id, username, full_name, avatar_url, bio, role')
      .single();

    if (upsertError) {
      console.error('[Supabase Profile] Unable to save profile', upsertError.message);
      setError('Unable to save your profile. Please try again.');
      setSaving(false);
      return;
    }

    setProfile(data);
    setIsEditing(false);
    setSuccess('Profile saved successfully.');
    setSaving(false);
  };

  const renderUnauthed = () => (
    <div className={styles.guard}>
      <p className={styles.eyebrow}>Profile</p>
      <h1 className={styles.title}>Sign in to view your profile</h1>
      <p className={styles.subtle}>
        This page is protected. Start a session to view or edit your CAD AutoScript profile.
      </p>
      <div className={styles.guardActions}>
        <a className="button button--primary" href="/">
          Return home
        </a>
        <button type="button" className="button button--secondary" onClick={openLoginModal}>
          Open sign in
        </button>
      </div>
    </div>
  );

  const displayName = useMemo(() => {
    if (isEditing) {
      return formState.fullName || formState.username || fallbackName || 'Your profile';
    }
    return (
      profile?.full_name ??
      profile?.username ??
      fallbackName ??
      'Your profile'
    );
  }, [fallbackName, formState.fullName, formState.username, isEditing, profile]);

  const displayUsername = useMemo(
    () => profile?.username ?? formState.username ?? '',
    [formState.username, profile?.username],
  );

  const avatarUrl = useMemo(() => {
    const candidate = isEditing
      ? formState.avatarUrl
      : profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined);
    return candidate && candidate.length > 0 ? candidate : null;
  }, [formState.avatarUrl, isEditing, profile?.avatar_url, user?.user_metadata?.avatar_url]);

  const avatarInitial = (displayName || 'U').charAt(0).toUpperCase();

  const roleBadge = (role?: string | null) => {
    const value = role ?? 'user';
    if (value === 'admin') {
      return <span className={clsx(styles.badge, styles.badgeAdmin)}>🛡️ Admin</span>;
    }
    if (value === 'author') {
      return <span className={clsx(styles.badge, styles.badgeAuthor)}>✍️ Author</span>;
    }
    return <span className={clsx(styles.badge, styles.badgeUser)}>👤 User</span>;
  };

  const isAdmin = profile?.role === 'admin';
  const isAuthor = profile?.role === 'author' || isAdmin;

  return (
    <Layout title="Profile" description="Manage your CAD AutoScript profile.">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <main className={styles.main}>
        <div className={styles.workspaceWrapper}>
          <button
            type="button"
            className={clsx(styles.workspaceToggle, {[styles.workspaceOpen]: isWorkspaceOpen})}
            onClick={() => setIsWorkspaceOpen((open) => !open)}
          >
            <span>{isWorkspaceOpen ? 'Close Control Center' : 'Open Workspace'}</span>
            <span className={styles.chevron}>{isWorkspaceOpen ? '⌃' : '⌄'}</span>
          </button>
          <div className={clsx(styles.workspaceCurtain, {[styles.workspaceCurtainOpen]: isWorkspaceOpen})}>
            <div className={styles.workspaceGrid}>
              {isAdmin ? (
                <a className={styles.tile} href="/admin">
                  <span className={styles.tileIcon}>🛡️</span>
                  <span className={styles.tileLabel}>Admin Dashboard</span>
                </a>
              ) : null}
              {isAuthor ? (
                <button type="button" className={styles.tile} disabled>
                  <span className={styles.tileIcon}>✍️</span>
                  <span className={styles.tileLabel}>Write New Post</span>
                </button>
              ) : (
                <button type="button" className={clsx(styles.tile, styles.tileDisabled)} disabled>
                  <span className={styles.tileIcon}>✍️</span>
                  <span className={styles.tileLabel}>Write New Post</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <section className={styles.panel}>
          {authChecked && !user ? (
            renderUnauthed()
          ) : (
            <>
              <header className={styles.header}>
                <div className={styles.identity}>
                  <div className={styles.avatar}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile avatar" className={styles.avatarImage} referrerPolicy="no-referrer" />
                    ) : (
                      <span className={styles.avatarFallback}>{avatarInitial}</span>
                    )}
                  </div>
                  <div>
                    <p className={styles.eyebrow}>Profile</p>
                    <h1 className={styles.title}>
                      {displayName} {roleBadge(profile?.role)}
                    </h1>
                    {displayUsername ? (
                      <p className={styles.subtle}>@{displayUsername}</p>
                    ) : (
                      <p className={styles.subtle}>Set a username so others can find you.</p>
                    )}
                  </div>
                </div>
                {user ? (
                  <div className={styles.headerActions}>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          form="profile-form"
                          className="button button--primary"
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save changes'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => setIsEditing(true)}
                        disabled={loadingProfile}
                      >
                        Edit profile
                      </button>
                    )}
                  </div>
                ) : null}
              </header>

              {error ? (
                <div className={clsx(styles.alert, styles.alertError)}>{error}</div>
              ) : null}
              {success ? (
                <div className={clsx(styles.alert, styles.alertSuccess)}>{success}</div>
              ) : null}

              {loadingProfile ? (
                <div className={styles.loading}>Loading your profile...</div>
              ) : isEditing ? (
                <form id="profile-form" className={styles.form} onSubmit={handleSave}>
                  <div className={styles.field}>
                    <label htmlFor="username">
                      Username <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Choose a unique handle"
                      value={formState.username}
                      onChange={handleInputChange('username')}
                      required
                    />
                    <p className={styles.hint}>Usernames must be unique.</p>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="fullName">Full name</label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="How should we address you?"
                      value={formState.fullName}
                      onChange={handleInputChange('fullName')}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="avatarUrl">Avatar URL</label>
                    <input
                      id="avatarUrl"
                      name="avatarUrl"
                      type="url"
                      placeholder="https://example.com/avatar.png"
                      value={formState.avatarUrl}
                      onChange={handleInputChange('avatarUrl')}
                    />
                    <p className={styles.hint}>Paste an image URL. We&apos;ll fetch it directly.</p>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      placeholder="Share a short description of what you build."
                      value={formState.bio}
                      onChange={handleInputChange('bio')}
                    />
                  </div>
                </form>
              ) : (
                <div className={styles.readonly}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Username</span>
                    <p className={styles.value}>{profile?.username ?? 'Not set'}</p>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Full name</span>
                    <p className={styles.value}>{profile?.full_name ?? 'Not set'}</p>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Bio</span>
                    <p className={styles.value}>
                      {profile?.bio ?? 'Add a short bio to let others know what you work on.'}
                    </p>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Avatar</span>
                    <p className={styles.value}>
                      {profile?.avatar_url ? (
                        <a href={profile.avatar_url} target="_blank" rel="noreferrer">
                          {profile.avatar_url}
                        </a>
                      ) : (
                        'Using placeholder avatar'
                      )}
                    </p>
                  </div>
                  {!profile ? (
                    <div className={styles.inlineNotice}>
                      <p>You haven&apos;t created a profile yet. Click &quot;Edit profile&quot; to get started.</p>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </section>

        {user ? (
          <section className={styles.panel}>
            <header className={styles.usageHeader}>
              <div>
                <p className={styles.eyebrow}>Activity</p>
                <h2 className={styles.usageTitle}>Your most used utilities</h2>
              </div>
              {totalLaunches > 0 ? (
                <span className={styles.usageTotal}>{totalLaunches} total launches</span>
              ) : null}
            </header>
            {usageLoading ? (
              <p className={styles.subtle}>Loading your activity…</p>
            ) : (
              <UsageRanking
                items={usageRankingItems}
                emptyLabel="Launch a utility and it will show up here, ranked by how often you use it."
              />
            )}
          </section>
        ) : null}
      </main>
    </Layout>
  );
}
