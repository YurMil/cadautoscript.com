import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useI18n} from '@site/src/contexts/I18nContext';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {sanitizeHtml} from '@site/src/utils/sanitizeHtml';
import {formatDateTime} from '@site/src/utils/formatDate';
import {normalizeProfile} from '@site/src/utils/normalizeProfile';
import RichCommentInput, {type RichCommentInputHandle} from './RichCommentInput';
import EmojiPickerBtn from './EmojiPickerBtn';
import styles from './Comments.module.css';

type Props = {
  slug: string;
};

type Profile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type CommentRow = {
  id: string;
  user_id: string;
  post_slug: string;
  content: string;
  created_at: string;
  profiles: Profile | null;
};

export default function Comments({slug}: Props): React.JSX.Element {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const {user} = useAuthStatus();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editorHtml, setEditorHtml] = useState('');
  const [replyContext, setReplyContext] = useState<{author: string; authorId: string; preview: string} | null>(null);
  const editorRef = useRef<RichCommentInputHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {openLoginModal} = useAuthModal();
  const {t} = useI18n();

  const hasProfileName =
    !!(profile?.username && profile.username.trim().length > 0) ||
    !!(profile?.full_name && profile.full_name.trim().length > 0);

  const authorDisplay = (value: Profile | null) =>
    value?.username?.trim() ||
    value?.full_name?.trim() ||
    t('comments.anonymous');

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {data, error: fetchError} = await supabase
      .from('comments')
      .select(
        'id, user_id, post_slug, content, created_at, profiles:profiles (full_name, username, avatar_url)',
      )
      .eq('post_slug', slug)
      .order('created_at', {ascending: true});

    if (fetchError) {
      console.error('[Supabase] Failed to fetch comments', fetchError.message);
      setError(t('comments.loadError'));
      setLoading(false);
      return;
    }

    const normalized = (data ?? []).map((comment) => ({
      ...comment,
      profiles: normalizeProfile(comment.profiles),
    }));
    setComments(normalized);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const resolveProfile = async () => {
      const {data, error: profileError} = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[Supabase] Unable to fetch profile', profileError.message);
        return;
      }
      setProfile(data ?? null);
    };
    void resolveProfile();
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      openLoginModal();
      return;
    }

    const html = editorRef.current?.getHtml?.() ?? editorHtml ?? '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = (doc.body.textContent ?? '').trim();
    const hasImage = /<img\b/i.test(html);
    if (!hasImage && text.length === 0) {
      setError(t('comments.emptyDraft'));
      return;
    }

    setSubmitting(true);
    setError(null);

    const sanitized = sanitizeHtml(html);
    const {error: insertError} = await supabase.from('comments').insert({
      user_id: user.id,
      post_slug: slug,
      content: sanitized,
    });

    if (insertError) {
      console.error('[Supabase] Unable to post comment', insertError.message);
      setError(t('comments.postError'));
      setSubmitting(false);
      return;
    }

    editorRef.current?.clear();
    setEditorHtml('');
    setReplyContext(null);
    setSubmitting(false);
    void fetchComments();
  };
  const handleEmojiSelect = (emojiCode: string) => {
    if (!editorRef.current) {
      return;
    }
    if (/^<img/i.test(emojiCode)) {
      const srcMatch = emojiCode.match(/src="([^"]+)"/i);
      const altMatch = emojiCode.match(/alt="([^"]*)"/i);
      const src = srcMatch?.[1];
      const alt = altMatch?.[1];
      if (src) {
        editorRef.current.insertCustomEmoji(src, alt);
      }
    } else {
      editorRef.current.insertText(emojiCode);
    }
  };

  const avatarFallback = (value: Profile | null) =>
    (value?.username || value?.full_name || 'U').charAt(0).toUpperCase();

  const profileMap = useMemo(() => {
    const map = new Map<string, Profile | null>();
    comments.forEach((comment) => map.set(comment.user_id, comment.profiles));
    return map;
  }, [comments]);

  const authorText = (userId: string) => {
    const value = profileMap.get(userId) ?? null;
    return authorDisplay(value);
  };

  const rewriteQuotes = (html: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      doc.querySelectorAll('blockquote[data-author-id]').forEach((node) => {
        const id = node.getAttribute('data-author-id');
        if (!id) return;
        const strong = node.querySelector('strong');
        if (strong) {
          strong.textContent = authorText(id);
        }
      });
      return doc.body.innerHTML;
    } catch (err) {
      return html;
    }
  };

  const notice = useMemo(() => {
    if (!user) {
      return null;
    }
    if (!hasProfileName) {
      return t('comments.completeProfileNotice');
    }
    return null;
  }, [hasProfileName, user]);

  const extractText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const handleReply = (comment: CommentRow) => {
    const author = authorDisplay(comment.profiles);
    const preview = extractText(comment.content).slice(0, 220);
    setReplyContext({author, authorId: comment.user_id, preview});
    const snippet = preview.length === 220 ? `${preview}...` : preview;
    editorRef.current?.focus();
    editorRef.current?.insertQuote(comment.user_id, author, snippet);
  };

  const clearReply = () => {
    setReplyContext(null);
    editorRef.current?.clear();
    setEditorHtml('');
    editorRef.current?.focus();
  };

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t('comments.eyebrow')}</p>
          <h2 className={styles.title}>{t('comments.title')}</h2>
        </div>
        <span className={styles.badge}>{comments.length}</span>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}

      {loading ? (
        <p className={styles.muted}>{t('comments.loading')}</p>
      ) : comments.length === 0 ? (
        <p className={styles.muted}>{t('comments.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.comment}>
              <div className={styles.avatar}>
                {comment.profiles?.avatar_url ? (
                  <img
                    src={comment.profiles.avatar_url}
                    alt={`${authorDisplay(comment.profiles)} avatar`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{avatarFallback(comment.profiles)}</span>
                )}
              </div>
              <div className={styles.body}>
                <div className={styles.meta}>
                  <span className={styles.author}>{authorDisplay(comment.profiles)}</span>
                  <span className={styles.dot}>•</span>
                  <time dateTime={comment.created_at}>{formatDateTime(comment.created_at)}</time>
                  <div className={styles.metaActions}>
                    <button
                      type="button"
                      className={styles.actionLink}
                      onClick={() => handleReply(comment)}
                    >
                      {t('comments.reply')}
                    </button>
                  </div>
                </div>
                <p
                  className={styles.content}
                  dangerouslySetInnerHTML={{__html: sanitizeHtml(rewriteQuotes(comment.content))}}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.composer}>
        {user ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            {replyContext ? (
              <div className={styles.replyControls}>
                <span className={styles.replyBadge}>
                  {t('comments.replyingTo')} {replyContext.author}: “{replyContext.preview}”
                </span>
                <div className={styles.replyActions}>
                  <button type="button" className={styles.replyButton} onClick={clearReply}>
                    {t('comments.cancel')}
                  </button>
                </div>
              </div>
            ) : null}
            <div className={styles.inputStack}>
              <RichCommentInput
                ref={editorRef}
                placeholder={t('comments.placeholder')}
                disabled={submitting}
                onChange={(html) => setEditorHtml(html)}
              />
              <div className={styles.formFooter}>
                <EmojiPickerBtn onEmojiSelect={handleEmojiSelect} />
                <div className={styles.actions}>
                  <button
                    type="submit"
                    className="button button--primary"
                    disabled={submitting || !hasProfileName}
                  >
                    {submitting ? t('comments.sending') : t('comments.send')}
                  </button>
                </div>
              </div>
            </div>
            {notice ? (
              <p className={styles.notice}>
                {notice}{' '}
                <Link to="/profile" className={styles.link}>
                  {t('comments.completeProfileLink')}
                </Link>
              </p>
            ) : null}
          </form>
        ) : (
          <button type="button" className="button button--secondary" onClick={openLoginModal}>
            {t('comments.loginToComment')}
          </button>
        )}
      </div>
    </section>
  );
}
