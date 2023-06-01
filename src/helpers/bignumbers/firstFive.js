export function firstFive(powerOfTen) {
  switch (powerOfTen) {
    default:
    case 0:
      return "one ";
    case 1:
      return "ten ";
    case 2:
      return "one hundred ";
    case 3:
      return "one thousand ";
    case 4:
      return "ten thousand ";
    case 5:
      return "one hundred thousand ";
  }
}
