export type State = {
  items: string
  alert_texts: string
  actions: Array<() => void>
  colors: string[]
}

const $ = document.querySelector.bind(document)
type $Type = typeof $

export type Z = Record<string, HTMLElement | any>

export type SubFunction = ( props : {
  state: State,
  z: Z,
  render: () => void,
  $: $Type }
) => void
