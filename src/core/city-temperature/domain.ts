export const MIN_TEMPERATURE = -100
export const MAX_TEMPERATURE = 164
export const MAX_CITIES = 100
export const MAX_CONNECTIONS = 500
export const MAX_CITY_NAME_LENGTH = 80

export type ClimateMode = 'heater' | 'normal' | 'air-conditioner'
export type PaidFeature = 'heater' | 'connections'

export interface Position {
  x: number
  y: number
}

export interface City {
  id: string
  name: string
  position: Position
  temperatures: Record<ClimateMode, number>
}

export interface Connection {
  id: string
  fromCityId: string
  toCityId: string
}

export interface MapState {
  activeMode: ClimateMode
  cities: City[]
  connections: Connection[]
}

export interface FeatureEntitlements {
  heater: boolean
  connections: boolean
}

export interface TemperaturePresentation {
  color: string
  fireOpacity: number
}

export interface ValidationResult {
  ok: boolean
  state?: MapState
  errors: string[]
}

export const DEFAULT_TEMPERATURES: Record<ClimateMode, number> = {
  heater: 80,
  normal: 70,
  'air-conditioner': 60,
}

export const EMPTY_MAP_STATE: MapState = {
  activeMode: 'normal',
  cities: [],
  connections: [],
}

const CLIMATE_MODES = new Set<ClimateMode>([
  'heater',
  'normal',
  'air-conditioner',
])

const TEMPERATURE_STOPS = [
  {temperature: -100, color: [0, 0, 0]},
  {temperature: -40, color: [0, 0, 128]},
  {temperature: 0, color: [0, 0, 255]},
  {temperature: 30, color: [0, 255, 255]},
  {temperature: 60, color: [0, 255, 0]},
  {temperature: 70, color: [255, 255, 0]},
  {temperature: 80, color: [255, 128, 0]},
  {temperature: 100, color: [255, 0, 0]},
  {temperature: 130, color: [100, 0, 0]},
  {temperature: 160, color: [0, 0, 0]},
] as const

export function createEmptyMapState(): MapState {
  return {
    activeMode: 'normal',
    cities: [],
    connections: [],
  }
}

export function getCityTemperature(city: City, mode: ClimateMode): number {
  return city.temperatures[mode]
}

export function getTemperaturePresentation(
  temperature: number,
): TemperaturePresentation {
  const clamped = Math.max(
    MIN_TEMPERATURE,
    Math.min(MAX_TEMPERATURE, temperature),
  )

  if (clamped >= 160) {
    return {
      color: 'rgb(0, 0, 0)',
      fireOpacity: (clamped - 160) / 4,
    }
  }

  let lower: (typeof TEMPERATURE_STOPS)[number] = TEMPERATURE_STOPS[0]
  let upper: (typeof TEMPERATURE_STOPS)[number] =
    TEMPERATURE_STOPS[TEMPERATURE_STOPS.length - 1]

  for (let index = 0; index < TEMPERATURE_STOPS.length - 1; index += 1) {
    const candidate = TEMPERATURE_STOPS[index]
    const next = TEMPERATURE_STOPS[index + 1]
    if (clamped >= candidate.temperature && clamped <= next.temperature) {
      lower = candidate
      upper = next
      break
    }
  }

  const range = upper.temperature - lower.temperature
  const ratio = range === 0 ? 0 : (clamped - lower.temperature) / range
  const channels = lower.color.map((channel, index) =>
    Math.round(channel + (upper.color[index] - channel) * ratio),
  )

  return {
    color: `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`,
    fireOpacity: 0,
  }
}

export function temperaturesAreOrdered(
  temperatures: Record<ClimateMode, number>,
): boolean {
  return (
    temperatures.heater > temperatures.normal &&
    temperatures.normal > temperatures['air-conditioner']
  )
}

export function mapsAreEqual(first: MapState, second: MapState): boolean {
  return JSON.stringify(first) === JSON.stringify(second)
}

export function mapHasContent(state: MapState): boolean {
  return state.cities.length > 0 || state.connections.length > 0
}

export function validateMapState(
  candidate: unknown,
  entitlements: FeatureEntitlements = {heater: true, connections: true},
): ValidationResult {
  const errors: string[] = []
  if (!candidate || typeof candidate !== 'object') {
    return {ok: false, errors: ['Map state must be an object.']}
  }

  const source = candidate as Partial<MapState>
  if (!CLIMATE_MODES.has(source.activeMode as ClimateMode)) {
    errors.push('The selected climate mode is invalid.')
  }

  if (source.activeMode === 'heater' && !entitlements.heater) {
    errors.push('Heater mode requires the Heater purchase.')
  }

  if (!Array.isArray(source.cities)) {
    errors.push('Cities must be an array.')
  } else if (source.cities.length > MAX_CITIES) {
    errors.push(`A map can contain at most ${MAX_CITIES} cities.`)
  }

  if (!Array.isArray(source.connections)) {
    errors.push('Connections must be an array.')
  } else if (source.connections.length > MAX_CONNECTIONS) {
    errors.push(`A map can contain at most ${MAX_CONNECTIONS} connections.`)
  } else if (source.connections.length > 0 && !entitlements.connections) {
    errors.push('Connection lines require the Connect Lines purchase.')
  }

  if (errors.length > 0) return {ok: false, errors}

  const cities = source.cities as City[]
  const connections = source.connections as Connection[]
  const cityIds = new Set<string>()

  cities.forEach((city, index) => {
    const prefix = `City ${index + 1}`
    if (!city || typeof city !== 'object') {
      errors.push(`${prefix} is invalid.`)
      return
    }

    if (
      typeof city.id !== 'string' ||
      city.id.length < 1 ||
      city.id.length > 80 ||
      !/^[A-Za-z0-9_-]+$/.test(city.id)
    ) {
      errors.push(`${prefix} has an invalid ID.`)
    } else if (cityIds.has(city.id)) {
      errors.push(`${prefix} has a duplicate ID.`)
    } else {
      cityIds.add(city.id)
    }

    const name = typeof city.name === 'string' ? city.name.trim() : ''
    if (!name || name.length > MAX_CITY_NAME_LENGTH) {
      errors.push(
        `${prefix} needs a name between 1 and ${MAX_CITY_NAME_LENGTH} characters.`,
      )
    }

    if (
      !city.position ||
      !Number.isFinite(city.position.x) ||
      !Number.isFinite(city.position.y) ||
      city.position.x < 0 ||
      city.position.x > 100 ||
      city.position.y < 0 ||
      city.position.y > 100
    ) {
      errors.push(`${prefix} has an invalid map position.`)
    }

    const temperatures = city.temperatures
    if (!temperatures || typeof temperatures !== 'object') {
      errors.push(`${prefix} needs three temperatures.`)
      return
    }

    for (const mode of CLIMATE_MODES) {
      const value = temperatures[mode]
      if (
        !Number.isInteger(value) ||
        value < MIN_TEMPERATURE ||
        value > MAX_TEMPERATURE
      ) {
        errors.push(
          `${prefix}'s ${mode} temperature must be a whole number from ${MIN_TEMPERATURE} to ${MAX_TEMPERATURE}.`,
        )
      }
    }

    if (!temperaturesAreOrdered(temperatures)) {
      errors.push(
        `${prefix} must have Heater warmer than Normal and Normal warmer than Air Conditioner.`,
      )
    }
  })

  const connectionIds = new Set<string>()
  const pairs = new Set<string>()
  connections.forEach((connection, index) => {
    const prefix = `Connection ${index + 1}`
    if (!connection || typeof connection !== 'object') {
      errors.push(`${prefix} is invalid.`)
      return
    }

    if (
      typeof connection.id !== 'string' ||
      connection.id.length < 1 ||
      connection.id.length > 80 ||
      connectionIds.has(connection.id)
    ) {
      errors.push(`${prefix} has an invalid or duplicate ID.`)
    } else {
      connectionIds.add(connection.id)
    }

    if (
      !cityIds.has(connection.fromCityId) ||
      !cityIds.has(connection.toCityId)
    ) {
      errors.push(`${prefix} refers to a city that does not exist.`)
      return
    }

    if (connection.fromCityId === connection.toCityId) {
      errors.push(`${prefix} cannot connect a city to itself.`)
      return
    }

    const pair = [connection.fromCityId, connection.toCityId].sort().join(':')
    if (pairs.has(pair)) errors.push(`${prefix} duplicates another connection.`)
    pairs.add(pair)
  })

  if (errors.length > 0) return {ok: false, errors}

  return {
    ok: true,
    errors: [],
    state: {
      activeMode: source.activeMode as ClimateMode,
      cities: cities.map(city => ({
        id: city.id,
        name: city.name.trim(),
        position: {x: city.position.x, y: city.position.y},
        temperatures: {
          heater: city.temperatures.heater,
          normal: city.temperatures.normal,
          'air-conditioner': city.temperatures['air-conditioner'],
        },
      })),
      connections: connections.map(connection => ({...connection})),
    },
  }
}
