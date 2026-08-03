export const KID_THING_LISTS_STORAGE_KEY = 'BOODEBOO_KIDTHING_LISTS_V1'

export const DEFAULT_PRIMARY_NAMES = [
  'Abby',
  'Adaliz',
  'Aiden',
  'Angelo',
  'Anthony',
  'Bailey',
  'Benny',
  'Briana',
  'Chase',
  'Cierra',
  'Cruz',
  'Gustavo',
  'Hudson',
  'Iker',
  'James',
  'Leilani',
  'Lindsey',
  'Merryck',
  'Michael',
  'Sophia C',
  'Sofia V',
  'Kenia',
  'Melanie',
  'Mrs. Kobylka',
]

export const DEFAULT_SECONDARY_NAMES = [
  'Beau',
  'Gianna',
  'Makenzie',
  'Blake',
  'Merlin',
  'Santa Claus',
  'Tooth Fairy',
  'Audry',
  'Braxton',
  'Adley',
  'Crista',
  'Jake',
  'Makayla',
  'Atticus',
  'Presly P',
  'Alexis',
  'Sophie',
  'Mikey',
  'Davey Jack',
  'Hazel',
  'Oliver',
  'Lucas',
  'Presly',
  'Jackson',
  'Aubrey',
  'Elliot',
  'Dumpy',
  'Kevin',
  'Glinda',
  'Dorothy',
  'Scarecrow',
  'Tin Man',
  'lion',
  'Auntie M',
  'Wizard of Oz',
  'Nixon',
  'Easter Bunny',
  'Dave',
  'Ava',
  'Atreyu',
  'Moonchild',
  'Bastian',
  'Emerson',
  'Ellie',
  'Danial',
  'Carmen',
  'Zander',
  'Lita',
  'Linnie',
  'Jill',
  'Carol Anne',
  'Claire Crosby',
  'Darla',
  'Jennifer',
  'Sarjenka',
  'Tina Youthers',
  'Mykel-Michelle',
  'Clara',
  'Wrockley',
  'Kufty',
  'Mormage',
  'Parad',
]

export type KidThingLists = {
  primary: string[]
  secondary: string[]
}

export const DEFAULT_KID_THING_LISTS: KidThingLists = {
  primary: DEFAULT_PRIMARY_NAMES,
  secondary: DEFAULT_SECONDARY_NAMES,
}

const sanitizeNames = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return [...fallback]

  const names = value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 200)

  return names.length ? names : [...fallback]
}

export const getKidThingLists = (): KidThingLists => {
  if (typeof window === 'undefined') {
    return {
      primary: [...DEFAULT_PRIMARY_NAMES],
      secondary: [...DEFAULT_SECONDARY_NAMES],
    }
  }

  try {
    const stored = window.localStorage.getItem(KID_THING_LISTS_STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : null

    return {
      primary: sanitizeNames(parsed?.primary, DEFAULT_PRIMARY_NAMES),
      secondary: sanitizeNames(parsed?.secondary, DEFAULT_SECONDARY_NAMES),
    }
  } catch {
    return {
      primary: [...DEFAULT_PRIMARY_NAMES],
      secondary: [...DEFAULT_SECONDARY_NAMES],
    }
  }
}

export const saveKidThingLists = (lists: KidThingLists) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    KID_THING_LISTS_STORAGE_KEY,
    JSON.stringify({
      primary: sanitizeNames(lists.primary, DEFAULT_PRIMARY_NAMES),
      secondary: sanitizeNames(lists.secondary, DEFAULT_SECONDARY_NAMES),
    }),
  )
}
