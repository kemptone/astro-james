import {z} from 'zod'

const common = {
  id: z.string(),
  label: z.string(),
  description: z.string(),
  disabled: z.boolean(),
}
const option = z.object({
  id: z.string(),
  label: z.string(),
  disabled: z.boolean(),
})
const setting = z.discriminatedUnion('type', [
  z.object({
    ...common,
    type: z.literal('slider'),
    min: z.number().finite(),
    max: z.number().finite(),
    step: z.number().positive().finite().optional(),
    value: z.number().finite(),
  }),
  z.object({
    ...common,
    type: z.literal('choice'),
    options: z.array(option),
    value: z.string(),
  }),
  z.object({...common, type: z.literal('toggle'), value: z.boolean()}),
  z.object({...common, type: z.literal('button'), message: z.string()}),
])
const group = z.object({
  id: z.string(),
  name: z.string(),
  settings: z.array(setting),
})
const workspace = z.object({
  activeId: z.string(),
  groups: z.array(group),
})

export type Setting = z.infer<typeof setting>
export type Group = z.infer<typeof group>
export type Workspace = z.infer<typeof workspace>

export const typeLabels = {
  slider: 'Slider',
  choice: 'Multi-state toggle',
  toggle: 'On/off toggle',
  button: 'Modal button',
}

const legacyStorageKey = 'astro-james:settings-builder:v1'
export const storageKey = 'astro-james:settings-builder:v2'
export const minimumChoiceOptions = 2

const friendlyFire = {
  id: 'friendly-fire',
  type: 'toggle',
  label: 'Friendly Fire',
  description: 'Allow players to damage their teammates.',
  value: false,
  disabled: false,
} satisfies Setting

const sprintAssist = {
  id: 'sprint-assist',
  type: 'toggle',
  label: 'Sprint Assist',
  description: 'Keep sprinting while moving forward.',
  value: true,
  disabled: true,
} satisfies Setting

const seed = {
  activeId: 'world',
  groups: [
    {
      id: 'world',
      name: 'World',
      settings: [
        {
          id: 'distance',
          type: 'slider',
          label: 'Render Distance',
          description: 'How far into the world you can see.',
          min: 2,
          max: 32,
          value: 16,
          disabled: false,
        },
        {
          id: 'difficulty',
          type: 'choice',
          label: 'Difficulty',
          description: 'Pick how challenging the world feels.',
          value: 'normal',
          disabled: false,
          options: [
            {id: 'peaceful', label: 'Peaceful', disabled: false},
            {id: 'normal', label: 'Normal', disabled: false},
            {id: 'hard', label: 'Hard', disabled: true},
          ],
        },
        {
          id: 'coordinates',
          type: 'toggle',
          label: 'Show Coordinates',
          description: 'Display your position as you explore.',
          value: true,
          disabled: false,
        },
        friendlyFire,
        {
          id: 'world-notes',
          type: 'button',
          label: 'World Notes',
          description: 'Open a note about this world.',
          message:
            'Every world starts with a single block. Where will you build first?',
          disabled: false,
        },
      ],
    },
    {
      id: 'player',
      name: 'Player',
      settings: [
        {
          id: 'sensitivity',
          type: 'slider',
          label: 'Look Sensitivity',
          description: 'How quickly your view turns.',
          min: 0,
          max: 100,
          value: 60,
          disabled: false,
        },
        {
          id: 'perspective',
          type: 'choice',
          label: 'Camera View',
          description: 'Choose how you see your character.',
          value: 'first',
          disabled: false,
          options: [
            {id: 'first', label: 'First person', disabled: false},
            {id: 'back', label: 'Third person', disabled: false},
            {id: 'front', label: 'Front view', disabled: false},
          ],
        },
        sprintAssist,
        {
          id: 'auto-jump',
          type: 'toggle',
          label: 'Auto-Jump',
          description: 'Jump automatically when you approach a block.',
          value: false,
          disabled: true,
        },
        {
          id: 'player-notes',
          type: 'button',
          label: 'Player Notes',
          description: 'Open a note about your character.',
          message: 'Make this character your own, one setting at a time.',
          disabled: false,
        },
      ],
    },
  ],
} satisfies Workspace

export const initialWorkspace: Workspace = seed

export function removeGroup(state: Workspace, id: string): Workspace {
  const index = state.groups.findIndex(group => group.id === id)
  if (index === -1) return state
  const groups = state.groups.filter(group => group.id !== id)
  const activeId =
    state.activeId === id
      ? ((groups[index] ?? groups.at(-1))?.id ?? '')
      : state.activeId
  return {activeId, groups}
}

export function readWorkspace(): Workspace {
  const current = localStorage.getItem(storageKey)
  const saved = current ?? localStorage.getItem(legacyStorageKey)
  if (!saved) return initialWorkspace
  try {
    const result = workspace.safeParse(JSON.parse(saved))
    if (!result.success) return initialWorkspace
    if (current === null) {
      for (const [groupId, item, beforeId] of [
        ['world', friendlyFire, 'world-notes'],
        ['player', sprintAssist, 'auto-jump'],
      ] as const) {
        const group = result.data.groups.find(group => group.id === groupId)
        if (!group || group.settings.some(setting => setting.id === item.id))
          continue
        const index = group.settings.findIndex(
          setting => setting.id === beforeId,
        )
        group.settings.splice(
          index === -1 ? group.settings.length : index,
          0,
          item,
        )
      }
    }
    return result.data
  } catch {
    return initialWorkspace
  }
}

export function newOption(label = '') {
  return {id: crypto.randomUUID(), label, disabled: false}
}

export function newSetting(type: Setting['type']): Setting {
  const base = {
    id: crypto.randomUUID(),
    label: '',
    description: '',
    disabled: false,
  }
  switch (type) {
    case 'slider':
      return {...base, type, min: 0, max: 100, value: 50}
    case 'choice':
      return {
        ...base,
        type,
        options: Array.from({length: minimumChoiceOptions}, (_, index) =>
          newOption(`Option ${index + 1}`),
        ),
        value: '',
      }
    case 'toggle':
      return {...base, type, value: false}
    case 'button':
      return {...base, type, message: ''}
  }
}

export function validateGroup(draft: Group): string {
  if (!draft.name.trim()) return 'Enter a group name.'
  for (const [index, item] of draft.settings.entries()) {
    const label = item.label.trim()
    if (!label) return `Enter a label for setting ${index + 1}.`
    if (
      item.type === 'slider' &&
      (!Number.isFinite(item.min) ||
        !Number.isFinite(item.max) ||
        item.max <= item.min)
    ) {
      return `${label} needs a maximum greater than its minimum.`
    }
    if (item.type === 'slider' && !Number.isFinite(item.value)) {
      return `${label} needs a value.`
    }
    if (
      item.type === 'slider' &&
      item.step !== undefined &&
      (!Number.isFinite(item.step) || item.step <= 0)
    ) {
      return `${label} needs a step greater than zero.`
    }
    if (
      item.type === 'choice' &&
      (item.options.length < minimumChoiceOptions ||
        item.options.some(choice => !choice.label.trim()))
    ) {
      return `${label} needs at least ${minimumChoiceOptions} named options.`
    }
  }
  return ''
}

function decimalPlaces(value: number) {
  const [coefficient, exponent = '0'] = String(value).split('e')
  return Math.max(
    0,
    (coefficient.split('.')[1]?.length ?? 0) - Number(exponent),
  )
}

function normalizeSliderValue({
  min,
  max,
  step,
  value,
}: {
  min: number
  max: number
  step?: number
  value: number
}) {
  const clamped = Math.min(max, Math.max(min, value))
  if (step === undefined) return clamped

  const lastStep = (max - min) / step
  const nearestStep = Math.round((clamped - min) / step)
  if (!Number.isFinite(nearestStep)) return clamped
  const index = Math.min(
    nearestStep,
    Math.floor(lastStep + lastStep * Number.EPSILON),
  )
  const snapped = min + index * step
  const places = Math.max(decimalPlaces(min), decimalPlaces(step))
  const rounded = places <= 100 ? Number(snapped.toFixed(places)) : snapped
  return Math.min(max, Math.max(min, rounded))
}

export function normalizeGroup(draft: Group): Group {
  return {
    ...draft,
    name: draft.name.trim(),
    settings: draft.settings.map(item => {
      const updated = {
        ...item,
        label: item.label.trim(),
        description: item.description.trim(),
      }
      if (updated.type === 'slider') {
        return {
          ...updated,
          value: normalizeSliderValue({
            min: updated.min,
            max: updated.max,
            step: updated.step,
            value: updated.value,
          }),
        }
      }
      if (updated.type === 'choice') {
        const options = updated.options.map(choice => ({
          ...choice,
          label: choice.label.trim(),
        }))
        const selected = options.find(
          choice => choice.id === updated.value && !choice.disabled,
        )
        const firstEnabled = options.find(choice => !choice.disabled)
        return {
          ...updated,
          options,
          value: selected?.id ?? firstEnabled?.id ?? '',
        }
      }
      return updated
    }),
  }
}
