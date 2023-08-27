/**
 * @typedef {Object} ComponentType
 * @property {() => void} render - Function to rerender the whole component.
 * @property {Object} parent - Parent component.
 */

/**
 * @typedef {Object} ComponentProps
 * @property {Object} parent - Parent component.
 */

/**
 * Parent Component
 * @param {Object} props - Component props.
 * @returns {Promise<ComponentType>} Promise resolving to the component.
 */
export const ParentComponent = async (props) => {
    const $ = {
      e_main: document.querySelector('#someid'),
      e_header: document.querySelector('#somethingElse')
    };
  
    const thing = {
      render() {},
      parent: {},
      $
    };
  
    Object.assign($, {
      component: Component({
        e_element: document.querySelector('#someid > .subcomponent'),
        parent: thing
      })
    });
  
    return thing;
  };
  
  /**
   * Child Component
   * @param {ComponentProps & { e_element: HTMLElement|null }} props - Component props.
   * @returns {Promise<ComponentType>} Promise resolving to the component.
   */
  export async function Component(props) {
    const $ = {
      e_element: props.e_element
    };
  
    const thing = {
      render() {},
      $,
      parent: props.parent
    };
  
    return thing;
  }
  
  const dog = await ParentComponent({});
  const FFF = await Component({
    e_element: document.querySelector('div'),
    parent: {}
  });