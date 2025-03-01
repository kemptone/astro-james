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


export type Talkers2VoiceDetails = {
  Name?: string
  DisplayName?: string
  LocalName?: string
  ShortName?: string
  Gender?: 'Male' | 'Female'
  Locale?: string
  LocaleName?: string
  StyleList?: string // Could be changed to a more specific type if the styles are fixed
  SampleRateHertz?: string // Alternatively, use a union of valid sample rates if limited
  VoiceType?: 'Neural' | 'Standard'
  Status?: 'GA' | 'Preview' // Expand this union if there are more statuses
  WordsPerMinute?: string | number // Depending on how it's consumed
  Face?: string // URL
  text_hidden?: string
  text?: string
  express_as?: string // Could also be a union if there are fixed expressions
}