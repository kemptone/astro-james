import {getData} from './getData'
import type {Predictions} from './getData'
import {buildGraph} from './buildGraph'

document.addEventListener('DOMContentLoaded', async () => {

  const date = new Date()

  const Pre: Predictions = await getData(date, 5)
  const {svg} = buildGraph(Pre, date, 5)
  const e_graph = document.getElementById('graph')

  if (e_graph) {
    e_graph.innerHTML = svg
  }
})
