import themeList from 'simple-mind-map-plugin-themes/themeList'

export type ThemeOption = {
  value: string
  label: string
  colors: { background: string; line: string; root: string; branch: string }
  dark?: boolean
}

export const THEMES: ThemeOption[] = [
  { value: 'default', label: '默认主题', dark: false, colors: { background: '#fafafa', line: '#549688', root: '#549688', branch: '#fff' } },
  ...themeList.map((item) => ({
    value: item.value,
    label: item.name,
    dark: item.dark,
    colors: {
      background: item.theme?.backgroundColor || '#fafafa',
      line: item.theme?.lineColor || '#549688',
      root: item.theme?.root?.fillColor || '#549688',
      branch: item.theme?.second?.fillColor || '#fff',
    },
  })),
]
