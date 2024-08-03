import {useEffect, useState} from 'preact/hooks'
import './style.css'

const Colors = [
  ['Red', '#FF0000'], // red
  ['Orange', '#FF7F00'], 
  ['Yellow', '#FFFF00'], 
  ['Green', '#00FF00'], // green
  ['Blue', '#0000FF'],
  ['Purple', '#6A0DAD'],
  ['White', '#FFFFFF'],
  ['Gray', '#808080'],
  ['Black', '#000000'],
  ['Brown', '#88540B'],
  ['Pink', '#FFC0CB'],
]

// This uses Internation number formatting to pad the number with a leading zero
// if it's less than 10. This is a bit of a hack, but it works.
const pad = (n: number) => n.toLocaleString('en-US', {minimumIntegerDigits: 2})

export default () => {
  useEffect(() => {
    // document.documentElement.className = 'dark night'
    // document.documentElement.classList.add('ampm-game')

            const e_html = document.querySelector('html')
            e_html?.style.setProperty('--background-color', Colors[0][1])
            e_html?.style.setProperty('--color', 'black')
  }, [])

  return (
    <main class={'ampm'}>
      <form>
        <select name="hour">
          {[...Array(12).keys()].map(i => (
            <option value={i + 1}>{pad(i + 1)}</option>
          ))}
        </select>
        <select name="minute">
          {[...Array(60).keys()].map(i => (
            <option value={i}>{pad(i)}</option>
          ))}
        </select>
        <select name="seconds">
          {[...Array(60).keys()].map(i => (
            <option value={i}>{pad(i)}</option>
          ))}
        </select>
        <select name="ampm">
          <option value="0">AM</option>
          <option value="12">PM</option>
        </select>
      </form>
      <form>
        <select
          name="color"
          onInput={e => {
            const value = e.currentTarget.value
            const e_html = document.querySelector('html')
            e_html?.style.setProperty('--background-color', value)
            e_html?.style.setProperty('--color', 'black')

            if (value === Colors[8][1] || value === Colors[5][1]) {
              e_html?.style.setProperty('--color', 'white')
            }

          }}
        >
          {Colors.map(([name, value]) => (
            <option value={value}>{name}</option>
          ))}
        </select>
      </form>
    </main>
  )
}
