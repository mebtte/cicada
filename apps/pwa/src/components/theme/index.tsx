import {
  createContext,
  CSSProperties,
  ReactNode,
  useContext,
} from 'react';

// ─── 主题类型 ──────────────────────────────────────────────────────────────────

export interface Theme {
  /** 主色调，支持任意 CSS 颜色值 */
  colorPrimary: string;
}

// ─── 默认主题 ──────────────────────────────────────────────────────────────────

export const DEFAULT_THEME: Theme = {
  colorPrimary: 'rgb(44 182 125)',
};

// ─── CSS 变量映射 ──────────────────────────────────────────────────────────────
//
// 组件内部只引用这些变量，不直接使用 theme 对象。
// --cn-color-primary-shadow 通过 color-mix() 自动推导，无需额外配置。

export const CSS_VAR = {
  colorPrimary:       '--cicada-color-primary',
  colorPrimaryShadow: '--cicada-color-primary-shadow',
} as const;

function buildCSSVars(theme: Theme): CSSProperties {
  return {
    [CSS_VAR.colorPrimary]: theme.colorPrimary,
    // 主色混入 30% 黑色 → 按钮底部阴影 / 描边
    [CSS_VAR.colorPrimaryShadow]: `color-mix(in srgb, ${theme.colorPrimary} 70%, #000)`,
  } as CSSProperties;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<Theme>(DEFAULT_THEME);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

// ─── ThemeProvider ────────────────────────────────────────────────────────────

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={DEFAULT_THEME}>
      {/*
       * display:contents → 不产生任何盒模型影响，
       * 仅作为 CSS 变量的作用域容器
       */}
      <div style={{ display: 'contents', ...buildCSSVars(DEFAULT_THEME) }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
