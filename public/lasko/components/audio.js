const context = new (window.AudioContext || window.webkitAudioContext)()

// pythagorean tuning on perfect fifth 3:2

// https://github.com/pavle-goloskokovic/web-audio-touch-unlock/blob/master/dist/index.js
function webAudioTouchUnlock (context) {
  return new Promise(function (resolve, reject) {
      if (!context || !(context instanceof (window.AudioContext || window.webkitAudioContext))) {
          reject('WebAudioTouchUnlock: You need to pass an instance of AudioContext to this method call')
          return
      }
      if (context.state === 'suspended' && 'ontouchstart' in window) {
          var unlock_1 = function () {
              context.resume().then(function () {
                  document.body.removeEventListener('touchstart', unlock_1)
                  document.body.removeEventListener('touchend', unlock_1)
                  resolve(true)
              }, function (reason) {
                  reject(reason)
              })
          }
          document.body.addEventListener('touchstart', unlock_1, false)
          document.body.addEventListener('touchend', unlock_1, false)
      }
      else {
          resolve(false)
      }
  })
}

const pefectNoteMap = (function(map) {

  const ratios = [ 1, 9/8, 81/64, 4/3, 3/2, 27/16, 243/128 ]
    , octaves = [ 1, 2, 4, 8, 16, 32, 64, 128 ]

  octaves.forEach( octave =>
    ratios.forEach( ratio =>
      map.push( octave * ratio )
    )
  )

  return map

}([]))

function playPerfectNote (note, base=440, ex1 = 0.000001, ex2 = 1) {
  webAudioTouchUnlock(context).then(() => {

    const frequency = pefectNoteMap[ note ] * base
      , o = context.createOscillator()
      , g = context.createGain()

    o.frequency.value = frequency
    o.connect(g)
    g.connect(context.destination)
    o.start()
    o.stop(context.currentTime +  .4)

  })

}

// export default playNote
export default playPerfectNote