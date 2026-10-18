export const SUPPORTED_CHECKBOX_COUNTS = [1, 2, 3, 4, 6] as const

export type SupportedCheckboxCount = (typeof SUPPORTED_CHECKBOX_COUNTS)[number]

const singleStates = ['1', '0']
const pairStates = ['10', '11', '01', '00']

function combineGroups(left: readonly string[], right: readonly string[]): string[] {
  return left.flatMap(leftState => right.map(rightState => leftState + rightState))
}

const tripleStates = combineGroups(singleStates, pairStates)
const statesByCount: Record<SupportedCheckboxCount, readonly string[]> = {
  1: singleStates,
  2: pairStates,
  3: tripleStates,
  4: combineGroups(pairStates, pairStates),
  6: combineGroups(tripleStates, tripleStates),
}

function assertSupportedCount(count: number): asserts count is SupportedCheckboxCount {
  if (!(SUPPORTED_CHECKBOX_COUNTS as readonly number[]).includes(count)) {
    throw new RangeError(`Unsupported checkbox count: ${count}. Choose 1, 2, 3, 4, or 6.`)
  }
}

function validateCombination(combination: string): SupportedCheckboxCount {
  if (typeof combination !== 'string' || !/^[01]+$/.test(combination)) {
    throw new TypeError('A checkbox state must be a nonempty binary string using 1 for on and 0 for off.')
  }

  const count = combination.length
  assertSupportedCount(count)
  return count
}

/** Return the states in game order, using 1 for on and 0 for off. */
export function generateCombinations(count: number): string[] {
  assertSupportedCount(count)
  return [...statesByCount[count]]
}

/** Six switches have independent left and right three-switch state numbers. */
export function getStateLabel(combination: string): string {
  const count = validateCombination(combination)
  if (count === 6) {
    const left = tripleStates.indexOf(combination.slice(0, 3)) + 1
    const right = tripleStates.indexOf(combination.slice(3)) + 1
    return `${left} ${right}`
  }

  return String(statesByCount[count].indexOf(combination) + 1)
}

/** Show the on/off pattern, separating the two groups of six-switch games. */
export function formatState(combination: string): string {
  const count = validateCombination(combination)
  const pattern = combination.replace(/[01]/g, bit => bit === '1' ? 'O' : 'X')
  return count === 6 ? `${pattern.slice(0, 3)} ${pattern.slice(3)}` : pattern
}
