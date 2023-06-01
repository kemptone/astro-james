// deno-lint-ignore-file no-debugger
import { CurrentCalc, Log } from '../data/Calculations2.ts';

const externalEval = typeof window === "undefined" ? e => 0 : window?.externalEval

export default (e: { currentTarget: { innerText: string; }; }) => {

  const thing = e.currentTarget.innerText

  const isDigit = new RegExp("d")

  switch (thing) {

    case "C": {
      CurrentCalc.value = "0"
      return
    }

    case "⌫": {
      let value = CurrentCalc.value

      if (value.length)
        value = value.substr( 0, value.length - 1 )
      else
        value = "0"

      return CurrentCalc.value = value || "0"
    }

    case "⏾":
      return

    case "=": {
      let replaced = CurrentCalc.value || ""
      replaced = replaced.replaceAll("÷", "/")
      replaced = replaced.replaceAll("×", "*")
      replaced = replaced.replaceAll("®", "")
      let value = externalEval( replaced )
      Log.value = [ ...Log.value, CurrentCalc.value.replaceAll("®", "") + "=" + value]
      return CurrentCalc.value = String(value + "®")
    }

    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
    case "0": {

      if (CurrentCalc.value.indexOf("®") === CurrentCalc.value.length - 1)
        CurrentCalc.value = thing
      else if (CurrentCalc.value === "0")
        CurrentCalc.value = thing
      else
        CurrentCalc.value = CurrentCalc.value += thing

      return
    }

    default : {
      if (CurrentCalc.value === "0")
        CurrentCalc.value = thing
      else
        CurrentCalc.value = CurrentCalc.value += thing
    }

  }

}
