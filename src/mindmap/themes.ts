import themeList from 'simple-mind-map-plugin-themes/themeList'

export type ThemeOption = {
  value: string
  label: string
  dark?: boolean
}

export const THEMES: ThemeOption[] = [
  { value: 'default', label: '默认主题', dark: false },
  ...themeList.map((item) => ({
    value: item.value,
    label: item.name,
    dark: item.dark,
  })),
]
