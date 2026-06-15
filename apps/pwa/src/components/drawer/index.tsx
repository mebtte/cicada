/**
 * Drawer — side panel with the same visual language as Dialog.
 *
 * API (shadcn/ui style):
 *   <Drawer open={open} onOpenChange={setOpen}>
 *     <DrawerTrigger asChild><Button>Open</Button></DrawerTrigger>
 *     <DrawerContent side="right">
 *       <DrawerHeader>
 *         <DrawerTitle>Settings</DrawerTitle>
 *         <DrawerDescription>Manage your preferences.</DrawerDescription>
 *       </DrawerHeader>
 *       <DrawerBody>…content…</DrawerBody>
 *       <DrawerFooter>
 *         <DrawerClose asChild><Button variant="secondary">Cancel</Button></DrawerClose>
 *         <Button onClick={onSave}>Save</Button>
 *       </DrawerFooter>
 *     </DrawerContent>
 *   </Drawer>
 *
 * Sides:
 *   'right'  — slides in from the right (default)
 *   'left'   — slides in from the left
 *   'bottom' — slides up from the bottom (full-width sheet)
 */

import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementRef,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useRef,
} from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import styled, { css, keyframes } from 'styled-components';
import { useTheme, CSS_VAR } from '../theme';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import {
  DialogTitleRegistryContext,
  useComposedRefs,
  useDialogContentA11y,
  useDialogTitleRegistry,
  useRegisterDialogTitle,
  visuallyHiddenStyle,
} from '../dialog_a11y';
import { Close } from '@/components/icon';

// ─── Tokens ───────────────────────────────────────────────────────────────────

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawerSide = 'left' | 'right' | 'bottom';

// ─── Animations ───────────────────────────────────────────────────────────────

const overlayIn  = keyframes`from{opacity:0}to{opacity:1}`;
const overlayOut = keyframes`from{opacity:1}to{opacity:0}`;

const slideInRight  = keyframes`from{transform:translateX(100%)}to{transform:translateX(0)}`;
const slideOutRight = keyframes`from{transform:translateX(0)}to{transform:translateX(100%)}`;

const slideInLeft   = keyframes`from{transform:translateX(-100%)}to{transform:translateX(0)}`;
const slideOutLeft  = keyframes`from{transform:translateX(0)}to{transform:translateX(-100%)}`;

const slideInBottom  = keyframes`from{transform:translateY(100%)}to{transform:translateY(0)}`;
const slideOutBottom = keyframes`from{transform:translateY(0)}to{transform:translateY(100%)}`;

// ─── Overlay ──────────────────────────────────────────────────────────────────

const Overlay = styled(RadixDialog.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  -webkit-app-region: no-drag;

  &[data-state='open']   { animation: ${overlayIn}  200ms ease; }
  &[data-state='closed'] { animation: ${overlayOut} 180ms ease; }
`;

// ─── Panel ────────────────────────────────────────────────────────────────────
//
// Vertical inset only — drawers stay glued to their slide-in edge horizontally
// but reveal page space on top and bottom, so the downward hard shadow can land
// in the bottom gap and read as "raised toward viewer" (mirrors Button).

const INSET = '12px';
const SAFE_TOP    = `max(${INSET}, env(safe-area-inset-top, ${INSET}))`;
const SAFE_BOTTOM = `max(${INSET}, env(safe-area-inset-bottom, ${INSET}))`;

const SIDE_MAP: Record<DrawerSide, ReturnType<typeof css>> = {
  right: css`
    top: ${SAFE_TOP};
    right: 0;
    bottom: ${SAFE_BOTTOM};
    width: min(360px, calc(100vw - 20px));
    border-radius: 20px 0 0 20px;
    border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
    border-right: none;
    box-shadow: 0 5px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};

    &[data-state='open']   { animation: ${slideInRight}  340ms cubic-bezier(0.16, 1, 0.3, 1); }
    &[data-state='closed'] { animation: ${slideOutRight} 220ms ease-in; }
  `,
  left: css`
    top: ${SAFE_TOP};
    left: 0;
    bottom: ${SAFE_BOTTOM};
    width: min(360px, calc(100vw - 20px));
    border-radius: 0 20px 20px 0;
    border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
    border-left: none;
    box-shadow: 0 5px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};

    &[data-state='open']   { animation: ${slideInLeft}  340ms cubic-bezier(0.16, 1, 0.3, 1); }
    &[data-state='closed'] { animation: ${slideOutLeft} 220ms ease-in; }
  `,
  bottom: css`
    left: 0;
    right: 0;
    bottom: ${SAFE_BOTTOM};
    max-height: calc(92dvh - 24px);
    border-radius: 20px;
    border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
    box-shadow: 0 5px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};

    &[data-state='open']   { animation: ${slideInBottom}  340ms cubic-bezier(0.16, 1, 0.3, 1); }
    &[data-state='closed'] { animation: ${slideOutBottom} 220ms ease-in; }
  `,
};

const Panel = styled.div<{ $side: DrawerSide }>`
  position: fixed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  outline: none;
  -webkit-app-region: no-drag;

  ${({ $side }) => SIDE_MAP[$side]}
`;

// ─── Close button ─────────────────────────────────────────────────────────────

const CloseButton = styled(RadixDialog.Close)`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 3px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  color: rgb(88 88 88);
  cursor: pointer;
  flex-shrink: 0;
  font-size: 20px;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms;

  &:hover {
    filter: brightness(1.06);
  }

  &:active {
    transform: translateY(3px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  &:focus-visible {
    outline: 3px solid ${CSSVariable.COLOR_CONTROL_NEUTRAL};
    outline-offset: 2px;
  }
`;

// ─── Scroll area ──────────────────────────────────────────────────────────────
// Wraps all slotted children so they can scroll while the close button stays fixed.

const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;

  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgb(210 210 210); border-radius: 4px; }
`;

// ─── DrawerContent ────────────────────────────────────────────────────────────

export interface DrawerContentProps
  extends ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  /** Which edge the drawer slides from. Default: 'right'. */
  side?: DrawerSide;
  /** Show the close button. Default: false. */
  showClose?: boolean;
  /** Screen reader title used when no DrawerTitle is rendered. */
  accessibleTitle?: ReactNode;
  /**
   * Stacking order. Pass a unique value when multiple drawers can be open
   * concurrently so the most recently opened one sits on top. The overlay
   * is placed at `zIndex` and the panel at `zIndex + 1`. Default: 9000.
   */
  zIndex?: number;
}

const DEFAULT_Z_INDEX = 9000;

export const DrawerContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  DrawerContentProps
>(({
  children,
  side = 'right',
  showClose = false,
  zIndex = DEFAULT_Z_INDEX,
  style,
  accessibleTitle,
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  const theme = useTheme();
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
    // Keep Radix's DismissableLayer stack aligned when an open drawer is raised.
    <RadixDialog.Portal key={zIndex}>
      <Overlay style={{ zIndex }} />
      <RadixDialog.Content
        ref={composedPanelRef}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        {...props}
        asChild
      >
        <Panel $side={side} style={{ ...themeVars, zIndex: zIndex + 1, ...style }}>
          <DialogTitleRegistryContext.Provider value={registerTitle}>
            {/* Radix validates Dialog.Title by id, so keep one mounted from first render. */}
            <RadixDialog.Title asChild>
              <h2 style={visuallyHiddenStyle}>
                {fallbackTitle}
              </h2>
            </RadixDialog.Title>
            {showClose && (
              <CloseButton aria-label={t('close')}>
                <Close />
              </CloseButton>
            )}
            <ScrollArea>{children}</ScrollArea>
          </DialogTitleRegistryContext.Provider>
        </Panel>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});
DrawerContent.displayName = 'DrawerContent';

// ─── DrawerHeader ─────────────────────────────────────────────────────────────
// Right padding leaves room for the × close button.

export const DrawerHeader = styled.div<HTMLAttributes<HTMLDivElement>>`
  padding: 20px 50px 0 24px;
  flex-shrink: 0;
`;

// ─── DrawerTitle ──────────────────────────────────────────────────────────────

const DrawerTitleText = styled.h2`
  margin: 0;
  font-family: ${FONT};
  font-size: 18px;
  font-weight: 800;
  text-transform: capitalize;
  letter-spacing: 0.2px;
  color: rgb(50 50 50);
  line-height: 1.2;
`;

export const DrawerTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<'h2'>
>(({ children, ...props }, ref) => {
  useRegisterDialogTitle(children);

  return (
    <DrawerTitleText ref={ref} {...props} data-cicada-dialog-title="">
      {children}
    </DrawerTitleText>
  );
});
DrawerTitle.displayName = 'DrawerTitle';

// ─── DrawerDescription ────────────────────────────────────────────────────────

const DrawerDescriptionText = styled.p`
  margin: 6px 0 0;
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1px;
  color: rgb(140 140 140);
  line-height: 1.55;
`;

export const DrawerDescription = forwardRef<
  ElementRef<typeof RadixDialog.Description>,
  ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(({ children, ...props }, ref) => (
  <RadixDialog.Description
    ref={ref}
    {...props}
    data-cicada-dialog-description=""
    asChild
  >
    <DrawerDescriptionText>{children}</DrawerDescriptionText>
  </RadixDialog.Description>
));
DrawerDescription.displayName = 'DrawerDescription';

// ─── DrawerBody ───────────────────────────────────────────────────────────────
// Main scrollable content area.

export const DrawerBody = styled.div<
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

// ─── DrawerFooter ─────────────────────────────────────────────────────────────
// Sticky bottom toolbar — use `position: sticky; bottom: 0` via style if
// needed, or let it flow naturally with the content.

export const DrawerFooter = styled.div<HTMLAttributes<HTMLDivElement>>`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
  flex-shrink: 0;
`;

// ─── Re-exports ───────────────────────────────────────────────────────────────

export const Drawer        = RadixDialog.Root;
export const DrawerTrigger = RadixDialog.Trigger;
export const DrawerClose   = RadixDialog.Close;
export type  DrawerProps   = ComponentPropsWithoutRef<typeof RadixDialog.Root>;
