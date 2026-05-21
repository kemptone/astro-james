# Tide Dashboard Spec

## Goal

Rebuild `/tide` into a tide dashboard inspired by the provided tide forecast references, with a large multi-day forecast chart on top and today's tide summary underneath.

## Existing Route

Use the existing Astro page:

- `src/pages/tide.astro`

Keep the current NOAA data source from:

- `src/core/tide/getData.ts`

The current station is `9415102` for Napa.

## Page Layout

The page should be organized in this order:

1. Multi-day tide forecast chart
2. Today's tide summary sentence
3. Live tide card
4. Today's tide times table

## Top Chart

The top chart should look and behave like a horizontally scrolling tide forecast table.

Required elements:

- Blue date header row
- Weekday header row
- Smooth blue tide curve
- Light blue filled area under the curve
- Dots at high and low tide points
- Red dashed vertical line for the current time
- Red dot for the current estimated tide height
- Left y-axis showing tide height in feet
- Per-day high tide row below the graph
- Per-day low tide row below the graph

Example date header labels:

- `Wednesday, 20 May`
- `21 May`
- `22 May`

Example weekday labels:

- `Thu`
- `Fri`
- `Sat`

Optional v2 rows:

- Sunrise and sunset
- Moon phase
- Moon rise and set
- Wind
- Weather icons

For v1, only the date header, tide graph, high tide row, and low tide row are required.

## Today Summary

The section below the chart should use this heading pattern:

```text
Today's tide times for Napa, Napa River, Carquinez Strait, California
```

The summary sentence should describe today's predicted high and low tides:

```text
The predicted tide times today on Wednesday 20 May 2026 for Napa are: first high tide at 4:21am, first low tide at 12:02pm, second high tide at 7:02pm. Sunrise is at 5:53am and sunset is at 8:17pm.
```

Sunrise and sunset can be omitted in v1 unless a reliable data source is added.

## Live Tide Card

The live tide card should show:

- "Live Tide" label
- Next high tide and countdown
- Next low tide and countdown
- Whether the tide is rising or falling
- Local time
- Current estimated tide height
- A simple visual water line or water background

## Today's Tide Table

The table should show today's tide points.

Columns:

- Tide
- Time and Date
- Height

Rows:

- High Tide
- Low Tide
- High Tide
- Low Tide, if available

## Data Model

Normalize NOAA predictions into grouped days.

```ts
type TidePoint = {
  time: Date
  heightFt: number
  type: 'H' | 'L'
}

type TideDay = {
  date: string
  weekday: string
  highs: TidePoint[]
  lows: TidePoint[]
  points: TidePoint[]
}
```

For live tide state:

```ts
type LiveTideState = {
  now: Date
  previousPoint: TidePoint
  nextPoint: TidePoint
  currentHeightFt: number
  isRising: boolean
}
```

Current tide height can be estimated by interpolating between the previous and next NOAA high/low points.

## Implementation Plan

1. Replace the simple SVG and table output in `/tide` with a structured dashboard.
2. Keep `getData()` as the fetch layer.
3. Add a tide normalization module that groups predictions by day, formats times, finds today's tide points, finds previous and next tide points, and calculates current estimated height.
4. Replace or extend `buildGraph.ts` with a richer SVG builder for day columns, filled tide curve, high/low dots, current time marker, and labels.
5. Replace or extend `buildTable.ts` with top chart high/low rows and today's tide table.
6. Style the page to match the reference: blue headers, light grid, readable tide times, horizontally scrollable chart on mobile, and summary cards below the chart.

## MVP Acceptance Criteria

- `/tide` loads NOAA tide predictions for Napa.
- Top chart shows at least 10 to 14 days.
- Tide curve is smooth and filled blue.
- High and low points are visible.
- Today's high and low tides appear in a readable table.
- Current time is shown on the graph.
- Page works on desktop and mobile with horizontal scrolling for the chart.
- `npm run build` passes.

## Later Enhancements

- Station picker
- Gear/settings button
- Fullscreen chart button
- Sunrise/sunset row
- Moon phase row
- Wind/weather row
- Click or hover tide points for larger callouts
- Cache NOAA data with expiration instead of permanent `localStorage` caching
