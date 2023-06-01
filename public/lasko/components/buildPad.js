import NumPad from '../numPad.js'
import createAppend from '../createAppend.js'
import playNote from './audio.js'

export default function buildPad (e_parent, onClick) {

  const e_wrap = createAppend(
      e_parent
      , { className : "num-pad" }
    )
    , e_fragment = document.createDocumentFragment()
    , valueMap = []

  NumPad.forEach( (item, index) => {

    const e_piece_wrap = createAppend(
        e_wrap
        , { 
          className : "item"
          , type: "button" 
        }
        , {
        click : e => {
          playNote( item.audio )
          onClick && onClick(item, e, e_piece_wrap) 
        }
      })
      , e_piece_num = createAppend(e_piece_wrap, { className : "num", innerHTML : item.val })
      , e_piece_alphas = createAppend(e_piece_wrap, { className : "alphas" })

    valueMap.push( e_piece_wrap)

    item.alpha.forEach( innerHTML => 
      createAppend(e_piece_alphas, { className: "alpha", type : "span", innerHTML })
    )

  })

  e_wrap.appendChild( e_fragment )

  return valueMap

}