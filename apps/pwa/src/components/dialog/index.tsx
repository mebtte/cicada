/**
 * Dialog — Radix UI foundation, Cicada design system styling.
 *
 * API (shadcn/ui style):
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>Title</DialogTitle>
 *         <DialogDescription>Subtitle or description.</DialogDescription>
 *       </DialogHeader>
 *       …content…
 *       <DialogFooter>
 *         <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
 *         <Button variant="primary" onClick={onConfirm}>Confirm</Button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 *
 * Responsive:
 *   < 640 px  →  bottom sheet (slides up from bottom, rounded top corners)
 *   ≥ 640 px  →  centered modal (scale + fade)
 */

import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementRef,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import styled, { keyframes } from 'styled-components';
import { CSSVariable } from '@/global_style';
import { useTheme, CSS_VAR } from '../theme';
import { t } from '@/i18n';
import {
  DialogTitleRegistryContext,
  useComposedRefs,
  useDialogContentA11y,
  useDialogTitleRegistry,
  useRegisterDialogTitle,
  visuallyHiddenStyle,
} from '../dialog_a11y';

// ─── Tokens ───────────────────────────────────────────────────────────────────

const FONT   = `'Nunito', 'Varela Round', system-ui, sans-serif`;
const MOBILE = 640; // px — breakpoint between sheet and modal
const ROOT_Z_INDEX = 9200;

// ─── Animations ───────────────────────────────────────────────────────────────

const overlayIn  = keyframes`from{opacity:0}to{opacity:1}`;
const overlayOut = keyframes`from{opacity:1}to{opacity:0}`;

const sheetIn = keyframes`
  from { opacity: 0.6; transform: translateY(100%); }
  to   { opacity: 1;   transform: translateY(0);    }
`;
const sheetOut = keyframes`
  from { opacity: 1; transform: translateY(0);    }
  to   { opacity: 0; transform: translateY(100%); }
`;

const modalIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1);    }
`;
const modalOut = keyframes`
  from { opacity: 1; transform: translate(-50%, -50%) scale(1);    }
  to   { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
`;

function readVisualViewportStyle(): CSSProperties {
  if (typeof window === 'undefined') {
    return {
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
    };
  }

  const viewport = window.visualViewport;

  if (!viewport) {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  return {
    top: `${viewport.offsetTop}px`,
    left: `${viewport.offsetLeft}px`,
    width: `${viewport.width}px`,
    height: `${viewport.height}px`,
  };
}

function useVisualViewportStyle() {
  const [viewportStyle, setViewportStyle] = useState<CSSProperties>(
    readVisualViewportStyle,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() =>
        setViewportStyle(readVisualViewportStyle()),
      );
    };

    update();

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      window.cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return viewportStyle;
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

const ViewportFrame = styled.div`
  position: fixed;
  z-index: ${ROOT_Z_INDEX};
  pointer-events: none;
  overflow: hidden;
`;

const Overlay = styled(RadixDialog.Overlay)`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  pointer-events: auto;

  &[data-state='open'] {
    animation: ${overlayIn} 200ms ease;
  }

  &[data-state='closed'] {
    pointer-events: none;
    animation: ${overlayOut} 180ms ease forwards;
  }
`;

// ─── Panel ────────────────────────────────────────────────────────────────────

const Panel = styled.div`
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  outline: none;
  pointer-events: auto;

  /* ── Mobile: bottom sheet ─────────────────────────────── */
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 92%;
  border-radius: 20px 20px 0 0;
  border: 2px solid rgb(220 220 220);
  border-bottom: none;
  box-shadow: 0 -5px 0 ${CSSVariable.COLOR_CONTROL_NEUTRAL};

  &[data-state='open'] {
    animation: ${sheetIn} 340ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  &[data-state='closed'] {
    pointer-events: none;
    animation: ${sheetOut} 220ms ease-in forwards;
  }

  /* ── Desktop: centered modal ──────────────────────────── */
  @media (min-width: ${MOBILE}px) {
    left: 50%;
    top: 50%;
    right: auto;
    bottom: auto;
    transform: translate(-50%, -50%);
    width: min(480px, calc(100% - 48px));
    max-height: calc(100% - 48px);
    border-radius: 20px;
    border: 2px solid rgb(220 220 220);
    box-shadow: 0 8px 0 ${CSSVariable.COLOR_CONTROL_NEUTRAL};

    &[data-state='open'] {
      animation: ${modalIn} 210ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    &[data-state='closed'] {
      pointer-events: none;
      animation: ${modalOut} 160ms ease-in forwards;
    }
  }
`;

// ─── Drag handle (mobile only) ────────────────────────────────────────────────

const Handle = styled.div`
  flex-shrink: 0;
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgb(215 215 215);
  margin: 12px auto 0;

  @media (min-width: ${MOBILE}px) {
    display: none;
  }
`;

// ─── Close button ─────────────────────────────────────────────────────────────

const CloseButton = styled(RadixDialog.Close)`
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${CSSVariable.COLOR_CONTROL_NEUTRAL};
  cursor: pointer;
  transition: color 120ms, background 120ms;

  &:hover { color: rgb(60 60 60); background: rgb(240 240 240); }
  &:focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }
`;

// ─── Scroll area ──────────────────────────────────────────────────────────────
// Wraps all children so the panel header (handle + close) stays fixed
// while inner content can scroll freely.

const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;

  /* thin custom scrollbar */
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgb(210 210 210); border-radius: 4px; }
`;

// ─── DialogContent ────────────────────────────────────────────────────────────

export interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  /** Show the × close button. Default true. */
  showClose?: boolean;
  /** Screen reader title used when no DialogTitle is rendered. */
  accessibleTitle?: ReactNode;
}

export const DialogContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  DialogContentProps
>(({
  children,
  showClose = true,
  style,
  accessibleTitle,
  forceMount,
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  const theme = useTheme();
  const viewportStyle = useVisualViewportStyle();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const composedPanelRef = useComposedRefs(ref, panelRef);
  const { title: registeredTitle, registerTitle } = useDialogTitleRegistry();
  useDialogContentA11y(panelRef, ariaDescribedBy);
  const themeVars = {
    [CSS_VAR.colorPrimary]: theme.colorPrimary,
    [CSS_VAR.colorPrimaryShadow]: `color-mix(in srgb, ${theme.colorPrimary} 70%, #000)`,
  } as CSSProperties;
  const fallbackTitle = accessibleTitle ?? registeredTitle ?? ariaLabel ?? t('dialog');

  return (
    <RadixDialog.Portal forceMount={forceMount}>
      <ViewportFrame style={viewportStyle}>
        <Overlay forceMount={forceMount} />
        <RadixDialog.Content
          ref={composedPanelRef}
          aria-describedby={ariaDescribedBy}
          aria-label={ariaLabel}
          forceMount={forceMount}
          {...props}
          asChild
        >
          <Panel style={{ ...themeVars, ...style }}>
            <DialogTitleRegistryContext.Provider value={registerTitle}>
              {/* Radix validates Dialog.Title by id, so keep one mounted from first render. */}
              <RadixDialog.Title asChild>
                <h2 style={visuallyHiddenStyle}>
                  {fallbackTitle}
                </h2>
              </RadixDialog.Title>
              <Handle aria-hidden />
              {showClose && (
                <CloseButton aria-label={t('close')}>
                  <svg
                    width={14} height={14} viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth={2.5} strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </CloseButton>
              )}
              <ScrollArea>{children}</ScrollArea>
            </DialogTitleRegistryContext.Provider>
          </Panel>
        </RadixDialog.Content>
      </ViewportFrame>
    </RadixDialog.Portal>
  );
});
DialogContent.displayName = 'DialogContent';

// ─── DialogHeader ─────────────────────────────────────────────────────────────

export const DialogHeader = styled.div<HTMLAttributes<HTMLDivElement>>`
  padding: 20px 50px 0 24px; /* right padding leaves room for the × button */
  flex-shrink: 0;
`;

// ─── DialogTitle ──────────────────────────────────────────────────────────────

const DialogTitleText = styled.h2`
  margin: 0;
  font-family: ${FONT};
  font-size: 18px;
  font-weight: 800;
  text-transform: capitalize;
  letter-spacing: 0.2px;
  color: rgb(50 50 50);
  line-height: 1.2;
`;

export const DialogTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<'h2'>
>(({ children, ...props }, ref) => {
  useRegisterDialogTitle(children);

  return (
    <DialogTitleText ref={ref} {...props} data-cicada-dialog-title="">
      {children}
    </DialogTitleText>
  );
});
DialogTitle.displayName = 'DialogTitle';

// ─── DialogDescription ───────────────────────────────────────────────────────

const DialogDescriptionText = styled.p`
  margin: 6px 0 0;
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1px;
  color: rgb(140 140 140);
  line-height: 1.55;

  &::first-letter {
    text-transform: uppercase;
  }
`;

export const DialogDescription = forwardRef<
  ElementRef<typeof RadixDialog.Description>,
  ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(({ children, ...props }, ref) => (
  <RadixDialog.Description
    ref={ref}
    {...props}
    data-cicada-dialog-description=""
    asChild
  >
    <DialogDescriptionText>{children}</DialogDescriptionText>
  </RadixDialog.Description>
));
DialogDescription.displayName = 'DialogDescription';

// ─── DialogBody ───────────────────────────────────────────────────────────────
// Optional wrapper for the main content area below DialogHeader.

export const DialogBody = styled.div<
  HTMLAttributes<HTMLDivElement> & { style?: CSSProperties }
>`
  padding: 20px 24px 0;
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 600;
  color: rgb(100 100 100);
  line-height: 1.55;
  letter-spacing: 0.1px;

  &::first-letter {
    text-transform: uppercase;
  }
`;

// ─── DialogFooter ─────────────────────────────────────────────────────────────
// Mobile: buttons stack full-width by default. `$inline` keeps compact dialogs
// on one row.
// Desktop: buttons inline, right-aligned

export const DialogFooter = styled.div<
  HTMLAttributes<HTMLDivElement> & { $inline?: boolean }
>`
  display: flex;
  flex-direction: ${({ $inline }) => ($inline ? 'row' : 'column')};
  gap: ${({ $inline }) => ($inline ? '10px' : '8px')};
  padding: 20px 24px;
  padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
  flex-shrink: 0;

  & > * {
    width: ${({ $inline }) => ($inline ? 'auto' : '100%')};
    flex: ${({ $inline }) => ($inline ? '1 1 0' : 'initial')};
    min-width: 0;
  }

  @media (min-width: ${MOBILE}px) {
    flex-direction: row;
    justify-content: flex-end;
    gap: 10px;
    padding-bottom: 20px;

    & > * {
      width: auto;
      flex: initial;
    }
  }
`;

// ─── Re-exports ───────────────────────────────────────────────────────────────

export const Dialog        = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose   = RadixDialog.Close;
export type  DialogProps   = ComponentPropsWithoutRef<typeof RadixDialog.Root>;
