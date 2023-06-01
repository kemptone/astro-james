import createAppend from '../createAppend.js'

export default function (e_parent, click) {
  return createAppend(
    e_parent
    , {
      innerHTML : "🙉"
      , className : "play play-notes"
      , type : "button"
    }
    , { click }
  )
}