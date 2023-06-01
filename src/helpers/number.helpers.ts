// formats number with leading zeros
export function formatNumber(n: number) {
  return n < 10 ? `0${n}` : n;
}

// formats a number with up to 2 leading zeros
export function formatNumber2(n: number) {
  return n < 10 ? `00${n}` : n < 100 ? `0${n}` : n;
}

// formats a number, which is in miliseconds as a timer string, with hours, minutes, and seconds, and milliseconds
export const formatTimer = (timer: number) => {
  const hours = Math.floor(timer / 3600000);
  const minutes = Math.floor((timer % 3600000) / 60000);
  const seconds = Math.floor((timer % 60000) / 1000);
  const ms = Math.floor(timer % 1000);
  return `${formatNumber(hours)}:${formatNumber(minutes)}:${
    formatNumber(seconds)
  }.${formatNumber2(ms)}`;
};
