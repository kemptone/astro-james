export function getAttributes(element: Element) {
  const attributes = element.attributes
  const result: {
    [key: string]: string
  } = {}

  for (let attr of attributes) {
    result[attr.name] = attr.value
  }

  return result
}

export const regStripStrings = /[^-\d.]/g
export const stripStrings = (str: string | undefined, def: string | number) => {
  if (str) return str.replace(regStripStrings, '')
  else return def
}
