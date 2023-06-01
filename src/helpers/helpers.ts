export function isDarkHexColor(hexColor: string): boolean {
  // Remove the "#" symbol if it's present
  hexColor = hexColor.replace("#", "");

  // Convert the hex color to an RGB color
  const red = parseInt(hexColor.substring(0, 2), 16);
  const green = parseInt(hexColor.substring(2, 4), 16);
  const blue = parseInt(hexColor.substring(4, 6), 16);

  // Calculate the luminance of the RGB color using the formula
  // Luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  // Check if the luminance is less than or equal to 128, which is roughly halfway between black and white
  return luminance <= 128;
}
