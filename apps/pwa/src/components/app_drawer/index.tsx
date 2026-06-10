import { CSSProperties, ReactNode } from 'react';
import {
  Drawer,
  DrawerContent,
  type DrawerContentProps,
  type DrawerSide,
} from '@/components/drawer';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';

export type AppDrawerWidth = 'compact' | 'medium' | 'wide' | number | string;

const WIDTH_PRESET_STYLE: Record<'compact' | 'medium' | 'wide', CSSProperties> = {
  compact: {
    width: 300,
    maxWidth: 'calc(100vw - 48px)',
  },
  medium: {
    width: 'min(82%, 360px)',
  },
  wide: {
    width: 'min(85%, 400px)',
  },
};

function getWidthStyle(width: AppDrawerWidth | undefined): CSSProperties {
  if (width === undefined) {
    return {};
  }

  if (width === 'compact' || width === 'medium' || width === 'wide') {
    return WIDTH_PRESET_STYLE[width];
  }

  return { width };
}

export interface AppDrawerProps
  extends Omit<DrawerContentProps, 'children' | 'side' | 'style'> {
  children: ReactNode;
  includeTitlebarInset?: boolean;
  onClose: () => void;
  open: boolean;
  side?: DrawerSide;
  style?: CSSProperties;
  width?: AppDrawerWidth;
}

function AppDrawer({
  children,
  includeTitlebarInset = true,
  onClose,
  open,
  side = 'right',
  style,
  width,
  ...contentProps
}: AppDrawerProps) {
  const { top: titlebarTop } = useTitlebarOverlayInsets();
  const contentStyle: CSSProperties = {
    ...getWidthStyle(width),
    ...(includeTitlebarInset ? { paddingTop: titlebarTop } : null),
    ...style,
  };

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DrawerContent side={side} style={contentStyle} {...contentProps}>
        {children}
      </DrawerContent>
    </Drawer>
  );
}

export default AppDrawer;
