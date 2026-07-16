import React, {Suspense, lazy, useEffect, useRef, useState} from 'react';
import type {EmojiClickData} from 'emoji-picker-react';
import {supabase} from '@site/src/lib/supabaseClient';
import styles from './Comments.module.css';
import {logger} from '../../lib/logger';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

type CustomEmoji = {
  names: string[];
  id: string;
  imgUrl: string;
};

type Props = {
  onEmojiSelect: (emojiCode: string) => void;
};

export default function EmojiPickerBtn({onEmojiSelect}: Props): React.JSX.Element {
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
  const [open, setOpen] = useState(false);
  const [emojisLoaded, setEmojisLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Only fetch custom emojis when the picker is opened for the first time
  useEffect(() => {
    if (!open || emojisLoaded) return;
    let active = true;
    const load = async () => {
      const {data, error} = await supabase.from('custom_emojis').select('name, url');
      if (!active) return;
      if (error) {
        logger.error('[Comments] Unable to fetch custom emojis', error.message);
        return;
      }
      const mapped: CustomEmoji[] =
        data?.map((row) => ({
          names: [row.name],
          id: `custom-${row.name}`,
          imgUrl: row.url,
        })) ?? [];
      setCustomEmojis(mapped);
      setEmojisLoaded(true);
    };
    void load();
    return () => {
      active = false;
    };
  }, [open, emojisLoaded]);

  const handleEmoji = (emojiData: EmojiClickData) => {
    if (emojiData.isCustom) {
      const customHtml = `<img src="${emojiData.imageUrl}" alt="${emojiData.names?.[0] ?? 'emoji'}" width="24" height="24" class="custom-emoji" />`;
      onEmojiSelect(customHtml);
    } else {
      onEmojiSelect(emojiData.emoji);
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (wrapperRef.current && target && !wrapperRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [open]);

  return (
    <div className={styles.pickerWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.pickerButton}
        onClick={() => setOpen((value) => !value)}
        aria-label="Insert emoji"
      >
        😊
      </button>
      {open ? (
        <div className={styles.pickerPopover}>
          <Suspense fallback={<div style={{padding: '1rem', fontSize: '0.85rem'}}>Loading…</div>}>
            <EmojiPicker
              onEmojiClick={handleEmoji}
              lazyLoadEmojis
              previewConfig={{showPreview: false}}
              searchDisabled
              skinTonesDisabled
              customEmojis={customEmojis}
              height={320}
              width="100%"
            />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
