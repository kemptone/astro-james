document.addEventListener("touchstart", function() {},false)

function deviceOrientation() {
  var body = document.body
  switch(window.orientation) {
    case 90:
      body.classList = ''
      body.classList.add('rotation90')
      break
    case -90:
      body.classList = ''
      body.classList.add('rotation-90')
      break
    default:
      body.classList = ''
      body.classList.add('portrait')
      break
  }
}
window.addEventListener('orientationchange', deviceOrientation)
deviceOrientation()