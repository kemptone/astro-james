import type {Predictions} from './getData'
import {
  addDays,
  buildTideDays,
  clamp,
  formatAxisFeet,
  formatClock,
  formatDuration,
  formatFeet,
  formatFullDayLabel,
  formatSummaryDate,
  formatTableDate,
  formatTime,
  formatTimeZone,
  getLiveTideState,
  getPointAtTime,
  normalizePredictions,
  startOfLocalDay,
  STATION_NAME,
  STATION_SHORT_NAME,
  type LiveTideState,
  type TideDay,
  type TidePoint,
  type TideType,
} from './model'

const AXIS_WIDTH = 88
const DAY_WIDTH = 116
const CURRENT_DAY_WIDTH = 464
const GRAPH_HEIGHT = 382
const PLOT_TOP = 22
const PLOT_BOTTOM = 28
const GRID_TICK_COUNT = 7

interface TideDashboardHtml {
  forecastHtml: string
  todayTitle: string
  todaySummary: string
  liveCardHtml: string
  todayTableHtml: string
}

interface PlotPoint {
  x: number
  y: number
  point: TidePoint
}

export function buildTideDashboard(
  data: Predictions,
  now = new Date(),
  displayDayCount = 14
): TideDashboardHtml {
  const points = normalizePredictions(data)

  if (!points.length) {
    return {
      forecastHtml: buildEmptyState('No tide predictions were returned.'),
      todayTitle: `Today's tide times for ${STATION_NAME}`,
      todaySummary:
        'Tide predictions are not available right now. Try refreshing the page.',
      liveCardHtml: buildEmptyState('Live tide data is not available.'),
      todayTableHtml: buildEmptyState("Today's tide table is not available."),
    }
  }

  const days = buildTideDays(points, now, displayDayCount)
  const live = getLiveTideState(points, now)
  const today = days[0]

  return {
    forecastHtml: buildForecastChart(days, points, live),
    todayTitle: `Today's tide times for ${STATION_NAME}`,
    todaySummary: buildTodaySummary(today),
    liveCardHtml: buildLiveTideCard(live, points),
    todayTableHtml: buildTodayTable(today, now),
  }
}

function buildForecastChart(
  days: TideDay[],
  points: TidePoint[],
  live: LiveTideState
) {
  const rangeStart = startOfLocalDay(days[0].date)
  const rangeEnd = addDays(rangeStart, days.length)
  const rangeStartMs = rangeStart.getTime()
  const rangeEndMs = rangeEnd.getTime()
  const dayWidths = getDayWidths(days.length)
  const dayOffsets = getDayOffsets(dayWidths)
  const graphWidth = dayWidths.reduce((total, width) => total + width, 0)
  const boardWidth = AXIS_WIDTH + graphWidth
  const gridColumns = `${AXIS_WIDTH}px ${dayWidths
    .map(width => `${width}px`)
    .join(' ')}`
  const plotPoints = buildPlotPoints(points, rangeStart, rangeEnd)
  const heights = plotPoints.map(item => item.heightFt)
  const rawMin = Math.min(...heights)
  const rawMax = Math.max(...heights)
  const minHeight = Math.floor((rawMin - 0.6) * 2) / 2
  const maxHeight = Math.ceil((rawMax + 0.6) * 2) / 2
  const plotHeight = GRAPH_HEIGHT - PLOT_TOP - PLOT_BOTTOM
  const bottomY = PLOT_TOP + plotHeight
  const mapX = (date: Date) =>
    mapDateToX(date, rangeStart, dayOffsets, dayWidths, graphWidth)
  const mapY = (height: number) =>
    PLOT_TOP +
    ((maxHeight - height) / (maxHeight - minHeight || 1)) * plotHeight
  const svgPoints = plotPoints.map(point => ({
    x: mapX(point.time),
    y: mapY(point.heightFt),
    point,
  }))
  const tidePath = buildCatmullRomPath(svgPoints)
  const areaPath = `${tidePath} L ${svgPoints[svgPoints.length - 1].x} ${bottomY} L ${svgPoints[0].x} ${bottomY} Z`
  const ticks = Array.from({length: GRID_TICK_COUNT}, (_, index) => {
    const value =
      maxHeight - ((maxHeight - minHeight) / (GRID_TICK_COUNT - 1)) * index

    return {
      value,
      y: mapY(value),
    }
  })
  const visiblePoints = points.filter(
    point => point.timeMs >= rangeStartMs && point.timeMs < rangeEndMs
  )
  const nowMs = live.now.getTime()
  const showNow = nowMs >= rangeStartMs && nowMs < rangeEndMs
  const nowX = showNow ? mapX(live.now) : 0
  const nowY = showNow ? mapY(live.currentHeightFt) : 0

  return `
    <div class="tide-forecast-board" style="width: ${boardWidth}px; --tide-axis-width: ${AXIS_WIDTH}px; --tide-grid-columns: ${gridColumns};">
      ${buildDateHeader(days)}
      ${buildWeekdayHeader(days)}
      <div class="tide-graph-row">
        <div class="tide-y-axis" style="height: ${GRAPH_HEIGHT}px;">
          ${ticks
            .map(
              tick =>
                `<span style="top: ${tick.y}px;">${formatAxisFeet(
                  tick.value
                )}</span>`
            )
            .join('')}
        </div>
        <div class="tide-graph-canvas" style="width: ${graphWidth}px; height: ${GRAPH_HEIGHT}px;">
          <svg class="tide-graph-svg" width="${graphWidth}" height="${GRAPH_HEIGHT}" viewBox="0 0 ${graphWidth} ${GRAPH_HEIGHT}" role="img" aria-label="Multi-day tide graph">
            <defs>
              <linearGradient id="tideAreaFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#2c94d1" stop-opacity="0.78" />
                <stop offset="58%" stop-color="#88c2df" stop-opacity="0.48" />
                <stop offset="100%" stop-color="#e9f4f9" stop-opacity="0.94" />
              </linearGradient>
            </defs>
            ${buildDayBands(dayWidths, dayOffsets)}
            ${buildVerticalGrid(dayWidths, dayOffsets)}
            ${buildHorizontalGrid(ticks, graphWidth)}
            ${
              minHeight < 0 && maxHeight > 0
                ? `<line class="tide-zero-line" x1="0" y1="${mapY(
                    0
                  )}" x2="${graphWidth}" y2="${mapY(0)}" />`
                : ''
            }
            <path class="tide-area" d="${areaPath}" />
            <path class="tide-line" d="${tidePath}" />
            ${buildPointStems(visiblePoints, mapX, mapY, bottomY)}
            ${buildPointDots(visiblePoints, mapX, mapY)}
            ${
              showNow
                ? `<line class="tide-now-horizontal" x1="0" y1="${nowY}" x2="${nowX}" y2="${nowY}" />
                   <line class="tide-now-line" x1="${nowX}" y1="0" x2="${nowX}" y2="${GRAPH_HEIGHT}" />
                   <circle class="tide-now-dot" cx="${nowX}" cy="${nowY}" r="6" />
                   <text class="tide-now-label" x="${clamp(
                     nowX + 10,
                     8,
                     graphWidth - 104
                   )}" y="${clamp(nowY - 12, 18, GRAPH_HEIGHT - 16)}">Now ${formatFeet(
                     live.currentHeightFt,
                     true
                   )}</text>`
                : ''
            }
            ${buildTodayCallouts(days[0], mapX, mapY, graphWidth)}
          </svg>
        </div>
      </div>
      ${buildForecastTideRow(days, 'H', live.now)}
      ${buildForecastTideRow(days, 'L', live.now)}
    </div>
  `
}

function buildDateHeader(days: TideDay[]) {
  return `
    <div class="tide-date-row">
      <div class="tide-corner-cell" aria-label="Tide settings">${gearIcon()}</div>
      ${days
        .map(
          (day, index) =>
            `<div class="tide-date-cell${
              index === 0 ? ' is-today' : ''
            }">${index === 0 ? day.label : day.shortLabel}</div>`
        )
        .join('')}
    </div>
  `
}

function buildWeekdayHeader(days: TideDay[]) {
  return `
    <div class="tide-weekday-row">
      <div class="tide-weekday-spacer"></div>
      ${days
        .map(
          (day, index) => `
            <div class="tide-weekday-cell">
              ${
                index === 0
                  ? `<span class="tide-period-labels"><b>AM</b><b>PM</b></span>`
                  : `<span>${day.weekday}</span>`
              }
              <button type="button" class="tide-expand-button" aria-label="Open ${formatFullDayLabel(
                day.date
              )} tide detail">${expandIcon()}</button>
            </div>
          `
        )
        .join('')}
    </div>
  `
}

function buildForecastTideRow(
  days: TideDay[],
  type: TideType,
  now: Date
) {
  const isHigh = type === 'H'
  const timeZone = formatTimeZone(now)

  return `
    <div class="tide-forecast-row tide-${isHigh ? 'high' : 'low'}-row">
      <div class="tide-row-label">
        ${isHigh ? highIcon() : lowIcon()}
        <strong>${isHigh ? 'HIGH' : 'LOW'}</strong>
        <span>(${timeZone})</span>
      </div>
      ${days
        .map(day => {
          const items = isHigh ? day.highs : day.lows

          return `
            <div class="tide-row-cell">
              ${
                items.length
                  ? items
                      .map(
                        item => `
                          <div class="tide-row-event">
                            <strong>${formatTime(item.time)}</strong>
                            <span>${formatFeet(item.heightFt)}</span>
                          </div>
                        `
                      )
                      .join('')
                  : '<span class="tide-empty">-</span>'
              }
            </div>
          `
        })
        .join('')}
    </div>
  `
}

function buildTodaySummary(today: TideDay) {
  if (!today?.points.length) {
    return `The predicted tide times today on ${formatSummaryDate(
      today.date
    )} for ${STATION_SHORT_NAME} are not available yet.`
  }

  const tideCounts: Record<TideType, number> = {
    H: 0,
    L: 0,
  }
  const parts = today.points.map(point => {
    tideCounts[point.type] += 1

    return `${ordinalWord(tideCounts[point.type])} ${
      point.type === 'H' ? 'high tide' : 'low tide'
    } at ${formatTime(point.time, true)}`
  })

  return `The predicted tide times today on ${formatSummaryDate(
    today.date
  )} for ${STATION_SHORT_NAME} are: ${parts.join(', ')}.`
}

function buildLiveTideCard(live: LiveTideState, points: TidePoint[]) {
  const waterLevel = getWaterLevel(live.currentHeightFt, points)

  return `
    <article class="tide-live-card" style="--live-water-level: ${waterLevel}%;">
      <div class="tide-live-visual" aria-hidden="true">
        <div class="tide-live-water"></div>
        <div class="tide-live-bubble ${
          live.isRising ? 'is-rising' : 'is-falling'
        }">
          ${tideDirectionIcon(live.isRising)}
          <strong>${formatFeet(live.currentHeightFt, true)}</strong>
        </div>
      </div>
      <div class="tide-live-content">
        <div class="tide-live-label">Live Tide</div>
        <div class="tide-live-events">
          ${buildNextEventLine(live.nextHigh, 'H', live.now)}
          ${buildNextEventLine(live.nextLow, 'L', live.now)}
        </div>
        <div class="tide-live-rule"></div>
        <p class="tide-live-status">
          The tide is <strong>${live.isRising ? 'rising' : 'falling'}</strong>.
        </p>
        <p class="tide-live-time">Local time: <strong>${formatClock(live.now)}</strong></p>
      </div>
    </article>
  `
}

function tideDirectionIcon(isRising: boolean) {
  return `
    <svg class="tide-live-direction" viewBox="0 0 24 24" aria-hidden="true">
      ${
        isRising
          ? '<path d="M12 20V5m0 0L6 11m6-6 6 6" />'
          : '<path d="M12 4v15m0 0-6-6m6 6 6-6" />'
      }
    </svg>
  `
}

function buildNextEventLine(
  point: TidePoint | null,
  type: TideType,
  now: Date
) {
  const label = type === 'H' ? 'HIGH TIDE' : 'LOW TIDE'

  if (!point) {
    return `<p>Next <strong>${label}</strong> is not available.</p>`
  }

  return `
    <p>
      Next <strong>${label}</strong> in ${STATION_SHORT_NAME} is at
      <strong>${formatTime(point.time)}</strong> which is in
      <strong>${formatDuration(point.timeMs - now.getTime())}</strong> from now.
    </p>
  `
}

function buildTodayTable(today: TideDay, now: Date) {
  const timeZone = formatTimeZone(now)

  return `
    <article class="tide-times-card">
      <header class="tide-times-header">
        <h2>Today's tide times for ${STATION_SHORT_NAME}</h2>
        <p>${formatSummaryDate(today.date)}</p>
      </header>
      <table class="tide-times-table">
        <thead>
          <tr>
            <th>Tide</th>
            <th>Time (${timeZone})<span>& Date</span></th>
            <th>Height</th>
          </tr>
        </thead>
        <tbody>
          ${
            today.points.length
              ? today.points
                  .map(
                    point => `
                      <tr>
                        <th>${point.type === 'H' ? 'High Tide' : 'Low Tide'}</th>
                        <td>
                          <strong>${formatTime(point.time)}</strong>
                          <span>(${formatTableDate(point.time)})</span>
                        </td>
                        <td>
                          <strong>${formatFeet(point.heightFt)}</strong>
                          <span>(${(point.heightFt * 0.3048).toFixed(2)} m)</span>
                        </td>
                      </tr>
                    `
                  )
                  .join('')
              : `<tr><td colspan="3">No tide predictions are available for today.</td></tr>`
          }
        </tbody>
      </table>
      <p class="tide-datum">Tide Datum: MLLW</p>
    </article>
  `
}

function buildPlotPoints(
  points: TidePoint[],
  rangeStart: Date,
  rangeEnd: Date
) {
  const rangeStartMs = rangeStart.getTime()
  const rangeEndMs = rangeEnd.getTime()
  const visiblePoints = points.filter(
    point => point.timeMs > rangeStartMs && point.timeMs < rangeEndMs
  )

  return [
    getPointAtTime(points, rangeStart),
    ...visiblePoints,
    getPointAtTime(points, rangeEnd),
  ].sort((a, b) => a.timeMs - b.timeMs)
}

function getDayWidths(dayCount: number) {
  return Array.from({length: dayCount}, (_, index) =>
    index === 0 ? CURRENT_DAY_WIDTH : DAY_WIDTH
  )
}

function getDayOffsets(dayWidths: number[]) {
  const offsets: number[] = []
  let cursor = 0

  dayWidths.forEach(width => {
    offsets.push(cursor)
    cursor += width
  })

  return offsets
}

function mapDateToX(
  date: Date,
  rangeStart: Date,
  dayOffsets: number[],
  dayWidths: number[],
  graphWidth: number
) {
  const dayIndex = Math.floor(
    (startOfLocalDay(date).getTime() - rangeStart.getTime()) /
      (1000 * 60 * 60 * 24)
  )

  if (dayIndex < 0) {
    return 0
  }

  if (dayIndex >= dayWidths.length) {
    return graphWidth
  }

  const dayStart = addDays(rangeStart, dayIndex)
  const dayEnd = addDays(dayStart, 1)
  const progress =
    (date.getTime() - dayStart.getTime()) /
    (dayEnd.getTime() - dayStart.getTime())

  return dayOffsets[dayIndex] + clamp(progress, 0, 1) * dayWidths[dayIndex]
}

function buildCatmullRomPath(points: PlotPoint[]) {
  if (!points.length) {
    return ''
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`
  }

  let path = `M ${points[0].x} ${points[0].y}`

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index]
    const p1 = points[index]
    const p2 = points[index + 1]
    const p3 = points[index + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return path
}

function buildDayBands(dayWidths: number[], dayOffsets: number[]) {
  return dayWidths.map((width, index) => {
    if (index % 2 === 0) {
      return ''
    }

    return `<rect class="tide-day-band" x="${dayOffsets[index]}" y="0" width="${width}" height="${GRAPH_HEIGHT}" />`
  }).join('')
}

function buildVerticalGrid(dayWidths: number[], dayOffsets: number[]) {
  const graphWidth = dayWidths.reduce((total, width) => total + width, 0)
  const dayLines = [...dayOffsets, graphWidth].map(x => {

    return `<line class="tide-day-line" x1="${x}" y1="0" x2="${x}" y2="${GRAPH_HEIGHT}" />`
  }).join('')
  const quarterLines = dayWidths.map((width, dayIndex) =>
    [1, 2, 3]
      .map(quarter => {
        const x = dayOffsets[dayIndex] + (width / 4) * quarter

        return `<line class="tide-quarter-line" x1="${x}" y1="0" x2="${x}" y2="${GRAPH_HEIGHT}" />`
      })
      .join('')
  ).join('')

  return `${dayLines}${quarterLines}`
}

function buildHorizontalGrid(
  ticks: {
    value: number
    y: number
  }[],
  graphWidth: number
) {
  return ticks
    .map(
      tick =>
        `<line class="tide-height-line" x1="0" y1="${tick.y}" x2="${graphWidth}" y2="${tick.y}" />`
    )
    .join('')
}

function buildPointStems(
  points: TidePoint[],
  mapX: (date: Date) => number,
  mapY: (height: number) => number,
  bottomY: number
) {
  return points
    .map(point => {
      const x = mapX(point.time)
      const y = mapY(point.heightFt)

      return `<line class="tide-point-stem" x1="${x}" y1="${y}" x2="${x}" y2="${bottomY}" />`
    })
    .join('')
}

function buildPointDots(
  points: TidePoint[],
  mapX: (date: Date) => number,
  mapY: (height: number) => number
) {
  return points
    .map(point => {
      const x = mapX(point.time)
      const y = mapY(point.heightFt)
      const label = `${point.type === 'H' ? 'High' : 'Low'} tide, ${formatTime(
        point.time
      )}, ${formatFeet(point.heightFt)}`

      return `
        <circle class="tide-point tide-point-${
          point.type === 'H' ? 'high' : 'low'
        }" cx="${x}" cy="${y}" r="5.5">
          <title>${label}</title>
        </circle>
      `
    })
    .join('')
}

function buildTodayCallouts(
  today: TideDay,
  mapX: (date: Date) => number,
  mapY: (height: number) => number,
  graphWidth: number
) {
  return today.points
    .slice(0, 3)
    .map(point => buildCallout(point, mapX(point.time), mapY(point.heightFt), graphWidth))
    .join('')
}

function buildCallout(
  point: TidePoint,
  x: number,
  y: number,
  graphWidth: number
) {
  const width = 112
  const height = 58
  const boxX = clamp(x - width / 2, 8, graphWidth - width - 8)
  const shouldPlaceBelow = point.type === 'L' && y < GRAPH_HEIGHT - height - 22
  const boxY = shouldPlaceBelow ? y + 14 : clamp(y - height - 16, 8, GRAPH_HEIGHT - height - 8)
  const anchorY = shouldPlaceBelow ? boxY : boxY + height
  const tideMark = point.type === 'H' ? 'H' : 'L'

  return `
    <g class="tide-callout">
      <line x1="${x}" y1="${y}" x2="${boxX + width / 2}" y2="${anchorY}" />
      <rect x="${boxX}" y="${boxY}" width="${width}" height="${height}" rx="6" />
      <text class="tide-callout-time" x="${boxX + width / 2}" y="${
        boxY + 22
      }">${formatTime(point.time)}</text>
      <text class="tide-callout-height" x="${boxX + width / 2}" y="${
        boxY + 44
      }">${tideMark} ${formatFeet(point.heightFt, true)}</text>
    </g>
  `
}

function buildEmptyState(message: string) {
  return `<div class="tide-empty-state">${message}</div>`
}

function getWaterLevel(currentHeightFt: number, points: TidePoint[]) {
  const heights = points.map(point => point.heightFt)
  const min = Math.min(...heights)
  const max = Math.max(...heights)
  const level = ((currentHeightFt - min) / (max - min || 1)) * 100

  return clamp(level, 12, 88)
}

function ordinalWord(value: number) {
  return ['first', 'second', 'third', 'fourth'][value - 1] ?? `${value}th`
}

function gearIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l1.5 3 3.3.5-.7 3.2 2.4 2.3-2.4 2.3.7 3.2-3.3.5-1.5 3-1.5-3-3.3-.5.7-3.2-2.4-2.3 2.4-2.3-.7-3.2 3.3-.5L12 2.5z" />
      <circle cx="12" cy="11.5" r="3.2" />
    </svg>
  `
}

function expandIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h12v12h-2V7.4l-9.3 9.3-1.4-1.4L16.6 6H8V4z" />
      <path d="M5 7h2v10h10v2H5V7z" />
    </svg>
  `
}

function highIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" class="tide-row-icon">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 17V7m0 0l-4 4m4-4l4 4" />
    </svg>
  `
}

function lowIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" class="tide-row-icon">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v10m0 0l-4-4m4 4l4-4" />
    </svg>
  `
}
