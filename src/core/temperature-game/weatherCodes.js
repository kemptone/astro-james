export const WEATHER_CODES = Object.freeze([
  { code: 1, name: 'Sunny', time: 'day', lighting: 'sunny', cloudCover: 0, rain: 0 },
  { code: 2, name: 'Mostly Sunny', time: 'day', lighting: 'sunny', cloudCover: 0.2, rain: 0 },
  { code: 3, name: 'Partly Sunny', time: 'day', lighting: 'bright', cloudCover: 0.43, rain: 0 },
  { code: 4, name: 'Mostly Cloudy', time: 'day', lighting: 'dim', cloudCover: 0.76, rain: 0 },
  { code: 5, name: 'Cloudy', time: 'day', lighting: 'overcast', cloudCover: 1, rain: 0 },
  { code: 6, name: 'Clear Night', time: 'night', lighting: 'clear', cloudCover: 0, rain: 0 },
  { code: 7, name: 'Mostly Clear', time: 'night', lighting: 'clear', cloudCover: 0.2, rain: 0 },
  { code: 8, name: 'Partly Clear', time: 'night', lighting: 'clear', cloudCover: 0.43, rain: 0 },
  { code: 9, name: 'Mostly Cloudy', time: 'night', lighting: 'dim', cloudCover: 0.76, rain: 0 },
  { code: 10, name: 'Cloudy', time: 'night', lighting: 'overcast', cloudCover: 1, rain: 0 },
  { code: 11, name: 'Isolated Thunderstorms', time: 'day', lighting: 'storm', cloudCover: 0.7, rain: 0, lightning: true, isolated: true },
  { code: 12, name: 'Drizzle', time: 'day', lighting: 'dim', cloudCover: 0.72, rain: 0.22, drizzle: true },
  { code: 13, name: 'Rain', time: 'day', lighting: 'overcast', cloudCover: 0.88, rain: 0.58 },
  { code: 14, name: 'Heavy Rain', time: 'day', lighting: 'storm', cloudCover: 1, rain: 1 },
  { code: 15, name: 'Thunderstorm', time: 'day', lighting: 'storm', cloudCover: 1, rain: 0.92, lightning: true },
  { code: 16, name: 'Isolated Thunderstorms', time: 'night', lighting: 'storm', cloudCover: 0.7, rain: 0, lightning: true, isolated: true },
  { code: 17, name: 'Drizzle', time: 'night', lighting: 'dim', cloudCover: 0.72, rain: 0.22, drizzle: true },
  { code: 18, name: 'Rain', time: 'night', lighting: 'overcast', cloudCover: 0.88, rain: 0.58 },
  { code: 19, name: 'Heavy Rain', time: 'night', lighting: 'storm', cloudCover: 1, rain: 1 },
  { code: 20, name: 'Thunderstorm', time: 'night', lighting: 'storm', cloudCover: 1, rain: 0.92, lightning: true },
])

export const WEATHER_GROUPS = Object.freeze([
  { title: 'Day', range: '1–5', start: 1, end: 5 },
  { title: 'Night', range: '6–10', start: 6, end: 10 },
  { title: 'Day rain', range: '11–15', start: 11, end: 15 },
  { title: 'Night rain', range: '16–20', start: 16, end: 20 },
])

export function getWeather(code) {
  return WEATHER_CODES.find(weather => weather.code === Number(code))
}
