import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

type SupportedKeyboardEvent = KeyboardEvent | ReactKeyboardEvent<Element>;

const getNativeKeyboardEvent = (
  event: SupportedKeyboardEvent,
): KeyboardEvent => {
  if ('nativeEvent' in event) {
    return event.nativeEvent;
  }

  return event;
};

export const isKeyboardEventComposing = (
  event: SupportedKeyboardEvent,
): boolean => {
  const nativeEvent = getNativeKeyboardEvent(event);

  // IME confirm Enter may report keyCode 229 when isComposing is unreliable.
  return nativeEvent.isComposing || nativeEvent.keyCode === 229;
};

export const isComposingEnterKeyDown = (
  event: SupportedKeyboardEvent,
): boolean => event.key === 'Enter' && isKeyboardEventComposing(event);
