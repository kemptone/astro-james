import { useEffect, useState } from "preact/hooks";
import Dialog from "../components/Dialog.tsx";

const Primary =
  "Abby  Adaliz  Aiden  Angelo  Anthony  Bailey  Benny  Briana  Chase  Cierra  Cruz  Daniel  Gustavo  Hudson  Iker  James  Leilani  Lindsey  Merryck  Michael  Sophia C  Sofia V  Kenia  Melanie  Valerie"
    .split("  ");

const Secondary =
  "Beau, Gianna, Makenzie, Blake, Merlin, Santa Claus, Tooth Fairy, Audry, Braxton, Adley, Crista, Jake, Makayla, Atticus, Presly P, Alexis, Sophie, Mikey, Davey Jack, Hazel, Oliver, Lucas, Presly, Jackson, Aubrey, Elliot, Dumpy, Kevin, Glinda, Dorothy, Scarecrow, Tin Man, The Lion, Auntie M, Wizard of Oz, Nixon, Easter Bunny"
    .split(", ");

// const Primary = [
//   "FF0000", // red
//   "FF7F00", // yellow
//   "FFFF00", // orange
//   "00FF00", // green
//   "0000FF",
//   "6A0DAD",
//   "FFFFFF",
//   "808080",
//   "000000",
//   "88540B",
//   "FFC0CB",
// ];

// console.log({ Primary, Secondary });

// console.log(
//   Primary.join(" is here..."),
// );

console.log(
  [...Primary, ...Secondary].join(" is here.\n"),
  // Secondary.join(" is here... "),
);

console.log(
  [...Primary, ...Secondary].join(" is absent.\n"),
  // Secondary.join(" is here... "),
);

export default () => {
  const [chosenNames, setChosenNames] = useState([]);
  const [showingMissing, setShowingMissing] = useState(false);

  // console.log({ chosenNames });

  return (
    <Dialog>
      {(D2) => (
        <Dialog>
          {(D) => (
            <main class="colorthing">
              <section class="readout">
                {chosenNames.map((name, index) => (
                  // <span class="chosen" key={index} children={{ name }} />
                  <span class="chosen" children={name} />
                ))}
              </section>
              <section class="colors">
                {Primary.map((item, index) => (
                  <button
                    children={index + 1}
                    key={item + index}
                    onClick={(e) => {
                      setChosenNames(
                        [...chosenNames, item],
                      );
                    }}
                  />
                ))}

                <button
                  children="⟵"
                  onClick={(e) => {
                    setChosenNames(
                      [...chosenNames].slice(0, chosenNames.length - 1),
                    );
                  }}
                />

                <button
                  children="⏲"
                  onClick={(e) => {
                    D2.openDialog();
                  }}
                />

                <button
                  children="🌗"
                  onClick={(e) => {
                    D.openDialog();
                  }}
                />

                <button
                  children="♺"
                  onClick={(e) => {
                    setChosenNames([]);
                  }}
                />
              </section>
              <D2.Dialog ref={D2.ref}>
                <main className="colorthing">
                  <div className="readout">
                    {Primary.filter((name) =>
                      chosenNames.join("::").indexOf(name) === -1
                    ).map((name) => <span className="chosen">{name}</span>)}
                  </div>
                </main>
              </D2.Dialog>

              <D.Dialog ref={D.ref}>
                <main className="colorthing">
                  <section className="inner-readout">
                    {showingMissing
                      ? chosenNames.map((name, index) => (
                        // <span class="chosen" key={index} children={{ name }} />
                        <span class="chosen" children={name} />
                      ))
                      : null}
                  </section>

                  <div class="colors">
                    <button
                      onClick={(e) => setShowingMissing(!showingMissing)}
                    >
                      ?
                    </button>
                    {Secondary.map((item, index) => (
                      <button
                        children={index + 1}
                        key={item + index}
                        onClick={(e) => {
                          setChosenNames(
                            [...chosenNames, item],
                          );
                        }}
                      />
                    ))}
                  </div>
                </main>
              </D.Dialog>
            </main>
          )}
        </Dialog>
      )}
    </Dialog>
  );
};
