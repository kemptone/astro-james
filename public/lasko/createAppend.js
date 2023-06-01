/**
 * 
 * @param {Node} parent Element
 * @param {object} options 
 * @param {object} events 
 */
export function createAppend (parent, options={}, events={}) {
  const { type="div", ...others } = options
  const e = document.createElement(type)
  Object.assign(e, others)

  for (var x in events)
    e.addEventListener( x, events[x] )

  parent && parent.appendChild(e)

  return e
}

export default createAppend