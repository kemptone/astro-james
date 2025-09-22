function flipHours(hours: number): number {
  // Based on the prompt's hour flipping rules
  if (hours === 0) return 0
  return 24 - hours
}

function flipMinutes(minutes: number): number {
  // Based on the prompt's minute flipping rules
  if (minutes === 0) return 0
  return 60 - minutes
}

function formatTime12Hour(hours24: number, minutes: number): string {
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function flipTime(timeStrFull: string) {
  const timeStr = timeStrFull.trim()
  if (!timeStr) return

  // Parse the native time input format (HH:MM in 24-hour format)
  const [hours, minutes] = timeStr.split(':').map(Number)

  // Apply flipping rules from the prompt
  let flippedHours = flipHours(hours)
  let flippedMinutes = flipMinutes(minutes)

  // If minutes were flipped (not 0), we need to subtract 1 from hours
  // because we're "borrowing" from the next hour
  if (minutes !== 0) {
    flippedHours = flippedHours - 1
    if (flippedHours < 0) {
      flippedHours = 23
    }
  }

  return formatTime12Hour(flippedHours, flippedMinutes)

  // Display flipped time
  // flippedDisplay.textContent = formatTime12Hour(
  //   flippedHours,
  //   flippedMinutes
  // )
}
