import type { JSX } from "preact";
const IS_BROWSER = typeof window !== "undefined";

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled}
    />
  );
}
