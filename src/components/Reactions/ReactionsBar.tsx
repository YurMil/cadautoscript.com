import React, {useEffect, useMemo, useRef, useState} from 'react';
import clsx from 'clsx';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {useI18n} from '@site/src/contexts/I18nContext';
import styles from './ReactionsBar.module.css';
import {logger} from '../../lib/logger';

const EMOJIS = ['👍', '🚀', '🎉', '❤️'] as const;

type ReactionEmoji = (typeof EMOJIS)[number];

type ReactionCounts = Record<ReactionEmoji, number>;

type ReactionRow = {
  emoji: string;
  user_id: string;
};

type Props = {
  slug: string;
};

const createInitialCounts = (): ReactionCounts =>
  EMOJIS.reduce(
    (acc, emoji) => {
      acc[emoji] = 0;
      return acc;
    },
    {} as ReactionCounts,
  );

const isReactionEmoji = (value: string): value is ReactionEmoji =>
  (EMOJIS as readonly string[]).includes(value);

export default function ReactionsBar({slug}: Props) {
  const {openLoginModal} = useAuthModal();
  const {t} = useI18n();
  const [counts, setCounts] = useState<ReactionCounts>(createInitialCounts);
  const [userReaction, setUserReaction] = useState<ReactionEmoji | null>(null);
  const [pendingEmoji, setPendingEmoji] = useState<ReactionEmoji | null>(null);
  const {user} = useAuthStatus();
  const userId = user?.id ?? null;
  // Bumped after every update so the bar settles on what is actually stored.
  const [reloadKey, setReloadKey] = useState(0);
  // Counts reaction updates started on this page. A load that began before the
  // latest update would overwrite its optimistic state with older data, so its
  // result is dropped; that update reloads again when it settles.
  const mutationSeq = useRef(0);

  useEffect(() => {
    let isMounted = true;
    async function loadReactions() {
      const startedAt = mutationSeq.current;
      const {data, error} = await supabase
        .from('reactions')
        .select('emoji,user_id')
        .eq('slug', slug);

      if (!isMounted || mutationSeq.current !== startedAt) {
        return;
      }

      if (error) {
        logger.error('Unable to fetch reactions', error);
        return;
      }

      const nextCounts = createInitialCounts();
      let nextUserReaction: ReactionEmoji | null = null;

      (data ?? []).forEach((row: ReactionRow) => {
        if (isReactionEmoji(row.emoji)) {
          nextCounts[row.emoji] += 1;
          if (row.user_id === userId) {
            nextUserReaction = row.emoji;
          }
        }
      });

      setCounts(nextCounts);
      setUserReaction(nextUserReaction);
    }

    loadReactions();
    return () => {
      isMounted = false;
    };
  }, [slug, userId, reloadKey]);

  const totalReactions = useMemo(
    () => Object.values(counts).reduce((total, value) => total + value, 0),
    [counts],
  );

  const handleReactionClick = async (emoji: ReactionEmoji) => {
    if (!userId) {
      openLoginModal();
      return;
    }

    if (pendingEmoji) {
      return;
    }

    const previousCounts = {...counts};
    const previousReaction = userReaction;
    const removing = previousReaction === emoji;

    mutationSeq.current += 1;
    setPendingEmoji(emoji);
    setCounts((current) => {
      const next = {...current};
      if (previousReaction) {
        next[previousReaction] = Math.max(0, next[previousReaction] - 1);
      }
      if (!removing) {
        next[emoji] = (next[emoji] ?? 0) + 1;
      }
      return next;
    });
    setUserReaction(removing ? null : emoji);

    try {
      const {error: deleteError} = await supabase
        .from('reactions')
        .delete()
        .match({slug, user_id: userId});
      if (deleteError) {
        throw deleteError;
      }
      if (!removing) {
        const {error: insertError} = await supabase
          .from('reactions')
          .insert({slug, emoji, user_id: userId});
        if (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      logger.error('Unable to update reaction', error);
      // Changing a reaction is a delete followed by an insert. If the insert
      // failed the old reaction is already gone, so the snapshot alone may show
      // a reaction the database no longer has; the reload below corrects it.
      setCounts(previousCounts);
      setUserReaction(previousReaction);
    } finally {
      setPendingEmoji(null);
      setReloadKey((key) => key + 1);
    }
  };

  return (
    <div className={styles.bar} aria-label="Emoji reactions">
      <span className={styles.label}>
        {t('reactions.title')}{totalReactions ? ` (${totalReactions})` : ''}
      </span>
      {EMOJIS.map((emoji) => {
        const isActive = userReaction === emoji;
        return (
          <button
            key={emoji}
            type="button"
            className={clsx(styles.reactionButton, {
              [styles.active]: isActive,
            })}
            onClick={() => handleReactionClick(emoji)}
            disabled={Boolean(pendingEmoji) && pendingEmoji !== emoji}
            aria-pressed={isActive}
          >
            <span className={styles.emoji}>{emoji}</span>
            <span className={styles.count}>{counts[emoji]}</span>
          </button>
        );
      })}
    </div>
  );
}
