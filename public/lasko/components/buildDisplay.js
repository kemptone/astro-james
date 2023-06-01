import createAppend from '../createAppend.js'

function buildDisplay (e_parent, length = 4, password) {

  const e_wrap = createAppend(
    e_parent
    , { className : "display" }
  )
  // const e_wrap = createElement("display")
    , e_fragment = document.createDocumentFragment()
    , state = []

  let x = 0

  // initializes the view
  while (++x <= length)
    state.push( createAppend(
      e_fragment
      , { 
        className : "dot empty"
        , type : "div"
        , innerHTML : password[ x - 1 ] 
      }
    ))

  e_wrap.appendChild( e_fragment )

  // on refresh
  return new_value => {
    let x = 0
    while (x < length) {
      if (new_value[x])
        state[x].className = "dot"
      else
        state[x].className = "dot empty"
      x++
    }
  }

}

export default buildDisplay
