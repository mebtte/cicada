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
} from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import styled, { keyframes } from 'styled-components';
import { useTheme, CSS_VAR } from '../theme';

// ─── Tokens ───────────────────────────────────────────────────────────────────

const FONT   = `'Nunito', 'Varela Round', system-ui, sans-serif`;
const MOBILE = 640; // px — breakpoint between sheet and modal

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

// ─── Overlay ──────────────────────────────────────────────────────────────────

const Overlay = styled(RadixDialog.Overlay)`
  position: fixed;
  inset: 0;
  z-index: 8999;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);

  &[data-state='open']   { animation: ${overlayIn}  200ms ease; }
  &[data-state='closed'] { animation: ${overlayOut} 180ms ease; }
`;

// ─── Panel ────────────────────────────────────────────────────────────────────

const Panel = styled(RadixDialog.Content)`
  position: fixed;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  outline: none;

  /* ── Mobile: bottom sheet ─────────────────────────────── */
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 92dvh;
  border-radius: 20px 20px 0 0;
  border: 2px solid rgb(220 220 220);
  border-bottom: none;
  box-shadow: 0 -5px 0 rgb(185 185 185);

  &[data-state='open']   { animation: ${sheetIn}  340ms cubic-bezier(0.16, 1, 0.3, 1); }
  &[data-state='closed'] { animation: ${sheetOut} 220ms ease-in; }

  /* ── Desktop: centered modal ──────────────────────────── */
  @media (min-width: ${MOBILE}px) {
    left: 50%;
    top: 50%;
    right: auto;
    bottom: auto;
    transform: translate(-50%, -50%);
    width: min(480px, calc(100vw - 48px));
    max-height: calc(100dvh - 48px);
    border-radius: 20px;
    border: 2px solid rgb(220 220 220);
    box-shadow: 0 8px 0 rgb(185 185 185);

    &[data-state='open']   { animation: ${modalIn}  210ms cubic-bezier(0.16, 1, 0.3, 1); }
    &[data-state='closed'] { animation: ${modalOut} 160ms ease-in; }
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
  color: rgb(185 185 185);
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
}

export const DialogContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  DialogContentProps
>(({ children, showClose = true, style, ...props }, ref) => {
  const theme = useTheme();
  const themeVars = {
    [CSS_VAR.colorPrimary]: theme.colorPrimary,
    [CSS_VAR.colorPrimaryShadow]: `color-mix(in srgb, ${theme.colorPrimary} 70%, #000)`,
  } as CSSProperties;

  return (
    <RadixDialog.Portal>
      <Overlay />
      <Panel ref={ref} style={{ ...themeVars, ...style }} {...props}>
        <Handle aria-hidden />
        {showClose && (
          <CloseButton aria-label="Close">
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
      </Panel>
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

export const DialogTitle = styled(RadixDialog.Title)`
  margin: 0;
  font-family: ${FONT};
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: rgb(50 50 50);
  line-height: 1.2;
`;

// ─── DialogDescription ───────────────────────────────────────────────────────

export const DialogDescription = styled(RadixDialog.Description)`
  margin: 6px 0 0;
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1px;
  color: rgb(140 140 140);
  line-height: 1.55;
`;

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
`;

// ─── DialogFooter ─────────────────────────────────────────────────────────────
// Mobile:  buttons stack full-width (column, primary at bottom)
// Desktop: buttons inline, right-aligned

export const DialogFooter = styled.div<HTMLAttributes<HTMLDivElement>>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 24px;
  padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
  flex-shrink: 0;

  /* full-width buttons on mobile */
  & > * { width: 100%; }

  @media (min-width: ${MOBILE}px) {
    flex-direction: row;
    justify-content: flex-end;
    gap: 10px;
    padding-bottom: 20px;

    & > * { width: auto; }
  }
`;

// ─── Re-exports ───────────────────────────────────────────────────────────────

export const Dialog        = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose   = RadixDialog.Close;
export type  DialogProps   = ComponentPropsWithoutRef<typeof RadixDialog.Root>;
