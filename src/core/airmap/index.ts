import L, {
  type Coords,
  type LeafletMouseEvent,
  type Map as LeafletMap,
} from 'leaflet'
import 'leaflet/dist/leaflet.css'

type InfluenceSize = 'small' | 'medium' | 'large'

interface GeoPoint {
  lat: number
  lng: number
}

interface NamedPlace extends GeoPoint {
  id: string
  name: string
  displayName: string
}

interface CityMeasurement extends NamedPlace {
  aqi: number
  radiusMeters: number
  updatedAt: number
  connectToId?: string
}

interface SelectedLocation extends NamedPlace {}

interface LabelPlace extends NamedPlace {
  minZoom: number
}

interface SavedAirMapStateV2 {
  version: 2
  measurements: CityMeasurement[]
  view: {
    lat: number
    lng: number
    zoom: number
  }
  controls: {
    aqi: number
    influence: InfluenceSize
    connect: boolean
  }
}

interface LegacyStroke {
  id?: string
  value?: number
  radiusMeters?: number
  points?: GeoPoint[]
}

interface LegacyState {
  version?: number
  strokes?: LegacyStroke[]
  places?: NamedPlace[]
  view?: {
    lat?: number
    lng?: number
    zoom?: number
  }
  controls?: {
    aqi?: number
    brush?: InfluenceSize
  }
}

interface GeocodeResult {
  place_id: number
  osm_type?: string
  osm_id?: number
  name?: string
  display_name: string
  lat: string
  lon: string
  boundingbox?: [string, string, string, string]
  namedetails?: Record<string, string>
  address?: Record<string, string>
}

const STORAGE_KEY = 'airmap:v2'
const LEGACY_STORAGE_KEY = 'airmap:v1'
const GEOCODE_CACHE_KEY = 'airmap:geocode-cache:v1'
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const LAND_URL = '/airmap/ne_110m_land.geojson'
const POPULATED_PLACES_URL =
  '/airmap/ne_10m_populated_places_simple.geojson'
const GEOCODER_URL = 'https://nominatim.openstreetmap.org'
const DEFAULT_CENTER: [number, number] = [20, 0]
const DEFAULT_ZOOM = 2
const DEFAULT_AQI = 100
const BASELINE_AQI = 50
const MAX_MEASUREMENTS = 500
const TILE_SIZE = 256
const FIELD_SIZE = 128
const EXACT_CORE_RATIO = 0.08

const INFLUENCE_RADIUS_METERS: Record<InfluenceSize, number> = {
  small: 25_000,
  medium: 100_000,
  large: 300_000,
}

const COLOR_STOPS = [
  {value: 0, color: [0, 228, 0]},
  {value: 50, color: [0, 228, 0]},
  {value: 100, color: [255, 255, 0]},
  {value: 150, color: [255, 126, 0]},
  {value: 200, color: [255, 0, 0]},
  {value: 250, color: [143, 63, 151]},
  {value: 350, color: [126, 0, 35]},
  {value: 500, color: [126, 0, 35]},
] as const

const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id)
  if (!element) throw new Error(`Missing #${id}`)
  return element as T
}

const mapElement = getElement<HTMLDivElement>('airmap-map')
const shellElement = getElement<HTMLElement>('airmap-shell')
const controlPanel = getElement<HTMLElement>('airmap-controls')
const editMapButton = getElement<HTMLButtonElement>('airmap-edit')
const placeSearchForm = getElement<HTMLFormElement>('airmap-place-search')
const placeInput = getElement<HTMLInputElement>('airmap-place-input')
const searchButton = getElement<HTMLButtonElement>('airmap-search-button')
const searchResults = getElement<HTMLDivElement>('airmap-search-results')
const saveLocationButton = getElement<HTMLButtonElement>('airmap-save-location')
const removeLocationButton = getElement<HTMLButtonElement>(
  'airmap-remove-location',
)
const aqiInput = getElement<HTMLInputElement>('airmap-aqi-input')
const decreaseButton = getElement<HTMLButtonElement>('airmap-decrease')
const increaseButton = getElement<HTMLButtonElement>('airmap-increase')
const undoButton = getElement<HTMLButtonElement>('airmap-undo')
const redoButton = getElement<HTMLButtonElement>('airmap-redo')
const resetButton = getElement<HTMLButtonElement>('airmap-reset')
const zoomInButton = getElement<HTMLButtonElement>('airmap-zoom-in')
const zoomOutButton = getElement<HTMLButtonElement>('airmap-zoom-out')
const worldButton = getElement<HTMLButtonElement>('airmap-world')
const selectedName = getElement<HTMLSpanElement>('airmap-selected-name')
const selectedValue = getElement<HTMLSpanElement>('airmap-selected-value')
const selectedCategory = getElement<HTMLElement>('airmap-selected-category')
const selectedSwatch = getElement<HTMLDivElement>('airmap-selected-swatch')
const valueCategory = getElement<HTMLSpanElement>('airmap-value-category')
const connectCheckbox = getElement<HTMLInputElement>('airmap-connect')
const statusMessage = getElement<HTMLParagraphElement>('airmap-status')
const influenceButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('[data-influence]'),
)

let measurements: CityMeasurement[] = []
let undoStack: CityMeasurement[][] = []
let redoStack: CityMeasurement[][] = []
let landData: any = null
let labelPlaces: LabelPlace[] = []
let influence: InfluenceSize = 'medium'
let editAqi = DEFAULT_AQI
let connectMode = false
let selectedLocation: SelectedLocation | null = null
let selectionResolved = false
let saveTimer = 0
let geocoderBusy = false
let lastGeocoderRequest = 0
let geocodeRequestToken = 0
let migratedLegacyState = false
let presentationMode = false

const clampAqi = (value: number) =>
  Math.max(0, Math.min(500, Number.isFinite(value) ? Math.round(value) : 50))

const wrapLongitude = (longitude: number) =>
  ((((longitude + 180) % 360) + 360) % 360) - 180

const aqiCategory = (value: number) => {
  if (value <= 50) return 'Good'
  if (value <= 100) return 'Moderate'
  if (value <= 150) return 'Unhealthy for sensitive groups'
  if (value <= 200) return 'Unhealthy'
  if (value < 350) return 'Very unhealthy'
  return 'Hazardous'
}

const aqiColor = (value: number): [number, number, number] => {
  const normalized = clampAqi(value)
  for (let index = 1; index < COLOR_STOPS.length; index += 1) {
    const upper = COLOR_STOPS[index]
    const lower = COLOR_STOPS[index - 1]
    if (normalized <= upper.value) {
      const amount =
        (normalized - lower.value) / (upper.value - lower.value || 1)
      return [
        Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * amount),
        Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * amount),
        Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * amount),
      ]
    }
  }
  return [...COLOR_STOPS.at(-1)!.color]
}

const colorCss = (value: number, alpha = 1) => {
  const [red, green, blue] = aqiColor(value)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const haversineDistance = (a: GeoPoint, b: GeoPoint) => {
  const earthRadius = 6_371_000
  const toRadians = Math.PI / 180
  const lat1 = a.lat * toRadians
  const lat2 = b.lat * toRadians
  const latDifference = (b.lat - a.lat) * toRadians
  let lngDifference = (b.lng - a.lng) * toRadians
  if (lngDifference > Math.PI) lngDifference -= Math.PI * 2
  if (lngDifference < -Math.PI) lngDifference += Math.PI * 2
  const sinLat = Math.sin(latDifference / 2)
  const sinLng = Math.sin(lngDifference / 2)
  const term =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  return earthRadius * 2 * Math.atan2(Math.sqrt(term), Math.sqrt(1 - term))
}

const smoothstep = (value: number) => {
  const normalized = Math.max(0, Math.min(1, value))
  return normalized * normalized * (3 - 2 * normalized)
}

const shortestLongitudeDelta = (from: number, to: number) => {
  let difference = to - from
  if (difference > 180) difference -= 360
  if (difference < -180) difference += 360
  return difference
}

const distanceToConnection = (
  point: GeoPoint,
  start: GeoPoint,
  end: GeoPoint,
) => {
  const metersPerDegree = 111_320
  const longitudeScale =
    metersPerDegree * Math.max(0.12, Math.cos((point.lat * Math.PI) / 180))
  const startX = shortestLongitudeDelta(point.lng, start.lng) * longitudeScale
  const startY = (start.lat - point.lat) * metersPerDegree
  const endX = shortestLongitudeDelta(point.lng, end.lng) * longitudeScale
  const endY = (end.lat - point.lat) * metersPerDegree
  const segmentX = endX - startX
  const segmentY = endY - startY
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2
  if (segmentLengthSquared === 0) return Math.hypot(startX, startY)
  const amount = Math.max(
    0,
    Math.min(
      1,
      -(startX * segmentX + startY * segmentY) / segmentLengthSquared,
    ),
  )
  return Math.hypot(startX + segmentX * amount, startY + segmentY * amount)
}

const distanceToMeasurementField = (
  point: GeoPoint,
  measurement: CityMeasurement,
) => {
  let distance = haversineDistance(point, measurement)
  if (measurement.connectToId) {
    const destination = measurements.find(
      candidate => candidate.id === measurement.connectToId,
    )
    if (destination) {
      distance = Math.min(
        distance,
        distanceToConnection(point, measurement, destination),
      )
    }
  }
  return distance
}

const evaluateAqi = (
  lat: number,
  lng: number,
  candidates: CityMeasurement[] = measurements,
) => {
  if (candidates.length === 0) return BASELINE_AQI
  const point = {lat, lng: wrapLongitude(lng)}

  let closestCityCore: CityMeasurement | null = null
  let closestCityRatio = Number.POSITIVE_INFINITY
  for (const measurement of candidates) {
    const cityRatio =
      haversineDistance(point, measurement) / measurement.radiusMeters
    if (cityRatio <= EXACT_CORE_RATIO && cityRatio < closestCityRatio) {
      closestCityCore = measurement
      closestCityRatio = cityRatio
    }
  }
  if (closestCityCore) return closestCityCore.aqi

  let coreMeasurement: CityMeasurement | null = null
  let closestCoreRatio = Number.POSITIVE_INFINITY
  let weightedValue = 0
  let totalWeight = 0
  let coverage = 0

  for (const measurement of candidates) {
    const ratio =
      distanceToMeasurementField(point, measurement) / measurement.radiusMeters
    if (ratio > 1) continue
    if (ratio <= EXACT_CORE_RATIO && ratio < closestCoreRatio) {
      coreMeasurement = measurement
      closestCoreRatio = ratio
    }
    const weight = 1 - smoothstep(ratio)
    weightedValue += weight * measurement.aqi
    totalWeight += weight
    coverage = Math.max(coverage, weight)
  }

  if (coreMeasurement) return coreMeasurement.aqi
  if (totalWeight === 0) return BASELINE_AQI

  const blendedMeasurements = weightedValue / totalWeight
  return clampAqi(
    BASELINE_AQI * (1 - coverage) + blendedMeasurements * coverage,
  )
}

const isInfluenceSize = (value: unknown): value is InfluenceSize =>
  value === 'small' || value === 'medium' || value === 'large'

const nearestInfluenceSize = (radiusMeters: number): InfluenceSize => {
  let closest: InfluenceSize = 'medium'
  let smallestDifference = Number.POSITIVE_INFINITY
  for (const [size, radius] of Object.entries(INFLUENCE_RADIUS_METERS)) {
    const difference = Math.abs(radius - radiusMeters)
    if (difference < smallestDifference) {
      closest = size as InfluenceSize
      smallestDifference = difference
    }
  }
  return closest
}

const validateNamedPlace = (candidate: unknown): NamedPlace | null => {
  if (!candidate || typeof candidate !== 'object') return null
  const place = candidate as Partial<NamedPlace>
  if (
    typeof place.id !== 'string' ||
    typeof place.name !== 'string' ||
    typeof place.lat !== 'number' ||
    typeof place.lng !== 'number' ||
    !Number.isFinite(place.lat) ||
    !Number.isFinite(place.lng) ||
    place.lat < -85 ||
    place.lat > 85
  ) {
    return null
  }
  return {
    id: place.id.slice(0, 160),
    name: place.name.slice(0, 180),
    displayName:
      typeof place.displayName === 'string'
        ? place.displayName.slice(0, 600)
        : place.name.slice(0, 180),
    lat: place.lat,
    lng: wrapLongitude(place.lng),
  }
}

const validateMeasurement = (candidate: unknown): CityMeasurement | null => {
  const place = validateNamedPlace(candidate)
  if (!place || !candidate || typeof candidate !== 'object') return null
  const measurement = candidate as Partial<CityMeasurement>
  if (
    typeof measurement.aqi !== 'number' ||
    typeof measurement.radiusMeters !== 'number' ||
    !Number.isFinite(measurement.radiusMeters) ||
    measurement.radiusMeters <= 0
  ) {
    return null
  }
  return {
    ...place,
    aqi: clampAqi(measurement.aqi),
    radiusMeters: Math.min(1_000_000, measurement.radiusMeters),
    connectToId:
      typeof measurement.connectToId === 'string'
        ? measurement.connectToId.slice(0, 160)
        : undefined,
    updatedAt:
      typeof measurement.updatedAt === 'number' &&
      Number.isFinite(measurement.updatedAt)
        ? measurement.updatedAt
        : 0,
  }
}

const normalizeView = (view: LegacyState['view']) => ({
  lat:
    typeof view?.lat === 'number' && Number.isFinite(view.lat)
      ? Math.max(-85, Math.min(85, view.lat))
      : DEFAULT_CENTER[0],
  lng:
    typeof view?.lng === 'number' && Number.isFinite(view.lng)
      ? wrapLongitude(view.lng)
      : DEFAULT_CENTER[1],
  zoom:
    typeof view?.zoom === 'number' && Number.isFinite(view.zoom)
      ? Math.max(2, Math.min(12, Math.round(view.zoom)))
      : DEFAULT_ZOOM,
})

const migrateLegacyState = (legacy: LegacyState): SavedAirMapStateV2 | null => {
  if (
    legacy.version !== 1 ||
    !Array.isArray(legacy.strokes) ||
    !Array.isArray(legacy.places)
  ) {
    return null
  }

  const places = legacy.places
    .map(validateNamedPlace)
    .filter((place): place is NamedPlace => Boolean(place))
  const converted: CityMeasurement[] = []

  for (const place of places) {
    const matchingStroke = [...legacy.strokes].reverse().find(stroke => {
      if (
        !Array.isArray(stroke.points) ||
        stroke.points.length !== 1 ||
        typeof stroke.value !== 'number' ||
        typeof stroke.radiusMeters !== 'number'
      ) {
        return false
      }
      const point = stroke.points[0]
      return (
        point &&
        typeof point.lat === 'number' &&
        typeof point.lng === 'number' &&
        haversineDistance(place, point) < 1_000
      )
    })
    if (!matchingStroke) continue
    const size = nearestInfluenceSize(matchingStroke.radiusMeters!)
    converted.push({
      ...place,
      aqi: clampAqi(matchingStroke.value!),
      radiusMeters: INFLUENCE_RADIUS_METERS[size],
      updatedAt: Date.now() + converted.length,
    })
  }

  migratedLegacyState = true
  return {
    version: 2,
    measurements: converted.slice(-MAX_MEASUREMENTS),
    view: normalizeView(legacy.view),
    controls: {
      aqi: clampAqi(legacy.controls?.aqi ?? DEFAULT_AQI),
      influence: isInfluenceSize(legacy.controls?.brush)
        ? legacy.controls.brush
        : 'medium',
      connect: false,
    },
  }
}

const loadSavedState = (): SavedAirMapStateV2 | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedAirMapStateV2>
      if (parsed.version !== 2 || !Array.isArray(parsed.measurements)) {
        throw new Error('Invalid v2 state')
      }
      return {
        version: 2,
        measurements: parsed.measurements
          .slice(-MAX_MEASUREMENTS)
          .map(validateMeasurement)
          .filter((measurement): measurement is CityMeasurement =>
            Boolean(measurement),
          ),
        view: normalizeView(parsed.view),
        controls: {
          aqi: clampAqi(parsed.controls?.aqi ?? DEFAULT_AQI),
          influence: isInfluenceSize(parsed.controls?.influence)
            ? parsed.controls.influence
            : 'medium',
          connect:
            typeof parsed.controls?.connect === 'boolean'
              ? parsed.controls.connect
              : false,
        },
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }

  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!legacyRaw) return null
    return migrateLegacyState(JSON.parse(legacyRaw) as LegacyState)
  } catch {
    return null
  }
}

const savedState = loadSavedState()
if (savedState) {
  measurements = savedState.measurements
  influence = savedState.controls.influence
  editAqi = savedState.controls.aqi
  connectMode = savedState.controls.connect
}

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches

const map = L.map(mapElement, {
  center: savedState
    ? [savedState.view.lat, savedState.view.lng]
    : DEFAULT_CENTER,
  zoom: savedState?.view.zoom ?? DEFAULT_ZOOM,
  minZoom: 2,
  maxZoom: 12,
  zoomControl: false,
  worldCopyJump: false,
  scrollWheelZoom: true,
  wheelDebounceTime: 90,
  wheelPxPerZoomLevel: 180,
  doubleClickZoom: true,
  touchZoom: true,
  keyboard: true,
  zoomAnimation: !prefersReducedMotion,
  zoomAnimationThreshold: 12,
  fadeAnimation: !prefersReducedMotion,
  markerZoomAnimation: !prefersReducedMotion,
  maxBounds: L.latLngBounds([-85, -100000], [85, 100000]),
  maxBoundsViscosity: 1,
})

map.createPane('airQualityPane')
const airQualityPane = map.getPane('airQualityPane')
if (airQualityPane) {
  airQualityPane.style.zIndex = '350'
  airQualityPane.style.pointerEvents = 'none'
}

map.createPane('aqiNumberPane')
const aqiNumberPane = map.getPane('aqiNumberPane')
if (aqiNumberPane) {
  aqiNumberPane.style.zIndex = '460'
  aqiNumberPane.style.pointerEvents = 'none'
}

const tileLayer = L.tileLayer(TILE_URL, {
  maxZoom: 19,
  keepBuffer: 4,
  updateWhenIdle: false,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
})
  .on('tileerror', () => {
    statusMessage.textContent =
      'The online basemap could not load. Your saved city readings are still safe.'
  })
  .addTo(map)

const landPathCache = new Map<string, Path2D>()

const renderRingToPath = (
  path: Path2D,
  targetMap: LeafletMap,
  ring: number[][],
  zoom: number,
  tileOrigin: L.Point,
  longitudeShift: number,
) => {
  ring.forEach((coordinate, index) => {
    const projected = targetMap
      .project([coordinate[1], coordinate[0] + longitudeShift], zoom)
      .subtract(tileOrigin)
    if (index === 0) path.moveTo(projected.x, projected.y)
    else path.lineTo(projected.x, projected.y)
  })
  path.closePath()
}

const renderGeometryToPath = (
  path: Path2D,
  targetMap: LeafletMap,
  geometry: any,
  zoom: number,
  tileOrigin: L.Point,
  longitudeShift: number,
) => {
  if (!geometry) return
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach((ring: number[][]) =>
      renderRingToPath(path, targetMap, ring, zoom, tileOrigin, longitudeShift),
    )
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon: number[][][]) =>
      polygon.forEach(ring =>
        renderRingToPath(
          path,
          targetMap,
          ring,
          zoom,
          tileOrigin,
          longitudeShift,
        ),
      ),
    )
  }
}

const getLandPath = (coords: Coords, targetMap: LeafletMap) => {
  const key = `${coords.z}:${coords.x}:${coords.y}`
  const cached = landPathCache.get(key)
  if (cached) return cached
  const path = new Path2D()
  const tileOrigin = L.point(coords.x * TILE_SIZE, coords.y * TILE_SIZE)
  for (const feature of landData?.features ?? []) {
    for (const shift of [-360, 0, 360]) {
      renderGeometryToPath(
        path,
        targetMap,
        feature.geometry,
        coords.z,
        tileOrigin,
        shift,
      )
    }
  }
  landPathCache.set(key, path)
  if (landPathCache.size > 1_200) {
    const oldestKey = landPathCache.keys().next().value
    if (oldestKey) landPathCache.delete(oldestKey)
  }
  return path
}

const getTileCandidates = (coords: Coords, targetMap: LeafletMap) => {
  if (measurements.length === 0) return measurements
  const tileOrigin = L.point(coords.x * TILE_SIZE, coords.y * TILE_SIZE)
  const tileCenterX = tileOrigin.x + TILE_SIZE / 2
  const worldWidth = TILE_SIZE * 2 ** coords.z

  return measurements.filter(measurement => {
    const projected = targetMap.project(measurement, coords.z)
    const centerX =
      projected.x +
      Math.round((tileCenterX - projected.x) / worldWidth) * worldWidth
    const latitudeOffset = measurement.radiusMeters / 111_320
    const longitudeOffset =
      measurement.radiusMeters /
      (111_320 * Math.max(0.12, Math.cos((measurement.lat * Math.PI) / 180)))
    const northEdge = targetMap.project(
      [Math.min(85, measurement.lat + latitudeOffset), measurement.lng],
      coords.z,
    )
    const eastEdge = targetMap.project(
      [measurement.lat, measurement.lng + longitudeOffset],
      coords.z,
    )
    const radiusPixels = Math.max(
      Math.abs(projected.y - northEdge.y),
      Math.abs(projected.x - eastEdge.x),
      1,
    )
    const circleIntersects =
      centerX + radiusPixels >= tileOrigin.x &&
      centerX - radiusPixels <= tileOrigin.x + TILE_SIZE &&
      projected.y + radiusPixels >= tileOrigin.y &&
      projected.y - radiusPixels <= tileOrigin.y + TILE_SIZE
    if (circleIntersects) return true

    const destination = measurement.connectToId
      ? measurements.find(candidate => candidate.id === measurement.connectToId)
      : undefined
    if (!destination) return false
    const destinationProjected = targetMap.project(destination, coords.z)
    const destinationX =
      destinationProjected.x +
      Math.round((centerX - destinationProjected.x) / worldWidth) * worldWidth
    return (
      Math.max(centerX, destinationX) + radiusPixels >= tileOrigin.x &&
      Math.min(centerX, destinationX) - radiusPixels <=
        tileOrigin.x + TILE_SIZE &&
      Math.max(projected.y, destinationProjected.y) + radiusPixels >=
        tileOrigin.y &&
      Math.min(projected.y, destinationProjected.y) - radiusPixels <=
        tileOrigin.y + TILE_SIZE
    )
  })
}

const renderAirTile = (
  canvas: HTMLCanvasElement,
  coords: Coords,
  targetMap: LeafletMap,
) => {
  if (!landData) return
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = TILE_SIZE * pixelRatio
  canvas.height = TILE_SIZE * pixelRatio
  canvas.style.width = `${TILE_SIZE}px`
  canvas.style.height = `${TILE_SIZE}px`
  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, TILE_SIZE, TILE_SIZE)

  const fieldCanvas = document.createElement('canvas')
  fieldCanvas.width = FIELD_SIZE
  fieldCanvas.height = FIELD_SIZE
  const fieldContext = fieldCanvas.getContext('2d')
  if (!fieldContext) return
  const image = fieldContext.createImageData(FIELD_SIZE, FIELD_SIZE)
  const tileOrigin = L.point(coords.x * TILE_SIZE, coords.y * TILE_SIZE)
  const fieldScale = TILE_SIZE / FIELD_SIZE
  const candidates = getTileCandidates(coords, targetMap)

  for (let y = 0; y < FIELD_SIZE; y += 1) {
    for (let x = 0; x < FIELD_SIZE; x += 1) {
      const worldPoint = tileOrigin.add([
        (x + 0.5) * fieldScale,
        (y + 0.5) * fieldScale,
      ])
      const latLng = targetMap.unproject(worldPoint, coords.z)
      const value = evaluateAqi(latLng.lat, latLng.lng, candidates)
      const [red, green, blue] = aqiColor(value)
      const offset = (y * FIELD_SIZE + x) * 4
      image.data[offset] = red
      image.data[offset + 1] = green
      image.data[offset + 2] = blue
      image.data[offset + 3] =
        value === BASELINE_AQI
          ? 92
          : Math.round(92 + Math.min(86, Math.abs(value - BASELINE_AQI)))
    }
  }

  fieldContext.putImageData(image, 0, 0)
  context.save()
  context.clip(getLandPath(coords, targetMap), 'evenodd')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(fieldCanvas, 0, 0, TILE_SIZE, TILE_SIZE)
  context.restore()
}

const AirQualityGridLayer = L.GridLayer.extend({
  createTile(this: L.GridLayer, coords: Coords) {
    const canvas = L.DomUtil.create(
      'canvas',
      'air-quality-tile',
    ) as HTMLCanvasElement
    canvas.setAttribute('aria-hidden', 'true')
    renderAirTile(canvas, coords, map)
    return canvas
  },
})

const airLayer = new (AirQualityGridLayer as typeof L.GridLayer)({
  pane: 'airQualityPane',
  tileSize: TILE_SIZE,
  opacity: 1,
  keepBuffer: 4,
  updateWhenIdle: false,
  updateWhenZooming: false,
  noWrap: false,
  maxZoom: 12,
}).addTo(map)

const renderNumberTile = (
  canvas: HTMLCanvasElement,
  coords: Coords,
  targetMap: LeafletMap,
) => {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = TILE_SIZE * pixelRatio
  canvas.height = TILE_SIZE * pixelRatio
  canvas.style.width = `${TILE_SIZE}px`
  canvas.style.height = `${TILE_SIZE}px`
  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, TILE_SIZE, TILE_SIZE)
  context.textAlign = 'center'
  context.textBaseline = 'bottom'
  context.font =
    '900 14px Inter, ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif'
  context.lineJoin = 'round'
  context.lineWidth = 4
  context.strokeStyle = 'rgba(255, 255, 255, 0.96)'

  const tileOrigin = L.point(coords.x * TILE_SIZE, coords.y * TILE_SIZE)
  const tileCenterX = tileOrigin.x + TILE_SIZE / 2
  const worldWidth = TILE_SIZE * 2 ** coords.z
  const visibleZoom = coords.z + 1
  const customPlaces = new Map<string, NamedPlace>()
  for (const measurement of measurements) {
    customPlaces.set(measurement.id, measurement)
  }
  if (selectedLocation) customPlaces.set(selectedLocation.id, selectedLocation)

  const drawPlace = (place: GeoPoint) => {
    const projected = targetMap.project(place, coords.z)
    const worldX =
      projected.x +
      Math.round((tileCenterX - projected.x) / worldWidth) * worldWidth
    const x = worldX - tileOrigin.x
    const y = projected.y - tileOrigin.y - 9
    if (x < -24 || x > TILE_SIZE + 24 || y < -16 || y > TILE_SIZE + 16)
      return
    const value = evaluateAqi(place.lat, place.lng)
    const text = String(value)
    context.strokeText(text, x, y)
    context.fillStyle = colorCss(value)
    context.fillText(text, x, y)
  }

  for (const place of labelPlaces) {
    if (place.minZoom <= visibleZoom) drawPlace(place)
  }
  for (const place of customPlaces.values()) drawPlace(place)
}

const AqiNumberGridLayer = L.GridLayer.extend({
  createTile(this: L.GridLayer, coords: Coords) {
    const canvas = L.DomUtil.create(
      'canvas',
      'aqi-number-tile',
    ) as HTMLCanvasElement
    canvas.setAttribute('aria-hidden', 'true')
    renderNumberTile(canvas, coords, map)
    return canvas
  },
})

const numberLayer = new (AqiNumberGridLayer as typeof L.GridLayer)({
  pane: 'aqiNumberPane',
  tileSize: TILE_SIZE,
  opacity: 1,
  keepBuffer: 4,
  updateWhenIdle: false,
  updateWhenZooming: false,
  noWrap: false,
  maxZoom: 12,
}).addTo(map)

const selectedMeasurement = () =>
  selectedLocation && selectionResolved
    ? measurements.find(measurement => measurement.id === selectedLocation!.id)
    : undefined

const updateEditorButtons = () => {
  const hasSelection = Boolean(selectedLocation && selectionResolved)
  saveLocationButton.disabled = !hasSelection
  removeLocationButton.disabled = !selectedMeasurement()
  saveLocationButton.textContent = selectedLocation
    ? `Submit ${editAqi} AQI for ${selectedLocation.name}`
    : 'Select a named place first'
}

const inspectLocation = (place: NamedPlace, resolved = true) => {
  selectedLocation = place
  selectionResolved = resolved
  const value = evaluateAqi(place.lat, place.lng)
  selectedName.textContent = place.name
  selectedValue.textContent = String(value)
  selectedCategory.textContent = aqiCategory(value)
  selectedSwatch.style.background = colorCss(value)
  updateEditorButtons()
}

const selectNamedPlace = (place: NamedPlace, moveMap = true) => {
  const measurement = measurements.find(candidate => candidate.id === place.id)
  if (measurement) {
    editAqi = measurement.aqi
    influence = nearestInfluenceSize(measurement.radiusMeters)
    connectMode = Boolean(measurement.connectToId)
    connectCheckbox.checked = connectMode
    aqiInput.value = String(editAqi)
    updateValueUi()
    updateInfluenceUi()
  }
  inspectLocation(place)
  numberLayer.redraw()

  if (moveMap) {
    map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 8), {
      animate: !prefersReducedMotion,
      duration: prefersReducedMotion ? 0 : 1.2,
    })
  }
  searchResults.replaceChildren()
  placeInput.value = place.name
  statusMessage.textContent = `${place.displayName} selected. Choose its AQI and influence area.`
}

const updateNamedPlaceMarkers = () => {
  numberLayer.redraw()
}

const refreshSelectedLocation = () => {
  if (selectedLocation) inspectLocation(selectedLocation)
}

const updateHistoryButtons = () => {
  undoButton.disabled = undoStack.length === 0
  redoButton.disabled = redoStack.length === 0
}

function updateValueUi() {
  editAqi = clampAqi(Number(aqiInput.value))
  aqiInput.value = String(editAqi)
  const category = aqiCategory(editAqi)
  valueCategory.textContent = category
  valueCategory.style.background = colorCss(editAqi, 0.22)
  valueCategory.style.color = editAqi >= 200 ? '#5b1730' : '#344a28'
  updateEditorButtons()
}

function updateInfluenceUi() {
  for (const button of influenceButtons) {
    const isActive = button.dataset.influence === influence
    button.classList.toggle('active', isActive)
    button.setAttribute('aria-pressed', String(isActive))
  }
}

const cloneMeasurements = () =>
  measurements.map(measurement => ({...measurement}))

const saveState = () => {
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      const center = map.getCenter()
      const state: SavedAirMapStateV2 = {
        version: 2,
        measurements,
        view: {
          lat: center.lat,
          lng: wrapLongitude(center.lng),
          zoom: map.getZoom(),
        },
        controls: {aqi: editAqi, influence, connect: connectMode},
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      if (migratedLegacyState) {
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        migratedLegacyState = false
      }
    } catch {
      statusMessage.textContent =
        'This browser could not save more place readings. Remove one and try again.'
    }
  }, 120)
}

const refreshAfterEdit = () => {
  airLayer.redraw()
  updateNamedPlaceMarkers()
  refreshSelectedLocation()
  updateHistoryButtons()
  saveState()
}

const beginHistoryChange = () => {
  undoStack.push(cloneMeasurements())
  if (undoStack.length > 100) undoStack = undoStack.slice(-100)
  redoStack = []
}

const restoreSnapshot = (snapshot: CityMeasurement[]) => {
  measurements = snapshot.map(measurement => ({...measurement}))
  refreshAfterEdit()
}

const readGeocodeCache = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || '{}')
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, GeocodeResult[]>)
      : {}
  } catch {
    return {}
  }
}

const writeGeocodeCache = (
  cache: Record<string, GeocodeResult[]>,
  query: string,
  results: GeocodeResult[],
) => {
  try {
    const entries = Object.entries({...cache, [query]: results}).slice(-40)
    localStorage.setItem(
      GEOCODE_CACHE_KEY,
      JSON.stringify(Object.fromEntries(entries)),
    )
  } catch {
    // Search remains available when its optional cache is unavailable.
  }
}

const isGeocodeResult = (value: unknown): value is GeocodeResult => {
  if (!value || typeof value !== 'object') return false
  const result = value as Partial<GeocodeResult>
  return (
    typeof result.place_id === 'number' &&
    typeof result.display_name === 'string' &&
    typeof result.lat === 'string' &&
    typeof result.lon === 'string' &&
    Number.isFinite(Number(result.lat)) &&
    Number.isFinite(Number(result.lon))
  )
}

const geocoderRequest = async (url: URL) => {
  if (geocoderBusy) throw new Error('busy')
  geocoderBusy = true
  searchButton.disabled = true
  try {
    const delay = Math.max(0, 1050 - (Date.now() - lastGeocoderRequest))
    if (delay > 0) {
      await new Promise(resolve => window.setTimeout(resolve, delay))
    }
    lastGeocoderRequest = Date.now()
    const response = await fetch(url, {
      headers: {Accept: 'application/json'},
    })
    if (!response.ok)
      throw new Error(`Place search failed (${response.status})`)
    return await response.json()
  } finally {
    geocoderBusy = false
    searchButton.disabled = false
  }
}

const resultToNamedPlace = (
  result: GeocodeResult,
  preferMunicipality = false,
): NamedPlace => {
  const address = result.address ?? {}
  const municipalityName =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.hamlet
  const name =
    (preferMunicipality ? municipalityName : undefined) ||
    result.namedetails?.name ||
    result.name ||
    municipalityName ||
    result.display_name.split(',')[0]?.trim() ||
    'Named place'
  const stableId =
    result.osm_type && typeof result.osm_id === 'number'
      ? `${result.osm_type}:${result.osm_id}`
      : `nominatim:${result.place_id}`
  return {
    id: stableId,
    name,
    displayName: result.display_name,
    lat: Number(result.lat),
    lng: wrapLongitude(Number(result.lon)),
  }
}

const showSearchResults = (results: GeocodeResult[]) => {
  searchResults.replaceChildren()
  if (results.length === 0) {
    const message = document.createElement('p')
    message.textContent = 'No named places matched that search.'
    searchResults.append(message)
    return
  }

  for (const result of results.slice(0, 8)) {
    const place = resultToNamedPlace(result)
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = result.display_name
    button.addEventListener('click', () => selectNamedPlace(place))
    searchResults.append(button)
  }
}

const searchForPlace = async (query: string) => {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
  if (normalizedQuery.length < 2) {
    statusMessage.textContent = 'Type at least two letters of a place name.'
    return
  }

  const cache = readGeocodeCache()
  const cached = cache[normalizedQuery]
  if (Array.isArray(cached) && cached.every(isGeocodeResult)) {
    showSearchResults(cached)
    statusMessage.textContent = `Choose the correct match for “${query.trim()}”.`
    return
  }

  if (geocoderBusy) {
    statusMessage.textContent =
      'Please wait for the current place search to finish.'
    return
  }

  searchResults.replaceChildren()
  statusMessage.textContent = `Searching OpenStreetMap for “${query.trim()}”…`
  const url = new URL('/search', GEOCODER_URL)
  url.searchParams.set('q', query.trim())
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('namedetails', '1')
  url.searchParams.set('limit', '8')
  url.searchParams.set('accept-language', navigator.languages.join(','))

  try {
    const data = await geocoderRequest(url)
    const results = Array.isArray(data) ? data.filter(isGeocodeResult) : []
    writeGeocodeCache(cache, normalizedQuery, results)
    showSearchResults(results)
    statusMessage.textContent =
      results.length > 0
        ? `Choose the correct match for “${query.trim()}”.`
        : `No named places matched “${query.trim()}”.`
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error && error.message === 'busy'
        ? 'Please wait for the current place search to finish.'
        : 'Worldwide place search is temporarily unavailable. Try again shortly.'
  }
}

const reverseLookup = async (lat: number, lng: number) => {
  if (geocoderBusy) {
    statusMessage.textContent =
      'Please wait for the current place search, then tap the city again.'
    return
  }
  const requestToken = ++geocodeRequestToken
  const url = new URL('/reverse', GEOCODER_URL)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(wrapLongitude(lng)))
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('namedetails', '1')
  url.searchParams.set('zoom', '18')
  url.searchParams.set('accept-language', navigator.languages.join(','))
  try {
    const data = await geocoderRequest(url)
    if (requestToken !== geocodeRequestToken || !isGeocodeResult(data)) return
    selectNamedPlace(resultToNamedPlace(data), false)
  } catch {
    statusMessage.textContent =
      'That place name could not be loaded. Try searching for it instead.'
  }
}

map.on('click', (event: LeafletMouseEvent) => {
  if (presentationMode) return
  const {lat, lng} = event.latlng
  const coordinatePlace: NamedPlace = {
    id: `coordinate:${lat.toFixed(5)}:${wrapLongitude(lng).toFixed(5)}`,
    name: `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(
      wrapLongitude(lng),
    ).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`,
    displayName: 'Selected map location',
    lat,
    lng: wrapLongitude(lng),
  }
  inspectLocation(coordinatePlace, false)
  statusMessage.textContent = 'Looking up the nearest named place…'
  void reverseLookup(lat, lng)
})

map.on('moveend zoomend', saveState)

placeSearchForm.addEventListener('submit', event => {
  event.preventDefault()
  void searchForPlace(placeInput.value)
})

const nearestMeasurementTo = (place: NamedPlace) => {
  let nearest: CityMeasurement | undefined
  let nearestDistance = Number.POSITIVE_INFINITY
  for (const measurement of measurements) {
    if (measurement.id === place.id) continue
    const distance = haversineDistance(place, measurement)
    if (distance < nearestDistance) {
      nearest = measurement
      nearestDistance = distance
    }
  }
  return nearest
}

saveLocationButton.addEventListener('click', () => {
  if (!selectedLocation || !selectionResolved) return
  beginHistoryChange()
  const destination = connectMode
    ? nearestMeasurementTo(selectedLocation)
    : undefined
  const measurement: CityMeasurement = {
    ...selectedLocation,
    aqi: editAqi,
    radiusMeters: INFLUENCE_RADIUS_METERS[influence],
    updatedAt: Date.now(),
    connectToId: destination?.id,
  }
  const existingIndex = measurements.findIndex(
    candidate => candidate.id === measurement.id,
  )
  if (existingIndex >= 0) measurements[existingIndex] = measurement
  else {
    if (measurements.length >= MAX_MEASUREMENTS)
      measurements = measurements.slice(1)
    measurements.push(measurement)
  }
  statusMessage.textContent = `${measurement.name} is now ${editAqi} AQI (${aqiCategory(
    editAqi,
  )}) with a ${influence} influence area${
    destination ? ` connected to ${destination.name}` : ''
  }.`
  refreshAfterEdit()
  setPresentationMode(true)
  map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, {
    animate: !prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : 1.35,
  })
})

removeLocationButton.addEventListener('click', () => {
  const measurement = selectedMeasurement()
  if (!measurement) return
  beginHistoryChange()
  measurements = measurements.filter(
    candidate => candidate.id !== measurement.id,
  )
  measurements = measurements.map(candidate =>
    candidate.connectToId === measurement.id
      ? {...candidate, connectToId: undefined}
      : candidate,
  )
  statusMessage.textContent = `${measurement.name}'s reading was removed.`
  refreshAfterEdit()
})

aqiInput.addEventListener('change', () => {
  updateValueUi()
  saveState()
})
aqiInput.addEventListener('input', () => {
  if (aqiInput.value !== '') updateValueUi()
})
aqiInput.addEventListener('blur', updateValueUi)

decreaseButton.addEventListener('click', () => {
  aqiInput.value = String(clampAqi(editAqi - 10))
  updateValueUi()
  saveState()
})

increaseButton.addEventListener('click', () => {
  aqiInput.value = String(clampAqi(editAqi + 10))
  updateValueUi()
  saveState()
})

for (const button of influenceButtons) {
  button.addEventListener('click', () => {
    const nextInfluence = button.dataset.influence
    if (!isInfluenceSize(nextInfluence)) return
    influence = nextInfluence
    updateInfluenceUi()
    saveState()
  })
}

connectCheckbox.addEventListener('change', () => {
  connectMode = connectCheckbox.checked
  saveState()
})

undoButton.addEventListener('click', () => {
  const snapshot = undoStack.pop()
  if (!snapshot) return
  redoStack.push(cloneMeasurements())
  restoreSnapshot(snapshot)
  statusMessage.textContent = 'Undid the most recent place change.'
})

redoButton.addEventListener('click', () => {
  const snapshot = redoStack.pop()
  if (!snapshot) return
  undoStack.push(cloneMeasurements())
  restoreSnapshot(snapshot)
  statusMessage.textContent = 'Restored the most recent place change.'
})

resetButton.addEventListener('click', () => {
  if (
    !window.confirm(
      'Reset every named place and the entire world to AQI 50? This cannot be undone.',
    )
  ) {
    return
  }
  measurements = []
  undoStack = []
  redoStack = []
  selectedLocation = null
  selectionResolved = false
  editAqi = DEFAULT_AQI
  influence = 'medium'
  connectMode = false
  connectCheckbox.checked = false
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  window.clearTimeout(saveTimer)
  saveTimer = 0
  aqiInput.value = String(DEFAULT_AQI)
  updateValueUi()
  updateInfluenceUi()
  selectedName.textContent = 'Choose any named place'
  selectedValue.textContent = String(BASELINE_AQI)
  selectedCategory.textContent = 'Good'
  selectedSwatch.style.background = colorCss(BASELINE_AQI)
  statusMessage.textContent = 'The world has been reset to AQI 50.'
  airLayer.redraw()
  updateNamedPlaceMarkers()
  updateHistoryButtons()
})

zoomInButton.addEventListener('click', () =>
  map.setZoom(map.getZoom() + 1, {animate: !prefersReducedMotion}),
)
zoomOutButton.addEventListener('click', () =>
  map.setZoom(map.getZoom() - 1, {animate: !prefersReducedMotion}),
)
worldButton.addEventListener('click', () =>
  map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, {
    animate: !prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : 1.35,
  }),
)

const setPresentationMode = (presenting: boolean) => {
  presentationMode = presenting
  shellElement.classList.toggle('is-presenting', presenting)
  controlPanel.toggleAttribute('inert', presenting)
  controlPanel.setAttribute('aria-hidden', String(presenting))
  editMapButton.hidden = !presenting
  if (presenting) {
    if (map.hasLayer(numberLayer)) numberLayer.remove()
    window.setTimeout(() => editMapButton.focus({preventScroll: true}), 0)
  } else {
    if (!map.hasLayer(numberLayer)) numberLayer.addTo(map)
    numberLayer.redraw()
    placeInput.focus({preventScroll: true})
  }
}

editMapButton.addEventListener('click', () => setPresentationMode(false))

aqiInput.value = String(editAqi)
connectCheckbox.checked = connectMode
updateValueUi()
updateInfluenceUi()
updateHistoryButtons()
updateNamedPlaceMarkers()

fetch(LAND_URL)
  .then(response => {
    if (!response.ok) throw new Error('Land geometry failed to load')
    return response.json()
  })
  .then(data => {
    landData = data
    landPathCache.clear()
    airLayer.redraw()
  })
  .catch(() => {
    statusMessage.textContent =
      'The air-quality land layer could not load, but the map can still be explored.'
  })

fetch(POPULATED_PLACES_URL)
  .then(response => {
    if (!response.ok) throw new Error('Named places failed to load')
    return response.json()
  })
  .then(data => {
    labelPlaces = (Array.isArray(data?.features) ? data.features : [])
      .map((feature: any): LabelPlace | null => {
        const coordinates = feature?.geometry?.coordinates
        const name = feature?.properties?.name
        const neId = feature?.properties?.ne_id
        if (
          feature?.geometry?.type !== 'Point' ||
          !Array.isArray(coordinates) ||
          !Number.isFinite(coordinates[0]) ||
          !Number.isFinite(coordinates[1]) ||
          typeof name !== 'string'
        ) {
          return null
        }
        return {
          id: `natural-earth:${String(neId ?? name)}`,
          name,
          displayName: name,
          lat: coordinates[1],
          lng: coordinates[0],
          minZoom: Number.isFinite(feature?.properties?.min_zoom)
            ? feature.properties.min_zoom
            : 9,
        }
      })
      .filter((place: LabelPlace | null): place is LabelPlace => Boolean(place))
    numberLayer.redraw()
    statusMessage.textContent = `${labelPlaces.length.toLocaleString()} named places are ready at AQI 50. Search or tap to change one.`
  })
  .catch(() => {
    statusMessage.textContent =
      'The built-in place-number layer could not load. Search and editing still work.'
  })

tileLayer.on('load', () => {
  if (measurements.length > 0) {
    statusMessage.textContent = `${measurements.length} saved place ${
      measurements.length === 1 ? 'reading' : 'readings'
    } restored.`
  }
})

if (savedState) saveState()
