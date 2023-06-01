import createAppend from '../createAppend.js'

export default function (e_parent, click) {
  return createAppend(
    e_parent
    , {
      type : "button"
      , className : "clear"
      , innerHTML : "CLEAR"
    }
    , click ? { click } : undefined
  )
}