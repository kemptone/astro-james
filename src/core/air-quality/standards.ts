export type AirQualityBand = {
  min: number
  max: number
  label: string
  color: string
  textColor: string
  advice: string
}

export type AirQualityStandard = {
  id: string
  country: string
  flag: string
  indexName: string
  unit: string
  min: number
  max: number
  step: number
  sourceUrl: string
  note: string
  bands: readonly AirQualityBand[]
}

const goodAdvice = 'Enjoy your usual outdoor activities.'

export const airQualityStandards: readonly AirQualityStandard[] = [
  {
    id: 'mexico',
    country: 'Mexico',
    flag: '🇲🇽',
    indexName: 'Air and Health Index',
    unit: 'category level',
    min: 1,
    max: 5,
    step: 1,
    sourceUrl: 'https://sidof.segob.gob.mx/notas/docFuente/5715154',
    note: 'Mexico reports the worst category found among its monitored pollutants. This game uses levels 1–5 to let a fantasy place choose those categories.',
    bands: [
      {
        min: 1,
        max: 1,
        label: 'Good',
        color: '#2e9b50',
        textColor: '#ffffff',
        advice: goodAdvice,
      },
      {
        min: 2,
        max: 2,
        label: 'Acceptable',
        color: '#f4d03f',
        textColor: '#292300',
        advice: 'The air quality is okay. Outdoor activities are fine.',
      },
      {
        min: 3,
        max: 3,
        label: 'Poor',
        color: '#f28c28',
        textColor: '#2b1700',
        advice:
          'Reduce hard outdoor activity. Sensitive people should consider a well-fitting mask.',
      },
      {
        min: 4,
        max: 4,
        label: 'Very poor',
        color: '#dc3545',
        textColor: '#ffffff',
        advice: 'Everyone should remain indoors when possible.',
      },
      {
        min: 5,
        max: 5,
        label: 'Extremely poor',
        color: '#7b2f88',
        textColor: '#ffffff',
        advice: 'Remain indoors and reschedule outdoor activities.',
      },
    ],
  },
  {
    id: 'spain',
    country: 'Spain',
    flag: '🇪🇸',
    indexName: 'European Air Quality Index',
    unit: 'category level',
    min: 1,
    max: 6,
    step: 1,
    sourceUrl: 'https://airindex.eea.europa.eu/AQI/',
    note: 'Spain uses the European index. Its official category comes from the poorest result among measured pollutants; this game represents the six categories as levels 1–6.',
    bands: [
      {
        min: 1,
        max: 1,
        label: 'Good',
        color: '#4cc98a',
        textColor: '#062a1c',
        advice: goodAdvice,
      },
      {
        min: 2,
        max: 2,
        label: 'Fair',
        color: '#74d3c2',
        textColor: '#07352c',
        advice: goodAdvice,
      },
      {
        min: 3,
        max: 3,
        label: 'Moderate',
        color: '#f2db5b',
        textColor: '#2e2800',
        advice:
          'Enjoy outdoor activities. Sensitive people can reduce intense activity if symptoms occur.',
      },
      {
        min: 4,
        max: 4,
        label: 'Poor',
        color: '#ee984b',
        textColor: '#321900',
        advice: 'Consider reducing intense outdoor activity if symptoms occur.',
      },
      {
        min: 5,
        max: 5,
        label: 'Very poor',
        color: '#de5b75',
        textColor: '#ffffff',
        advice: 'Reduce physical activity, especially outdoors.',
      },
      {
        min: 6,
        max: 6,
        label: 'Extremely poor',
        color: '#7c3b83',
        textColor: '#ffffff',
        advice: 'Avoid physical activity outdoors.',
      },
    ],
  },
  {
    id: 'singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    indexName: 'Pollutant Standards Index (PSI)',
    unit: 'PSI',
    min: 0,
    max: 500,
    step: 1,
    sourceUrl:
      'https://www.nea.gov.sg/our-services/pollution-control/air-pollution/faqs',
    note: 'Singapore officially calls values over 300 Hazardous. The game also describes that final band as extremely unhealthy.',
    bands: [
      {
        min: 0,
        max: 50,
        label: 'Good',
        color: '#34a853',
        textColor: '#ffffff',
        advice: goodAdvice,
      },
      {
        min: 51,
        max: 100,
        label: 'Moderate',
        color: '#f3d33b',
        textColor: '#2b2500',
        advice: 'Normal activities are okay.',
      },
      {
        min: 101,
        max: 200,
        label: 'Unhealthy',
        color: '#ef8b2c',
        textColor: '#2d1700',
        advice: 'Reduce prolonged or strenuous outdoor activity.',
      },
      {
        min: 201,
        max: 300,
        label: 'Very unhealthy',
        color: '#d83b4c',
        textColor: '#ffffff',
        advice: 'Avoid prolonged or strenuous outdoor activity.',
      },
      {
        min: 301,
        max: 500,
        label: 'Extremely unhealthy',
        color: '#742d82',
        textColor: '#ffffff',
        advice: 'Minimize outdoor activity and remain indoors when possible.',
      },
    ],
  },
  {
    id: 'belgium',
    country: 'Belgium',
    flag: '🇧🇪',
    indexName: 'BelAQI',
    unit: 'BelAQI',
    min: 1,
    max: 10,
    step: 1,
    sourceUrl:
      'https://www.irceline.be/en/air-quality/measurements/belaqi-air-quality-index/information',
    note: 'BelAQI is a 1–10 scale. The global result is the highest sub-index among the measured pollutants.',
    bands: [
      {
        min: 1,
        max: 1,
        label: 'Excellent',
        color: '#2e9b50',
        textColor: '#ffffff',
        advice: goodAdvice,
      },
      {
        min: 2,
        max: 2,
        label: 'Very good',
        color: '#55b95f',
        textColor: '#102d15',
        advice: goodAdvice,
      },
      {
        min: 3,
        max: 3,
        label: 'Good',
        color: '#8bcf66',
        textColor: '#183016',
        advice: goodAdvice,
      },
      {
        min: 4,
        max: 4,
        label: 'Fairly good',
        color: '#c9dc61',
        textColor: '#283000',
        advice: goodAdvice,
      },
      {
        min: 5,
        max: 5,
        label: 'Moderate',
        color: '#f2d34f',
        textColor: '#2b2500',
        advice: 'Sensitive people should watch for symptoms outdoors.',
      },
      {
        min: 6,
        max: 6,
        label: 'Poor',
        color: '#f5aa42',
        textColor: '#301c00',
        advice: 'Reduce prolonged or intense outdoor activity.',
      },
      {
        min: 7,
        max: 7,
        label: 'Very poor',
        color: '#ed7d31',
        textColor: '#331600',
        advice: 'Limit physical activity outdoors.',
      },
      {
        min: 8,
        max: 8,
        label: 'Bad',
        color: '#df4b45',
        textColor: '#ffffff',
        advice: 'Avoid prolonged outdoor activity.',
      },
      {
        min: 9,
        max: 9,
        label: 'Very bad',
        color: '#aa3f74',
        textColor: '#ffffff',
        advice: 'Avoid outdoor activity and stay inside when possible.',
      },
      {
        min: 10,
        max: 10,
        label: 'Horrible',
        color: '#652b70',
        textColor: '#ffffff',
        advice: 'Remain indoors and reschedule outdoor activities.',
      },
    ],
  },
  {
    id: 'netherlands',
    country: 'Netherlands',
    flag: '🇳🇱',
    indexName: 'Air Quality Index (LKI)',
    unit: 'LKI',
    min: 1,
    max: 11,
    step: 1,
    sourceUrl: 'https://www.rivm.nl/lucht/luchtkwaliteit-Nederland',
    note: 'The Dutch LKI runs from 1 (little air pollution) to 11 (a lot of air pollution).',
    bands: [
      {
        min: 1,
        max: 3,
        label: 'Good',
        color: '#3f8edb',
        textColor: '#ffffff',
        advice: goodAdvice,
      },
      {
        min: 4,
        max: 6,
        label: 'Moderate',
        color: '#f1d44f',
        textColor: '#2b2500',
        advice:
          'Outdoor activities are okay; sensitive people should notice symptoms.',
      },
      {
        min: 7,
        max: 8,
        label: 'Insufficient',
        color: '#ed9238',
        textColor: '#311900',
        advice: 'Sensitive people should reduce outdoor exertion.',
      },
      {
        min: 9,
        max: 10,
        label: 'Poor',
        color: '#db454d',
        textColor: '#ffffff',
        advice: 'Limit prolonged or intense outdoor activity.',
      },
      {
        min: 11,
        max: 11,
        label: 'Very poor',
        color: '#762d82',
        textColor: '#ffffff',
        advice: 'Avoid outdoor exertion and remain indoors when possible.',
      },
    ],
  },
  {
    id: 'united-states',
    country: 'United States',
    flag: '🇺🇸',
    indexName: 'Air Quality Index (AQI)',
    unit: 'AQI',
    min: 0,
    max: 500,
    step: 1,
    sourceUrl:
      'https://www.epa.gov/outdoor-air-quality-data/about-airdata-reports',
    note: 'The U.S. AQI has six health-concern categories from 0 to 500.',
    bands: [
      {
        min: 0,
        max: 50,
        label: 'Good',
        color: '#00a651',
        textColor: '#ffffff',
        advice: goodAdvice,
      },
      {
        min: 51,
        max: 100,
        label: 'Moderate',
        color: '#f5d328',
        textColor: '#2a2300',
        advice:
          'Outdoor activity is okay; unusually sensitive people can reduce heavy exertion.',
      },
      {
        min: 101,
        max: 150,
        label: 'Unhealthy for sensitive groups',
        color: '#f7941d',
        textColor: '#321700',
        advice:
          'Sensitive groups should reduce prolonged or heavy outdoor exertion.',
      },
      {
        min: 151,
        max: 200,
        label: 'Unhealthy',
        color: '#ed1c24',
        textColor: '#ffffff',
        advice: 'Everyone should reduce prolonged outdoor exertion.',
      },
      {
        min: 201,
        max: 300,
        label: 'Very unhealthy',
        color: '#8f3f97',
        textColor: '#ffffff',
        advice: 'Avoid outdoor exertion; stay indoors when possible.',
      },
      {
        min: 301,
        max: 500,
        label: 'Hazardous',
        color: '#7e0023',
        textColor: '#ffffff',
        advice: 'Remain indoors and avoid outdoor activity.',
      },
    ],
  },
  {
    id: 'united-kingdom',
    country: 'United Kingdom',
    flag: '🇬🇧',
    indexName: 'Daily Air Quality Index (DAQI)',
    unit: 'DAQI',
    min: 1,
    max: 10,
    step: 1,
    sourceUrl:
      'https://www.gov.uk/government/publications/health-effects-of-air-pollution/using-the-daily-air-quality-index-daqi',
    note: 'The UK DAQI uses ten points grouped into four health-advice bands.',
    bands: [
      {
        min: 1,
        max: 3,
        label: 'Low',
        color: '#48a957',
        textColor: '#ffffff',
        advice: goodAdvice,
      },
      {
        min: 4,
        max: 6,
        label: 'Moderate',
        color: '#f0d33f',
        textColor: '#2b2500',
        advice: 'Sensitive people should reduce activity if symptoms occur.',
      },
      {
        min: 7,
        max: 9,
        label: 'High',
        color: '#df4c3f',
        textColor: '#ffffff',
        advice:
          'Sensitive people should reduce outdoor exertion; others should notice symptoms.',
      },
      {
        min: 10,
        max: 10,
        label: 'Very high',
        color: '#70307d',
        textColor: '#ffffff',
        advice:
          'Reduce outdoor exertion; sensitive people should avoid strenuous activity.',
      },
    ],
  },
  {
    id: 'india',
    country: 'India',
    flag: '🇮🇳',
    indexName: 'National Air Quality Index',
    unit: 'AQI',
    min: 0,
    max: 500,
    step: 1,
    sourceUrl: 'https://cpcb.nic.in/manual-monitoring/NAQI-FEB-DATA.pdf',
    note: 'India reports six National AQI categories on a 0–500 scale.',
    bands: [
      {
        min: 0,
        max: 50,
        label: 'Good',
        color: '#2f9e44',
        textColor: '#ffffff',
        advice: goodAdvice,
      },
      {
        min: 51,
        max: 100,
        label: 'Satisfactory',
        color: '#7ac943',
        textColor: '#173000',
        advice: 'Outdoor activities are generally okay.',
      },
      {
        min: 101,
        max: 200,
        label: 'Moderate',
        color: '#f0d43a',
        textColor: '#2b2500',
        advice:
          'People with lung or heart conditions should reduce prolonged exertion.',
      },
      {
        min: 201,
        max: 300,
        label: 'Poor',
        color: '#ed9137',
        textColor: '#321900',
        advice: 'Reduce prolonged outdoor activity.',
      },
      {
        min: 301,
        max: 400,
        label: 'Very poor',
        color: '#d9444e',
        textColor: '#ffffff',
        advice: 'Avoid outdoor exertion and stay indoors when possible.',
      },
      {
        min: 401,
        max: 500,
        label: 'Severe',
        color: '#722d7c',
        textColor: '#ffffff',
        advice: 'Remain indoors and avoid outdoor activity.',
      },
    ],
  },
  {
    id: 'south-korea',
    country: 'South Korea',
    flag: '🇰🇷',
    indexName: 'Comprehensive Air-quality Index (CAI)',
    unit: 'CAI',
    min: 0,
    max: 500,
    step: 1,
    sourceUrl: 'https://airkorea.or.kr/eng/khaiInfo?pMENU_NO=166',
    note: 'South Korea groups its 0–500 CAI into four categories.',
    bands: [
      {
        min: 0,
        max: 50,
        label: 'Good',
        color: '#3977d5',
        textColor: '#ffffff',
        advice: goodAdvice,
      },
      {
        min: 51,
        max: 100,
        label: 'Moderate',
        color: '#43a653',
        textColor: '#ffffff',
        advice: 'Normal outdoor activities are okay.',
      },
      {
        min: 101,
        max: 250,
        label: 'Unhealthy',
        color: '#f0cf35',
        textColor: '#2b2500',
        advice: 'Sensitive groups should reduce or avoid outdoor activity.',
      },
      {
        min: 251,
        max: 500,
        label: 'Very unhealthy',
        color: '#d93e47',
        textColor: '#ffffff',
        advice: 'Move activities indoors and avoid outdoor exertion.',
      },
    ],
  },
]

export const defaultAirQualityStandardId = 'mexico'

export const initialFantasyAirQualityPlaces = [
  {id: 'wrockley', name: 'Wrockley', standardId: 'mexico', value: 2},
  {id: 'kufty', name: 'Kufty', standardId: 'spain', value: 3},
  {id: 'mormage', name: 'Mormage', standardId: 'singapore', value: 165},
  {id: 'parad', name: 'Parad', standardId: 'belgium', value: 7},
  {id: 'veldora', name: 'Veldora', standardId: 'netherlands', value: 9},
] as const

export function getAirQualityStandard(id: string) {
  return (
    airQualityStandards.find(standard => standard.id === id) ||
    airQualityStandards[0]
  )
}

export function clampAirQualityValue(
  standard: AirQualityStandard,
  value: number,
) {
  const finiteValue = Number.isFinite(value) ? value : standard.min
  const clamped = Math.min(standard.max, Math.max(standard.min, finiteValue))
  const stepsFromMinimum = Math.round((clamped - standard.min) / standard.step)
  return Number((standard.min + stepsFromMinimum * standard.step).toFixed(6))
}

export function getAirQualityBand(standard: AirQualityStandard, value: number) {
  const safeValue = clampAirQualityValue(standard, value)
  return (
    standard.bands.find(
      band => safeValue >= band.min && safeValue <= band.max,
    ) || standard.bands[standard.bands.length - 1]
  )
}

export function getAirQualityPercentage(
  standard: AirQualityStandard,
  value: number,
) {
  const safeValue = clampAirQualityValue(standard, value)
  if (standard.max === standard.min) return 0
  return ((safeValue - standard.min) / (standard.max - standard.min)) * 100
}

export function formatAirQualityRange(band: AirQualityBand) {
  return band.min === band.max ? `${band.min}` : `${band.min}–${band.max}`
}

export function buildAirQualityGradient(standard: AirQualityStandard) {
  const span = standard.max - standard.min + standard.step
  const stops = standard.bands.flatMap(band => {
    const start = ((band.min - standard.min) / span) * 100
    const end = ((band.max - standard.min + standard.step) / span) * 100
    return [`${band.color} ${start}%`, `${band.color} ${end}%`]
  })

  return `linear-gradient(90deg, ${stops.join(', ')})`
}
