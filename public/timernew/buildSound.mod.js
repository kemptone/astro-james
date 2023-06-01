export default (All) => {

  function slideUp (sound, soundId) {

    let limit = 100
    let speed = .1

    const interval = setInterval( e => {

      if (!limit)
        return clearInterval( interval )


      sound.rate( speed, soundId )

      speed = speed * 1.02
      limit--
    }, 15 )

  }

  function slideDown (sound, soundId) {

    let limit = 100
    let speed = .4

    const interval = setInterval( e => {

      if (!limit)
        return clearInterval( interval )

      sound.rate( speed, soundId )

      speed = speed * .998
      limit--
    }, 90 )

  }

  return {
    slideUp
    , slideDown
  }

}