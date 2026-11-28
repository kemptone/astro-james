export const biomesByTemperature = {
  Freezing: [
    'snowy_plains', 'deep_frozen_ocean', 'frozen_ocean', 'frozen_peaks', 'frozen_river',
    'grove', 'ice_spikes', 'jagged_peaks', 'snowy_beach', 'snowy_slopes', 'snowy_taiga',
  ],
  Cold: [
    'taiga', 'cherry_grove', 'cold_ocean', 'dappled_forest', 'deep_cold_ocean', 'meadow',
    'old_growth_pine_taiga', 'old_growth_spruce_taiga', 'windswept_forest', 'windswept_gravelly_hills',
    'windswept_hills',
  ],
  Medium: [
    'plains', 'birch_forest', 'dark_forest', 'deep_dark', 'deep_ocean', 'dripstone_caves',
    'flower_forest', 'forest', 'lush_caves', 'mushroom_fields', 'ocean', 'old_growth_birch_forest',
    'pale_garden', 'river', 'stony_shore', 'sunflower_plains', 'the_void',
  ],
  Lukewarm: [
    'lukewarm_ocean', 'beach', 'deep_lukewarm_ocean', 'sparse_jungle', 'swamp',
  ],
  Warm: [
    'desert', 'badlands', 'bamboo_jungle', 'eroded_badlands', 'jungle', 'mangrove_swamp',
    'savanna', 'savanna_plateau', 'stony_peaks', 'sulfur_caves', 'warm_ocean', 'windswept_savanna',
    'wooded_badlands',
  ],
} as const

export type Temperature = keyof typeof biomesByTemperature
export const temperatures = Object.keys(biomesByTemperature) as Temperature[]

export function biomeTemperature(biome: string) {
  return temperatures.find(temperature => biomesByTemperature[temperature].some(id => id === biome))
}

export function biomeName(biome: string) {
  return biome.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
}
