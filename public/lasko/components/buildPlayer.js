import createAppend from '../createAppend.js'

export default function (e_parent, hasSound, click) {
  return createAppend(
    e_parent
    , {
      innerHTML : hasSound ? "😀 play" : "🙉"
      , className : hasSound ? "play has-sound" : "play"
      , type : "button"
    }
    , { click }
  )
}