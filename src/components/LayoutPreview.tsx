import { LAYOUTS } from '../mindmap/layouts'

type Point = [number, number]
type Branch = [number, Point]
function diagram(id: string): Point[] {
  if (id.startsWith('verticalTimeline')) {
    const x = id.endsWith('2') ? 76 : 24
    return [[50,8],[50,24],[x,24],[50,40],[id.endsWith('3') ? 76 : x,40]]
  }
  if (id.startsWith('timeline')) return [[10,26],[37,26],[37,10],[68,26],[68,id.endsWith('2') ? 42 : 10]]
  if (id.startsWith('fishbone')) return [[12,32],[40,32],[27,13],[70,32],[58,id.endsWith('2') ? 45 : 13]]
  if (id === 'organizationStructure') return [[50,9],[24,27],[24,43],[74,27],[74,43]]
  if (id === 'catalogOrganization') return [[28,9],[43,25],[61,25],[43,41],[61,41]]
  if (id === 'mindMap') return [[50,26],[22,15],[8,8],[77,35],[92,43]]
  const flip = id === 'logicalStructureLeft'
  return [[18,26],[49,14],[79,8],[49,38],[79,44]].map(([x,y]) => [flip ? 100-x : x,y])
}

export function LayoutPreview({ id }: { id: typeof LAYOUTS[number]['value'] }) {
  const points = diagram(id)
  const parents = /timeline|fishbone/i.test(id) ? [0,1,1,3] : [0,1,0,3]
  const branches: Branch[] = points.slice(1).map((point,i) => [parents[i]!,point])
  return <svg viewBox="0 0 100 52" width="100%" height="46" aria-hidden="true">
    {branches.map(([parent,[x,y]],i) => {
      const [px,py] = points[parent]!
      const d = /fishbone/i.test(id) ? `M${px} ${py} L${x} ${y}` : `M${px} ${py} H${(px+x)/2} V${y} H${x}`
      return <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="1.4" />
    })}
    {points.map(([x,y],i) => <rect key={i} x={x-6} y={y-3} width={12} height={6} rx={1.5}
      stroke="currentColor" fill={i ? 'var(--bg-elevated)' : 'currentColor'} />)}
  </svg>
}
