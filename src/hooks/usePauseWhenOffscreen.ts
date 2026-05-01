import {useEffect, useRef, useState} from 'react';

export function usePauseWhenOffscreen<T extends Element>(rootMargin = '120px') {
  const ref = useRef<T | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      {rootMargin, threshold: 0},
    );
    observer.observe(node);

    const onVisibility = () => {
      if (document.hidden) setPaused(true);
      else if (node.getBoundingClientRect().bottom > 0) setPaused(false);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [rootMargin]);

  return {ref, paused};
}
