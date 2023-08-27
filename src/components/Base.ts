export class Base extends HTMLElement {
    elements: {
      [key: string]: Partial<HTMLElement>;
    };
    state: {
      [key: string]: any;
    };
  
    constructor() {
      super();
      this.state = {};
      this.elements = {};
      this.querySelectorAll("[data-as]").forEach((element) => {
        // @ts-ignore
        this.elements[element.dataset.as] = element;
      });
    }
  
  }
  