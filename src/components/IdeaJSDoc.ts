// this is an example of a Stanley component
// The name Stanley is based off of the Stanley Parable, a game my son loves to play.

export type ComponentType = {
  render: () => void
  parent: {}
}

export type ComponentProps = {
    parent : {}
}

export const ParentComponent = async (props: {
}) : Promise<ComponentType> => {

  const $ = {
    e_main: document.querySelector('#someid'),
    e_header: document.querySelector('#somethingElse')
  }

  const thing = {
    render () {},
    parent : {},
    $
  }

  Object.assign($, {
    component: Component({
      e_element: document.querySelector('#someid > .subcomponent'),
      parent : thing
    })
  })

  return thing

}

// Child Component
export async function Component (props: ComponentProps & {
  e_element: HTMLElement | null
}) : Promise<ComponentType> {
  const $ = {
    e_element : props.e_element
  }
  const thing = {
    render : () => {
    },
    $,
    parent : props.parent
  }

  return thing
}

// 
const dog = await ParentComponent({})
const FFF = await Component({
    e_element : document.querySelector("div")
    , parent : {}
})