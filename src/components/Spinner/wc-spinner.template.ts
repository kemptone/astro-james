export default `
<style>
main {}
header { color:blue;}
footer { color:red;}

:host {
  --magic:15px;
}

main {
  position:relative;
  width:350px;
  height:350px;
  display:inline-block;
}

main header button {
    all:unset;
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
    width: calc(var(--magic) * var(--blade-scale, 30));
    height: calc(var(--magic) * var(--blade-scale, 30));
    margin-left: calc(calc(var(--magic) * var(--blade-scale, 30)) * -.5);
    margin-top: calc(calc(calc(var(--magic) * var(--blade-scale, 30)) * -.5) - 10px);
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

</style>

<main>
    <header>
        <button type="button" class="blades-wrap">SVG GOES HERE</button>
    </header>
    <footer></footer>
</main>
`
