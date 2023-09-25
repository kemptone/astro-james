export default `
<link rel="stylesheet" href="/wc-dialog.css">
<link rel="stylesheet" href="/wc-floating-label.css">
<link rel="stylesheet" href="/wc-fieldset-inputs.css">
<style>

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
