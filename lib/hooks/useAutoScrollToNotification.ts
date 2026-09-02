'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom hook that smoothly scrolls the window to the top (or top of page) when a notification message
 * transitions from empty/null/falsy to a real truthy value (or changes to a new non-empty message),
 * provided the user is currently scrolled down past topThreshold.
 *
 * @param message The message string, object, or boolean indicator to watch
 * @param options Optional configuration object (topThreshold in px)
 */
export function useAutoScrollToNotification(
  message: string | object | boolean | null | undefined,
  options?: { topThreshold?: number }
) {
  const previousMessageRef = useRef(message);

  useEffect(() => {
    const prev = previousMessageRef.current;
    previousMessageRef.current = message;

    // Check if a new message appeared when there was none before
    const hasNewMessage = Boolean(message) && !prev;

    // Check if the message string/object changed to a different non-empty message
    const isDifferentMessage =
      Boolean(message) &&
      Boolean(prev) &&
      (typeof message === 'string'
        ? message !== prev
        : JSON.stringify(message) !== JSON.stringify(prev));

    if (hasNewMessage || isDifferentMessage) {
      const threshold = options?.topThreshold ?? 100;
      if (typeof window !== 'undefined' && window.scrollY > threshold) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }
  }, [message, options?.topThreshold]);
}
