import type { CSSProperties } from 'react'
import themeList from 'simple-mind-map-plugin-themes/themeList'

export type ThemeOption = {
  value: string
  label: string
  colors: { background: string; line: string; root: string; branch: string }
  previewBackground?: CSSProperties
  dark?: boolean
}

export const THEMES: ThemeOption[] = [
  { value: 'default', label: '默认主题', dark: false, colors: { background: '#fafafa', line: '#549688', root: '#549688', branch: '#fff' } },
  ...themeList.map((item) => ({
    value: item.value,
    label: item.name,
    dark: item.dark,
    previewBackground: item.theme?.backgroundImage && item.theme.backgroundImage !== 'none' ? {
      backgroundImage: 'url("' + item.theme.backgroundImage + '")',
      backgroundRepeat: item.theme.backgroundRepeat ?? 'no-repeat',
      backgroundPosition: item.theme.backgroundPosition ?? 'center',
      backgroundSize: item.theme.backgroundSize ?? 'cover',
    } : undefined,
    colors: {
      background: item.theme?.backgroundColor || '#fafafa',
      line: item.theme?.lineColor || '#549688',
      root: item.theme?.root?.fillColor || '#549688',
      branch: item.theme?.second?.fillColor || '#fff',
    },
  })),
]

const backgroundKeys = new Set(['backgroundColor', 'backgroundImage', 'backgroundRepeat', 'backgroundPosition', 'backgroundSize'])

export function withoutCustomBackground(config: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(config).filter(([key]) => !backgroundKeys.has(key)))
}
