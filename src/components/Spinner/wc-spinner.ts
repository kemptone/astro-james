import '../wc-dialog-wrap'
import '../wc-fieldset-inputs'
import '../wc-floating-label-input'
import template from './wc-spinner.template'
import type {State} from './wc-spinner.types'
import {AdjustableBlades} from './AdjustableBlades'
import ProtoForm from '../ProtoForm/ProtoForm'
import {useAudioLoop} from './spinnerSound'
import type {TCurveType} from '../AdjustableBlades'

type FormType = {
  blade_count: string
  run_time: string
  slow_down: string
  speed_up: string
  wait: string
  blade_scale: string
  rate: string
  opacity: string
  audio_rate: string
  blade_line_width: string
  curve_type: TCurveType
}

if (typeof window != 'undefined')
  customElements.define(
    'wc-spinner',
    class WCSpinner extends HTMLElement {
      state: State = {
        blade_count: 5,
        run_time: 5,
        slow_down: 2,
        speed_up: 2,
        wait: 0,
        blade_scale: 30,
        rate: 1.5,
        opacity: 1,
        audio_rate: 1,
        blade_line_width: 1,
        timer_state: 'ending',
        running: false,
        edit_mode: false,
        curve_type: 'normal',
      }

      main: HTMLElement | null = null
      form: HTMLFormElement | null = null
      spinner: HTMLButtonElement | null = null
      internals: ElementInternals | null = null

      static get observedAttributes() {
        return ['edit']
      }

      constructor() {
        super()

        const shadow = this.attachShadow({mode: 'open'})
        shadow.innerHTML = template
        this.main = shadow.querySelector('main')
        this.form = shadow.querySelector('form') as HTMLFormElement | null
        this.spinner = shadow.querySelector(
          'main > button'
        ) as HTMLButtonElement | null

        useAudioLoop(this, {
          audioFile: '/spin/fans/00.wav',
          initialPlaybackRate: 1,
        })
      }

      connectedCallback() {
        this.setTimes()

        let longpressTimer: any
        let blocked = false

        const triggerEdit = () => {
          longpressTimer = setTimeout(() => {
            this.main?.querySelector('dialog')?.showModal()
            blocked = true
            setTimeout(() => {
              blocked = false
            }, 500)
          }, 900)
        }

        const cancelTriggerEdit = () => {
          clearTimeout(longpressTimer)
          longpressTimer = undefined
          if (!blocked) this.startStop()
        }

        this.spinner?.addEventListener('mousedown', triggerEdit)
        this.spinner?.addEventListener('mouseup', cancelTriggerEdit)
        this.spinner?.addEventListener('touchstart', triggerEdit)
        this.spinner?.addEventListener('touchend', cancelTriggerEdit)
        this.spinner?.addEventListener('transitionend', () => {
          const {timer_state} = this.state

          if (timer_state === '') {
            this.setClass('started')
            this.state = {...this.state, timer_state: 'started'}
            return
          } else if (timer_state === 'started') {
            this.removeClass('started')
            this.setClass('middle')
            this.state = {...this.state, timer_state: 'middle'}
            return
          } else if (timer_state === 'middle') {
            this.setClass('ending')
            this.removeClass('middle')
            this.state = {...this.state, timer_state: 'ending'}
            return
          } else if (timer_state === 'ending') {
            this.removeClass('started')
            this.removeClass('middle')
            this.removeClass('ending')
            this.state = {...this.state, timer_state: ''}
            return
          }
        })

        this.addEventListener('started', () => {
          const run = () => {
            this.state = {...this.state, running: true, timer_state: 'started'}
            this.removeClass('ending')
            this.removeClass('middle')
            this.setClass('started')
          }

          if (this.state.wait) {
            return setTimeout(run, this.state.wait * 1000)
          } else {
            run()
          }
        })
        this.addEventListener('middle', () => {})
        this.addEventListener('ending', () => {})
        this.addEventListener('stopped', () => {
          this.state = {...this.state, running: false, timer_state: 'ending'}
          this.removeClass('started')
          this.removeClass('middle')
        })

        const that = this

        if (this.spinner) this.spinner.innerHTML = AdjustableBlades(this.state)
        if (this.form) {
          ProtoForm<FormType>({
            e_form: this.form,
            onChange(args) {
              const values = args.values
              that.state = {
                ...that.state,
                ...{
                  blade_count: parseFloat(values.blade_count),
                  run_time: parseInt(values.run_time),
                  slow_down: parseFloat(values.slow_down),
                  speed_up: parseFloat(values.speed_up),
                  wait: parseFloat(values.wait),
                  blade_scale: parseFloat(values.blade_scale),
                  curve_type: values.curve_type,
                  rate: parseFloat(values.rate),
                },
              }
              that.setTimes()

              if (that.spinner)
                that.spinner.innerHTML = AdjustableBlades(that.state)
            },
          })
        }
      }

      setTimes() {
        const set = (name: string, value: string) => {
          this.main?.style.setProperty(name, value)
        }

        const FACTOR = 0.666 // Magic number
        const {rate, speed_up, run_time, slow_down, blade_scale} = this.state
        const rotations_speedup = Math.ceil(speed_up * FACTOR * rate)
        const rotations_runtime = Math.ceil(run_time * rate) + rotations_speedup
        const rotations_slowdown =
          Math.ceil(slow_down * FACTOR * rate) + rotations_runtime
        this.state = {
          ...this.state,
          rotations_speedup,
          rotations_runtime,
          rotations_slowdown,
          rate,
          run_time,
          slow_down,
          blade_scale,
        }
        set('--rotations_speedup', `${rotations_speedup}turn`)
        set('--rotations_runtime', `${rotations_runtime}turn`)
        set('--rotations_slowdown', `${rotations_slowdown}turn`)
        set('--speed_up', `${speed_up}s`)
        set('--run_time', `${run_time}s`)
        set('--slow_down', `${slow_down}s`)
        set('--blade_scale', `${blade_scale}`)
      }

      setClass(name: string) {
        this.main?.classList?.add?.(name)
      }

      removeClass(name: string) {
        this.main?.classList?.remove?.(name)
      }

      startStop() {
        if (this.state.running) this.dispatchEvent(new CustomEvent('stopped'))
        else this.dispatchEvent(new CustomEvent('started'))
      }

      attributeChangedCallback(
        name: string,
        oldValue: string,
        newValue: string
      ) {
        if (name === 'edit') {
          this.state = {...this.state, edit_mode: newValue === 'true'}
        }
      }
    }
  )

// if (typeof window != 'undefined') customElements.define('wc-spinner', WCSpinner)
