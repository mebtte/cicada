import { useRef, useEffect } from 'react';

import { IS_MAC_OS, IS_WINDOWS } from '@/constants';
import KeyboardHandlerWrapper from '@/utils/keyboard_handler_wrapper';

export default () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const listener = KeyboardHandlerWrapper((event: KeyboardEvent) => {
      if (
        event.key !== 'f' ||
        (IS_MAC_OS && !event.metaKey) ||
        (IS_WINDOWS && !event.ctrlKey)
      ) {
        return;
      }
      event.preventDefault();
      return inputRef.current?.focus();
    });
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);

  return inputRef;
};
