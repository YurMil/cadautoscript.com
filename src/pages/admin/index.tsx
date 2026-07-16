import React, {useMemo, useState} from 'react';
import clsx from 'clsx';
import {useHistory} from '@docusaurus/router';
import Layout from '@theme/Layout';
import OverviewTab from '@site/src/components/AdminDashboard/OverviewTab';
import UsersTab from '@site/src/components/AdminDashboard/UsersTab';
import CommentsTab from '@site/src/components/AdminDashboard/CommentsTab';
import UsageTab from '@site/src/components/AdminDashboard/UsageTab';
import AuditTab from '@site/src/components/AdminDashboard/AuditTab';
import SettingsTab from '@site/src/components/AdminDashboard/SettingsTab';
import InviteModal from '@site/src/components/AdminDashboard/InviteModal';
import {useAdminData, type TabKey} from '@site/src/components/AdminDashboard/useAdminData';
import styles from './index.module.css';

export default function AdminPage(): React.JSX.Element {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const {
    state,
    loadStats,
    loadUsage,
    loadAudit,
    handleDeleteComment,
    handleRoleChange,
    handleDeleteUser,
    handleToggleUtilitiesAccess,
    inviteUser,
    handleAuditFilterChange,
  } = useAdminData(activeTab, history);

  const displayName = useMemo(
    () => state.profile?.full_name || state.profile?.username || state.sessionUser?.email || 'Admin',
    [state.profile?.full_name, state.profile?.username, state.sessionUser?.email],
  );

  const handleInviteUser = async () => {
    const ok = await inviteUser(inviteEmail);
    if (ok) {
      setInviteEmail('');
      setInviteOpen(false);
    }
  };

  if (state.loadingAuth) {
    return (
      <Layout title="Admin">
        <main className={styles.main}>
          <p className={styles.muted}>Checking access...</p>
        </main>
      </Layout>
    );
  }

  // In case redirect failed for any reason.
  if (state.profile?.role !== 'admin') {
    return null;
  }

  return (
    <Layout title="Admin" description="Moderate users and comments.">
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <p className={styles.subtle}>Signed in as {displayName} (admin)</p>
            <h1 className={styles.title}>Admin Dashboard</h1>
          </div>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'comments' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'usage' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('usage')}
            >
              Usage
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'audit' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              Audit
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>
        </div>

        {state.error ? <div className={styles.alert}>{state.error}</div> : null}
        {state.toast ? <div className={clsx(styles.alert, styles.alertSuccess)}>{state.toast}</div> : null}

        {activeTab === 'overview' ? (
          <OverviewTab stats={state.stats} statsLoading={state.statsLoading} onRefresh={() => void loadStats()} />
        ) : null}

        {activeTab === 'users' ? (
          <UsersTab
            profiles={state.profiles}
            loadingUsers={state.loadingUsers}
            roleUpdating={state.roleUpdating}
            actionState={state.actionState}
            onRoleChange={handleRoleChange}
            onDeleteUser={handleDeleteUser}
            onOpenInvite={() => setInviteOpen(true)}
          />
        ) : null}

        {activeTab === 'comments' ? (
          <CommentsTab
            comments={state.comments}
            loadingComments={state.loadingComments}
            actionState={state.actionState}
            onDeleteComment={handleDeleteComment}
          />
        ) : null}

        {activeTab === 'usage' ? (
          <UsageTab
            globalUsage={state.globalUsage}
            perUserUsage={state.perUserUsage}
            usageLoading={state.usageLoading}
            usageLoaded={state.usageLoaded}
            onRefresh={() => void loadUsage()}
          />
        ) : null}

        {activeTab === 'audit' ? (
          <AuditTab
            auditEntries={state.auditEntries}
            auditLoading={state.auditLoading}
            auditFilter={state.auditFilter}
            auditHasMore={state.auditHasMore}
            onFilterChange={handleAuditFilterChange}
            onRefresh={() => void loadAudit({append: false})}
            onLoadMore={() => void loadAudit({append: true})}
          />
        ) : null}

        {activeTab === 'settings' ? (
          <SettingsTab
            settingsLoading={state.settingsLoading}
            settingsSaving={state.settingsSaving}
            utilitiesPublicAccess={state.utilitiesPublicAccess}
            onToggle={handleToggleUtilitiesAccess}
          />
        ) : null}

        <InviteModal
          open={inviteOpen}
          email={inviteEmail}
          actionState={state.actionState}
          onEmailChange={setInviteEmail}
          onClose={() => setInviteOpen(false)}
          onSubmit={handleInviteUser}
        />
      </main>
    </Layout>
  );
}
