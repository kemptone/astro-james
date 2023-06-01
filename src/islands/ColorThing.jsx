import { useEffect, useState } from "preact/hooks";

const Primary = [
  "FF0000", // red
  "FF7F00", // yellow
  "FFFF00", // orange
  "00FF00", // green
  "0000FF",
  "6A0DAD",
  "FFFFFF",
  "808080",
  "000000",
  "88540B",
  "FFC0CB",
];

export default () => {
  const [chosenColors, setChosenColors] = useState([]);
  return (
    <main class="colorthing">
      <section class="readout">
        {chosenColors.map((backgroundColor) => (
          <span class="chosen" style={{ backgroundColor }}></span>
        ))}
      </section>
      <section class="colors">
        {Primary.map((item, index) => (
          <button
            children={index + 1}
            key={item}
            // onTouchStart={(e) => {
            //   setChosenColors(
            //     [...chosenColors, `#${item}`],
            //   );
            // }}
            onMouseDown={(e) => {
              setChosenColors(
                [...chosenColors, `#${item}`],
              );
            }}
            // onClick={(e) => {
            //   setChosenColors(
            //     [...chosenColors, `#${item}`],
            //   );
            // }}
          />
        ))}

        <button
          children="⟵"
          onClick={(e) => {
            setChosenColors(
              [...chosenColors].slice(0, chosenColors.length - 1),
            );
          }}
        />

        <button
          children=" "
          onClick={(e) => {
            setChosenColors(
              [...chosenColors, `transparent`],
            );
          }}
        />

        <button
          children="♺"
          onClick={(e) => {
            setChosenColors([]);
          }}
        />
      </section>
    </main>
  );
};
