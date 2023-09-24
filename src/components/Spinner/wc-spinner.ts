import '../wc-dialog-wrap'
import template from './wc-spinner.template'
import type {State} from './wc-spinner.types'
import {AdjustableBlades} from './AdjustableBlades'

class WCSpinner extends HTMLElement {
  state: State = {
    blade_count: 5,
    run_time: 5,
    slow_down: 2,
    speed_up: 2,
    wait: 0,
    blade_scale: 1,
    rate: 1.5,
    opacity: 1,
    audio_rate: 1,
    blade_line_width: 1,
    timer_state: 'ending',
    running: false,
  }

  main: HTMLElement | null = null

  constructor() {
    super()
    const shadow = this.attachShadow({mode: 'open'})
    shadow.innerHTML = template
    this.main = shadow.querySelector('main')
  }

  stop() {
    this.state = {...this.state, running: false, timer_state: 'ending'}
    this.main?.classList.remove('started')
    this.main?.classList.remove('middle')
  }

  start() {
    this.state = {...this.state, running: true, timer_state: 'started'}
    this.main?.classList.remove('ending')
    this.main?.classList.remove('middle')
    this.main?.classList.add('started')
  }

  startStop() {
    this.start()
  }

  setTimes() {

    const set = (name: string, value: string) => {
        this.main?.style.setProperty(name, value)
    }

    const FACTOR = 0.666 // Magic number
    const {rate, speed_up, run_time, slow_down} = this.state
    const rotations_speedup = Math.ceil(speed_up * FACTOR * rate)
    const rotations_runtime = Math.ceil(run_time * rate) + rotations_speedup
    const rotations_slowdown = Math.ceil(slow_down * FACTOR * rate) + rotations_runtime
    this.state = {
        ...this.state,
        rotations_speedup,
        rotations_runtime,
        rotations_slowdown,
    }
    set('--rotations_speedup', `${rotations_speedup}turn`)
    set('--rotations_runtime', `${rotations_runtime}turn`)
    set('--rotations_slowdown', `${rotations_slowdown}turn`)
    set('--speed_up', `${speed_up}s`)
    set('--run_time', `${run_time}s`)
    set('--slow_down', `${slow_down}s`)
  }

  connectedCallback() {
    const $ = (selector: string) => this.shadowRoot?.querySelector(selector)
    const e_spinner = $('main > header > button')

    if (!e_spinner) return

    this.setTimes()

    const setClass = (name: string) => {
        this.main?.classList.add(name)
    }
    const removeClass = (name: string) => {
        this.main?.classList.remove(name)
    }

    const innerHTML = AdjustableBlades(this.state)
    e_spinner.addEventListener('click', this.startStop.bind(this))
    e_spinner.addEventListener('transitionend', () => {

        const {
            timer_state,
        } = this.state

        if (timer_state === "") {
          setClass('started')
          this.state = { ...this.state, timer_state : "started"}
          return
        } else if (timer_state === "started") {
          removeClass('started')
          setClass('middle')
          this.state = { ...this.state, timer_state : "middle"}
          return
        } else if (timer_state === "middle") {
          setClass('ending')
          removeClass('middle')
          this.state = { ...this.state, timer_state : "ending"}
          return
        } else if (timer_state === "ending") {
          removeClass('started')
          removeClass('middle')
          removeClass('ending')
          this.state = { ...this.state, timer_state : ""}
          return
        }

    })

    e_spinner.innerHTML = innerHTML

  }
}

if (typeof window != 'undefined') customElements.define('wc-spinner', WCSpinner)
