export default `
<style>

dialog.wc-dialog {
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
  border: 1px solid rgba(0,0,0,.3);
  box-shadow: 0px 3px 7px 0px rgba(0,0,0,.2);
  padding: 1em;
  background: white;
  color: black;
  display: block;
  border-radius: 12px;
  width: -moz-fit-content;
  width: -webkit-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: -webkit-fit-content;
  height: fit-content;
}


dialog.wc-dialog,
dialog.wc-dialog[open]:-internal-dialog-in-top-layer::backdrop,
dialog.wc-dialog[open]::backdrop {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s linear 0.3s, opacity 0.3s linear;
}

dialog.wc-dialog:-internal-dialog-in-top-layer::backdrop,
dialog.wc-dialog::backdrop {
  background: rgba(0, 0, 0, 0.3);
}

dialog.wc-dialog[open].in,
dialog.wc-dialog.in[open]:-internal-dialog-in-top-layer::backdrop,
dialog.wc-dialog[open].in::backdrop {
  transition-delay: 0s;
}

dialog.wc-dialog[open].in,
dialog.wc-dialog.in[open]:-internal-dialog-in-top-layer::backdrop,
dialog.wc-dialog[open].in::backdrop {
  opacity: 1;
  visibility: visible;
}

:root {
  --chakra-colors-red-500: #f56565;
}
fieldset:has(wc-floating-label-input) {
  background-color: white;
}

wc-floating-label-input {
  --height: 2.5rem;
  display: block;
  position: relative;
  min-height: var(--height);
  background-color: transparent;
  border-radius: 0.2rem;
  margin-block: 1.2rem;
}

wc-floating-label-input input {
  background-color: white;
}

/* has input with content */
wc-floating-label-input:has(input:not(:placeholder-shown)) .clear,
wc-floating-label-input:has(textarea:not(:placeholder-shown)) .clear {
  display: block;
}

wc-floating-label-input .clear {
  display: none;
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  opacity: 0.5;
  /* color: rgba(0, 0, 0, 0.5); */
  cursor: pointer;
  transition: color 0.1s;
  font-size: 1rem;
  line-height: 1.5rem;
}

wc-floating-label-input textarea::placeholder,
wc-floating-label-input input::placeholder {
  opacity: 0;
}

wc-floating-label-input label,
wc-floating-label-input input {
  display: block;
  border: 0;
  box-shadow: none;
}

wc-floating-label-input input,
wc-floating-label-input select,
wc-floating-label-input textarea {
  border: 1px solid rgba(0, 0, 0, 0.1);
}

wc-floating-label-input input {
  display: block;
  box-shadow: none;
}

wc-floating-label-input select {
  height: calc(var(--height) + 1rem);
  width: 100%;
  padding-inline: 0.6rem;
  padding-block: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

wc-floating-label-input textarea,
wc-floating-label-input input[type='email'],
wc-floating-label-input input[type='text'] {
  height: var(--height);
  width: 100%;
  padding-inline: 0.6rem;
  padding-block: 1.3rem;
}

wc-floating-label-input textarea {
  height: auto;
  padding-block: .8rem;
}

wc-floating-label-input:has(select) label,
wc-floating-label-input:has(textarea) label,
wc-floating-label-input:has(input[type='email']) label,
wc-floating-label-input:has(input[type='text']) label {
  position: absolute;
  top: 0.5rem;
  left: 0.4rem;
  background-color: white;
  transition: top 0.1s;
  padding-inline: 0.2rem;
  user-select: none;
}

wc-floating-label-input:has(select) label {
  top: -0.7rem;
}

wc-floating-label-input:has(textarea:not(:placeholder-shown)) label,
wc-floating-label-input:has(input[type='email']:not(:placeholder-shown)) label,
wc-floating-label-input:has(input[type='text']:not(:placeholder-shown)) label,
wc-floating-label-input:has(textarea:focus) label,
wc-floating-label-input:has(input[type='email']:focus) label,
wc-floating-label-input:has(input[type='text']:focus) label {
  top: -0.7rem;
  left: 0.4rem;
}

/* These groupings can expand as we go */
wc-floating-label-input .error {
  display: none;
  color: var(--chakra-colors-red-500);
  font-weight: bold;
}

/* These groupings can expand as we go */
wc-floating-label-input:has(textarea[aria-invalid='true']) .error,
wc-floating-label-input:has(input[aria-invalid='true']) .error {
  display: block;
}

:root {
  --chakra-colors-red-500: #f56565;
}

wc-fieldset-inputs {
}

wc-fieldset-inputs .fieldset-inputs {
  display: flex;
  flex-direction: row;
  margin-block: 1.2rem;
  gap: 1rem;
}

wc-fieldset-inputs .fieldset-inputs > label {
  display: flex;
  flex-direction: row;
  gap: .3rem;
}

/* These groupings can expand as we go */
wc-fieldset-inputs .error {
  display: none;
  color: var(--chakra-colors-red-500);
  font-weight: bold;
}

/* These groupings can expand as we go */
wc-fieldset-inputs:has(textarea[aria-invalid='true']) .error,
wc-fieldset-inputs:has(input[aria-invalid='true']) .error {
  display: block;
}



  main {}

  :host {
    --magic: 15px;
  }

  main {
    position: relative;
    width: 300px;
    height: 300px;
    display: inline-block;
    margin:-30px;
  }

  main>button {
    all: unset;
  }

  main.started svg {
    transform: rotate(var(--rotations_speedup));
    transition: transform ease-in;
    transition-duration: var(--speed_up);
  }

  main.middle svg {
    transform: rotate(var(--rotations_runtime));
    transition: transform linear;
    transition-duration: var(--run_time);
  }

  main.ending svg {
    transform: rotate(var(--rotations_slowdown));
    transition: transform ease-out;
    transition-duration: var(--slow_down);
  }

  main svg {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    margin-left: -50%;
    margin-top: -50%;
  }

  main svg {
    display: block;
  }

  main svg path.background-blade {
    opacity: var(--opacity, 1);
    stroke: none;
    /* -webkit-stroke */
  }

  main svg path.forground-blade {
    stroke-width: var(--stroke-width, 0.02);
    opacity: var(--opacity, 1);
    /* stroke: white; */
    fill: none;
    stroke: var(--stroke-color, white);
    /* fill: var(--fill, rgba(0,0,0,.6)); */
  }

  dialog.wc-dialog {
    min-width: 400px;
  }

  dialog.wc-dialog input {
    width: 100%;
    padding:8px;
    box-sizing: border-box;
    font-size:1rem;
  }


</style>

<main>
  <button type="button" class="blades-wrap">SVG GOES HERE</button>
  <wc-dialog-wrap>
    <dialog>
    <form>
      <wc-floating-label-input data-label="Blade Count" data-adderror="1">
        <input type="number" name="blade_count" min="1" max="1000" step="1" value="5" required>
      </wc-floating-label-input>
      <wc-floating-label-input data-label="Run Time" data-adderror="1">
        <input type="number" name="run_time" min="1" max="100" step=".001" value="5" required>
      </wc-floating-label-input>
      <wc-floating-label-input data-label="Speed Up" data-adderror="1">
        <input type="number" name="speed_up" min="1" max="100" step=".001" value="5" required>
      </wc-floating-label-input>
      <wc-floating-label-input data-label="Wait" data-adderror="1">
        <input type="number" name="wait" min="0" max="100" step=".001" value="5" required>
      </wc-floating-label-input>
      <wc-floating-label-input data-label="Blade Scale" data-adderror="1">
        <input type="number" name="slow_down" min=".001" max="100" step=".001" value="5" required>
      </wc-floating-label-input>
      <wc-floating-label-input data-label="Slow Down" data-adderror="1">
        <input type="number" name="slow_down" min="1" max="100" step="1" value="5" required>
      </wc-floating-label-input>
      <wc-floating-label-input data-label="Style" data-adderror="1">
        <select name="curve_type">
          <option>normal</option>
          <option>pointy</option>
          <option>middle</option>
          <option>daisy</option>
          <option>twisty</option>
          <option>twisty2</option>
          <option>skinny</option>
          <option>skinny2</option>
          <option>skinny3</option>
          <option>skinny4</option>
          <option>bybygone</option>
          <option>paddle</option>
          <option>paddleSpacer</option>
        </select>
      </wc-floating-label-input>
      <button type="submit">Save</button>
    </form>
    </dialog>
  </wc-dialog-wrap>
</main>
`
