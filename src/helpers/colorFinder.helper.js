function colorDiff(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2),
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

export const getClosestColor = (colors) => (RGBTo) => {
  const closest = colors.reduce(function (prev, curr) {
    return Math.abs(colorDiff(curr.rgb, RGBTo)) <
        Math.abs(colorDiff(prev.rgb, RGBTo))
      ? curr
      : prev;
  });

  return closest;
};

export const onPickerChange = (colors, setChosenColors) => (e) => {
  e;
  e.target;

  const rgb = hexToRgb(e.target.value);

  // const RGB = {
  //   r: RGBArr[0],
  //   g: RGBArr[1],
  //   b: RGBArr[2],
  // };

  // var hexaLabel = document.getElementById("hexa-code-container");
  // var rgbaLabel = document.getElementById("rgba-code-container");
  // var hslaLabel = document.getElementById("hsla-code-container");
  // var cmykLabel = document.getElementById("cmyk-code-container");
  // var hsvaLabel = document.getElementById("hsva-code-container");

  // hexaLabel.innerText = color.toHEXA().toString(0);
  // rgbaLabel.innerText = color.toRGBA().toString(0);
  // hslaLabel.innerText = color.toHSLA().toString(0);
  // cmykLabel.innerText = color.toCMYK().toString(0);
  // hsvaLabel.innerText = color.toHSVA().toString(0);

  const closest = getClosestColor(colors)(rgb);

  setChosenColors(closest);
  // alert(closest);
};
