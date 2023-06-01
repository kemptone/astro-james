import { useState } from 'preact/hooks'

export default Mixer => {

  const ret = []

  Mixer.forEach( item => {
    ret.push( useState([ ...item, false ]) )
  })

  return ret

}