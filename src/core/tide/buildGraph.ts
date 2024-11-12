import {type Predictions} from './getData'
import {Format} from './getData'
import { PAST_DAYS } from './helpers'

export function buildGraph(Pre: Predictions, date: Date, addedDays: number) {
  const {predictions} = Pre
  const Days = new Set<string>()

  const per = 40
  const _width = predictions.length * per
  const height = 400
  const gridLines = 20

  predictions.forEach(item => {
    const date = new Date(item.t)
    const formattedDate = Format.format(date)
    Days.add(formattedDate)
  })

  // Utility functions for date parsing and value normalization
  const parseDate = (dateStr: string) => new Date(dateStr).getTime()
  const minTime = Math.min(...predictions.map(p => parseDate(p.t)))
  const maxTime = Math.max(...predictions.map(p => parseDate(p.t)))

  const mapX = (t: string) => {
    console.log({ t })
    const timestamp = parseDate(t)
    const width = _width  // SVG width
    return ((timestamp - minTime) / (maxTime - minTime)) * width
  }

  const mapY = (v: number) => {
    const minValue = Math.min(...predictions.map(p => p.v))
    const maxValue = Math.max(...predictions.map(p => p.v))
    const height = 300 // SVG height
    return height - ((v - minValue) / (maxValue - minValue)) * height + 30
  }

  // Generate cubic Bezier path data
  const generateCubicBezierPath = (points: {x: number; y: number}[]) => {
    if (points.length < 2) return ''

    let path = `M ${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const next = points[i + 1]

      // Calculate control points
      const controlX1 = prev.x + (curr.x - prev.x) / 2
      const controlY1 = prev.y
      const controlX2 = curr.x - (next.x - curr.x) / 2
      const controlY2 = curr.y

      path += ` C ${controlX1},${controlY1} ${controlX2},${controlY2} ${curr.x},${curr.y}`
    }
    // Add the final segment
    const lastPoint = points[points.length - 1]
    path += ` L ${lastPoint.x},${lastPoint.y}`
    return path
  }

  // Convert predictions to SVG points
  const svgPoints = predictions.map(p => ({
    x: mapX(p.t),
    y: mapY(p.v),
    t: p.t,
  }))

  const svgPathData = generateCubicBezierPath(svgPoints)
  const uniqueDays = new Set()

  Array.from({length: addedDays + 2 + (PAST_DAYS * 2)}, (_, i) => {
    const future_date = new Date()
    future_date.setDate(date?.getDate() + (i - PAST_DAYS))
    uniqueDays.add(Format.format(future_date))
  }).join('')

  // Create an SVG element (you can inject this into your HTML page)
  const svg = `
    <svg width="${_width}px" height="${height}px" xmlns="http://www.w3.org/2000/svg">

        <g stroke="gray" stroke-width="0.5">
            ${Array.from(uniqueDays)
              .map((time_as_string, index, all) => {
                // @ts-ignore
                const x : number = mapX(time_as_string + " 00:00")
                const nextTime = all[ index + 1]
                // @ts-ignore
                const x2 : number = nextTime ? mapX(nextTime + " 00:00") : undefined
                const average = (x + x2) / 2

                return x2 ? `<text font-size="10" text-align="center" text-anchor="middle" x="${average || x}" y="${ height - 15 }">${time_as_string}</text>` : ''
              })
              .join('')}
        </g>

        <g stroke="gray" stroke-width="0.25">
            ${Array.from(uniqueDays)
              .map(time_as_string => {
                // @ts-ignore
                const x = mapX(time_as_string + " 00:00")

                return `<line x1="${x}" y1="0" y2="${height}" x2="${x}"  />`
              })
              .join('')}
        </g>
        

        <g stroke="gray" stroke-width="0.25">
        ${Array.from({length: gridLines + 1}, (_, i) => {
          const y = ((height / gridLines) * i) - 40
          return `<line x1="0" y1="${y}" x2="${_width}" y2="${y}" />`
        }).join('')}
        </g>
        <text id="inner_tooltip" x="0" y="0" visibility="hidden" text-anchor="middle" font-size="12" fill="black"></text>

      <path d="${svgPathData}" stroke="black" fill="none" stroke-width="1"/>
      <g>
      ${svgPoints
        .map(
          (point, index) =>
            `<circle cx="${point.x}" cy="${point.y}" r="5" fill="${
              (index + 2) % 4 === 0 ? 'blue' : 'red'
            }" data-tooltip="1">
            <title>${ point.t}</title>
            </circle>
            `
        )
        .join('')}
      </g>

    </svg>
  `

  return {
    svg,
    Days,
  }
}
