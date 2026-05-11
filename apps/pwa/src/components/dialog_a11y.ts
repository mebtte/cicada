import {
  type CSSProperties,
  type MutableRefObject,
  type Ref,
  type RefCallback,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useState,
} from 'react';

export const DIALOG_TITLE_ATTRIBUTE = 'data-cicada-dialog-title';
export const DIALOG_DESCRIPTION_ATTRIBUTE = 'data-cicada-dialog-description';

export const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;

  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  (ref as MutableRefObject<T | null>).current = value;
}

export function useComposedRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): RefCallback<T> {
  return useCallback((value) => {
    refs.forEach((ref) => assignRef(ref, value));
  }, refs);
}

export function useDialogContentA11y<T extends HTMLElement>(
  contentRef: RefObject<T | null>,
  describedBy: string | undefined,
) {
  const [showFallbackTitle, setShowFallbackTitle] = useState(true);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const hasTitle = Boolean(
      content.querySelector(`[${DIALOG_TITLE_ATTRIBUTE}]`),
    );
    setShowFallbackTitle((current) =>
      current === !hasTitle ? current : !hasTitle,
    );

    if (describedBy !== undefined) return;

    const description = content.querySelector<HTMLElement>(
      `[${DIALOG_DESCRIPTION_ATTRIBUTE}]`,
    );
    if (description?.id) {
      content.setAttribute('aria-describedby', description.id);
    } else {
      content.removeAttribute('aria-describedby');
    }
  });

  return showFallbackTitle;
}
