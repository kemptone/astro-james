/** This is a client side only function */
export function buildFanKeyframes(
  {
    accelTime,
    fullSpeedTime,
    decelTime,
    maxSpeed,
    initialRotation,
    classKey,
  }: FanKeyFramAnimation = {
    accelTime: 2,
    fullSpeedTime: 1,
    decelTime: 2,
    maxSpeed: 3,
    initialRotation: 0,
    classKey: "animate",
  },
) {
  // Calculate total time from the three phases
  const totalTime = accelTime + fullSpeedTime + decelTime

  // steady duration is now explicit
  const steadyTime = fullSpeedTime

  // turns
  const accelTurns = 0.5 * maxSpeed * accelTime
  const steadyTurns = maxSpeed * steadyTime
  const decelTurns = 0.5 * maxSpeed * decelTime
  const totalTurns = accelTurns + steadyTurns + decelTurns

  // convert to degrees
  const accelDeg = initialRotation + accelTurns * 360
  const steadyDeg = initialRotation + (accelTurns + steadyTurns) * 360
  const totalDeg = initialRotation + totalTurns * 360

  // percentages
  const accelPct = (accelTime / totalTime) * 100
  const steadyPct = ((accelTime + steadyTime) / totalTime) * 100

  // build keyframes
  const keyframes = `
    .${classKey} { animation: spin${classKey} ${totalTime}s forwards; }
    .dead${classKey} { animation: dead${classKey} ${totalTime}s forwards; }

    @keyframes dead${classKey} {
      0% {
        transform: rotate(${initialRotation}deg);
      }
      100% {
        transform: rotate(${initialRotation}deg);
      }
    }

    @keyframes spin${classKey} {
      0% {
        transform: rotate(${initialRotation}deg);
        animation-timing-function: ease-in;
      }
      ${accelPct}% {
        transform: rotate(${accelDeg}deg);
        animation-timing-function: linear;
      }
      ${steadyPct}% {
        transform: rotate(${steadyDeg}deg);
        animation-timing-function: ease-out;
      }
      100% {
        transform: rotate(${totalDeg}deg);
      }
    }
  `

  // inject
  const styleEl = document.createElement("style")
  styleEl.textContent = keyframes
  styleEl.id = classKey
  document.head.appendChild(styleEl)
  return {
    totalTime,
  }
}

export type FanKeyFramAnimation = {
  accelTime: number
  fullSpeedTime: number
  decelTime: number
  maxSpeed: number
  initialRotation: number
  classKey: string
}
