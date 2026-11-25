export const LAYOUTS = [
  { value: 'mindMap', label: '思维导图' },
  { value: 'logicalStructure', label: '逻辑结构图' },
  { value: 'logicalStructureLeft', label: '向左逻辑结构' },
  { value: 'organizationStructure', label: '组织结构图' },
  { value: 'catalogOrganization', label: '目录组织图' },
  { value: 'timeline', label: '时间轴' },
  { value: 'timeline2', label: '交替时间轴' },
  { value: 'verticalTimeline', label: '竖向时间轴' },
  { value: 'fishbone', label: '鱼骨图' },
  { value: 'verticalTimeline2', label: '竖向时间轴 2' },
  { value: 'verticalTimeline3', label: '竖向时间轴 3' },
  { value: 'fishbone2', label: '鱼骨图 2' },
] as const

export type LayoutValue = (typeof LAYOUTS)[number]['value']
