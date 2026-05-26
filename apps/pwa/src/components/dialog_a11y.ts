import {
  createContext,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
  type Ref,
  type RefCallback,
  type RefObject,
  useContext,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

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

type RegisteredDialogTitle = {
  id: symbol;
  title: ReactNode;
};

type DialogTitleRegistrar = (id: symbol, title: ReactNode | null) => void;

export const DialogTitleRegistryContext =
  createContext<DialogTitleRegistrar | null>(null);

export function useDialogTitleRegistry() {
  const [titles, setTitles] = useState<RegisteredDialogTitle[]>([]);

  const registerTitle = useCallback<DialogTitleRegistrar>((id, title) => {
    setTitles((current) => {
      const existingIndex = current.findIndex((item) => item.id === id);

      if (title === null) {
        if (existingIndex === -1) return current;
        return current.filter((item) => item.id !== id);
      }

      if (existingIndex !== -1) {
        const existing = current[existingIndex];
        if (existing.title === title) return current;

        const next = current.slice();
        next[existingIndex] = { id, title };
        return next;
      }

      return [...current, { id, title }];
    });
  }, []);

  return {
    title: titles.length > 0 ? titles[titles.length - 1].title : null,
    registerTitle,
  };
}

export function useRegisterDialogTitle(title: ReactNode) {
  const registerTitle = useContext(DialogTitleRegistryContext);
  const titleIdRef = useRef<symbol | null>(null);

  if (!titleIdRef.current) {
    titleIdRef.current = Symbol('dialog-title');
  }

  useLayoutEffect(() => {
    if (!registerTitle) return undefined;

    // Visible titles feed the single hidden Radix title, avoiding duplicate title ids.
    const titleId = titleIdRef.current!;
    registerTitle(titleId, title);

    return () => registerTitle(titleId, null);
  }, [registerTitle, title]);
}

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
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

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
}
