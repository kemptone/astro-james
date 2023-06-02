import AllSettings from "../components/AllSettings.tsx";
import { useEffect, useState } from "preact/hooks";
import '../../public/menu.css'

export default (props : {
  initialMenuOpen?: boolean;
}) => {
  const [MenuOpen, open] = useState(props.initialMenuOpen || false);

  const $menu = (
    <div class="menu-wrap">
      <button
        id="hamburgermenu"
        onClick={(e) => {
          open((o) => !o);
        }}
        className={MenuOpen ? "open" : ""}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  );

  useEffect(() => {
    document.querySelectorAll("#main-header a").forEach((Element) => {
      Element.addEventListener("click", (e: Event) => {
        e.stopPropagation();
      });
    });
  }, []);

  return (
    <header id="main-header">
      {$menu}
      <div
        class={`navigation ${MenuOpen ? "open" : ""}`}
        onClick={(e) => open(false)}
      >
        <nav
          className="
            sm:(font-size: 1.5rem;)
            md:(font-size: 1.5rem;)
          "
        >
          <a href="/">Home</a>
          <a href="/calculator">Calculator</a>
          <a href="/kidthing">Kids</a>
          <span>
            <a href="/brownthing">Brown Thing</a>
            <span>&nbsp;&nbsp;</span>
            <a href="/brownthing?countby=2">2</a>
            <span>&nbsp;&nbsp;</span>
            <a href="/brownthing?countby=3">3</a>
            <span>&nbsp;&nbsp;</span>
            <a href="/brownthing?countby=5">5</a>
            <span>&nbsp;&nbsp;</span>
            <a href="/brownthing?countby=10">10</a>
          </span>
            <a href="/voicemaker">Voice Maker</a>
          <span>
            <a href="/music2">Music</a>
            <span>&nbsp;&&nbsp;</span>
            <a href="/recorder">Recorder</a>
            <span>&nbsp;&&nbsp;</span>
            <a href="/nightnight">night night</a>
          </span>
          <span>
            <a href="/colorthing">Color Thing</a>
            <span>&nbsp;&&nbsp;</span>
            <a href="/colorfinder">Finder</a>
          </span>
          <a href="/bignumbers">Big Numbers</a>
            <a href="/speedup">Speed Up</a>
          <span>
            <a href="/timer4">Timer</a>
            <span>&nbsp;&&nbsp;</span>
            <a href="/spin">Spin</a>
            <span>&nbsp;&&nbsp;</span>
            <a href="https://number-ry8ams9hd2p0.deno.dev/timer3">Old Timer</a>
          </span>
          <a href="/lasko">Lasko</a>
          {/* <a href="/live">Cameras</a> */}
          <a href="/ampm">AM PM</a>
          <a href="https://smooth.talkrapp.com/#/">Talker</a>
          <AllSettings />
        </nav>
      </div>
    </header>
  );
};
