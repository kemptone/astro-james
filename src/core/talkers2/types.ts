export type AzureVoiceInfo = {
  Name: string
  DisplayName: string
  LocalName: string
  ShortName: string
  Gender: 'Male' | 'Female' // Assuming only these two values
  Locale: string
  LocaleName: string
  SecondaryLocaleList: string[] // Array of strings for secondary locales
  SampleRateHertz: string
  VoiceType: 'Neural' | 'Standard' // Assuming only these two values
  Status: 'GA' | 'Preview' | 'Deprecated' // Assuming possible statuses
  Face?: string
  StyleList? : string[]
  WordsPerMinute? : string
}
