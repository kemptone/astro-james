import S from './state.js'
import numPad from './numPad.js'

function isAlpha (note) {
  return String(note).match(/[a-z]/)
}

export default function Events ({ pad, z_display, all_codes, step, e_base, run }) {

  const { password, reward } = all_codes[ step ]
    , LENGTH = password.length

  let isBlocked = false

  S.on("audio", a => a.play())
  S.on("current_code", z_display )
  S.on("current_code", (current_code, state) => {

    if (current_code.length >= LENGTH) {
      isBlocked = true
      setTimeout(() => {

        let truthy = true

        // it's a number
        if ( !isAlpha( password ) ) {
          if (current_code !== password)
            truthy = false
        // it's letters
        } else {
          current_code.split("").forEach( (number, index) => {
            const item = numPad.find( i => i.val == number )
            if ( !item.alpha.includes( password[index]) )
              truthy = false
          })
        }

        if (truthy) {
          reward(state, e_base, S)
          S.clearAll()

          if (all_codes.length > step + 1)
            S.set("step", step + 1)
          else
            S.set("step", 0)

          S.get(run)
        }

        S.set("current_code", "")
        isBlocked = false
      }, 500)
    }

  })

  S.on("code_click", (code, state) => {
    if (!isBlocked)
      S.set("current_code", (state.current_code || "") + code)
  })

  function clearAll (pad) {
    for (let x in pad)
      pad[x].classList.remove("clicked")
  }

  S.on("play_note", note => {
    clearAll(pad)

    let index

    if (isAlpha(note))
      index = numPad.findIndex( i => i.alpha.includes( note ) )
    else
      index = numPad.findIndex( i => i.val == note )

    pad[ index || 0 ].click()
    pad[ index || 0 ].classList.add("clicked")

    setTimeout( () => clearAll(pad), 400 )

  })

}