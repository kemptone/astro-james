import createAppend from '../createAppend.js'

export default function (e_parent, src, click) {

  let runner

  const removeChild = () => { 
    e_parent.removeChild(e_frame) 
    clearTimeout(runner)
  }

  const e_frame = createAppend(
    e_parent
    , { 
      className : "picture" 
    }
    , { click : e => click( removeChild ) }
  )

  createAppend(
    e_frame
    , {
      type : "img"
      , src
    }
    , {
      load : () => {
        runner = setTimeout(removeChild, 8000)
      }
    }
  )


  return e_frame
}