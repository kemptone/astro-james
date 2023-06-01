export default All => {

  function buildOptionAsText (value, label) {
    return `<option value="${ value }">${ value } ${ label }</option>`
  }

  function buildHours () {
    let html = ''
    All.max.hours.forEach( value => {
      html += buildOptionAsText( value, value === 1 ? "hour" : "hours" )
    } )
    All.e_hours.innerHTML = html
  }

  function buildMinutes () {
    let html = ''
    All.max.minutes.forEach( value => {
      html += buildOptionAsText( value, value === 1 ? "minute" : "minutes" )
    } )
    All.e_minutes.innerHTML = html
  }

  function buildSeconds () {
    let html = ''
    All.max.seconds.forEach( value => {
      html += buildOptionAsText( value, value === 1 ? "second" : "seconds" )
    } )
    All.e_seconds.innerHTML = html
  }

  function buildSelects () {
    buildHours()
    buildMinutes()
    buildSeconds()
  }

  return function init() {
    buildSelects()
  }

}