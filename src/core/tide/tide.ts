import {getData} from './getData'
import type {Predictions} from './getData'
import {buildGraph} from './buildGraph'
import { buildTable } from './buildTable'
import { PAST_DAYS } from './helpers'

document.addEventListener('DOMContentLoaded', async () => {

  const date = new Date()
  const addedDays = 40

  const Pre: Predictions = await getData(date, addedDays)
  const {svg} = buildGraph(Pre, date, addedDays)
  const {table} = buildTable(Pre, date, addedDays)
  const e_graph = document.getElementById('graph')
  const e_days = document.getElementById('days')
  const e_heading = document.getElementById('heading')

  if (e_days) {
    e_days.innerHTML = table
  }

  if (e_graph) {
    e_graph.innerHTML = svg
  }

  if (e_heading) {
    e_heading.innerHTML = `Tidal Predictions`
  }


})
