import {type Predictions} from './getData'

export function buildTable(pre: Predictions, date: Date, addedDays: number) {
  let inner = ''

  pre.predictions.forEach(item => {

    console.log(item)

    let type = item.type === "H" ? "High Tide" : "Low Tide"
    if (Number(item.v) > 5) { 
      type = "Omega High Tide"
    }
    if (Number(item.v) < 0) {
      type = "Omega Low Tide"
    }

    inner += `<tr>
                    <td>${item.t}</td>
                    <td>${item.v}</td>
                    <td>${ type }</td>
                </tr>`
  })

  const table = `<table><thead>
          <tr>
            <th>Date and Time</th>
            <th>Height</th>
            <th>tide</th>
          </tr>
        </thead><tbody>
        ${ inner }
        </tbody></table>`

  return {
    table,
  }
}
