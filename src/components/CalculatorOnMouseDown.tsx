import { CurrentStack, AllStacks } from '../data/Calculations.ts';

export default (e: { currentTarget: { innerText: string; }; }) => {

  const thing = e.currentTarget.innerText

  switch (thing) {

    case "C": {
      CurrentStack.value = []
      return
    }

    case "⌫": {
      const most = CurrentStack.value.slice(0, CurrentStack.value.length - 1)
      CurrentStack.value = most
      return
    }

    case "⏾":
      return

    case "=": {
      const normalized = [""]

      CurrentStack.value.forEach(item => {
        if (Number.isInteger(Number.parseInt(item)))
          normalized[normalized.length - 1] += item
        else
          normalized.push(item, "")
      })

      let a = 0
      let dec = ""
      let operand = "+"

      const doToNumber = (number: number) => {
        switch (operand) {
          case "÷":
            return a = a / number
          case "-":
            return a = a - number
          case "+":
            return a = a + number
          case "×":
            return a = a * number
        }
      }

      normalized.forEach(item => {
        if (item === ".")
          return dec += "."
        if (Number.isInteger(Number.parseFloat(item)))
          doToNumber(Number.parseFloat(dec + item))
        else {
          operand = item
          dec = ""
        }
      })

      // normalized.forEach(item => {
      //   if (Number.isInteger(Number.parseInt(item)))
      //     doToNumber(Number.parseInt(item))
      //   else
      //     operand = item
      // })

      const value = a.toString().split("")

      AllStacks.value = [...AllStacks.value, [...CurrentStack.value, "=", ...value]]

      // CurrentStack.value = [a, "END"]
      CurrentStack.value = [...value, "END"]
      return
    }

  }

  if (CurrentStack.value[CurrentStack.value.length - 1] === "END") {
    if (Number.isInteger(Number.parseInt(thing)))
      return CurrentStack.value = [thing]
  }

  CurrentStack.value = [...CurrentStack.value, thing]

}
