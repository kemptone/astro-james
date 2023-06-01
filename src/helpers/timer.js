export function buildTimeleftHtml(alarm) {
  if (!alarm) {
    return "0:00:00";
  }

  let remainder = 0;

  const hours = alarm > 3600 ? Math.floor(alarm / 3600) : 0;
  remainder = alarm - (hours * 3600);
  const minutes = alarm > 60 ? Math.floor(remainder / 60) : 0;
  const seconds = alarm - ((minutes * 60) + (hours * 3600));

  const shours = `${hours < 10 ? "0" : ""}${hours}`;
  const sminutes = `${minutes < 10 ? "0" : ""}${minutes}`;
  const sseconds = `${seconds < 10 ? "0" : ""}${seconds}`;

  return `${shours}:${sminutes}:${sseconds}`;
}

export const buildRange = (limit) => {
  const ret = [];
  let v = 0;
  while (v < limit) {
    ret.push(v++);
  }
  return ret;
};

export const max = {
  hours: buildRange(24),
  minutes: buildRange(60),
  seconds: buildRange(60),
};
