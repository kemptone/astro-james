import {e} from 'unocss'

const e_smart_anchors = document.querySelector(
  '#smart-anchors'
) as HTMLDivElement
const sections = e_smart_anchors.querySelectorAll('section')
const e_menu = e_smart_anchors.querySelector('menu') as HTMLElement

function checkVisible() {
  for (let x of sections) {
    if (x.getBoundingClientRect().top < 50) {
      e_menu.querySelectorAll('a').forEach(a => {
        if (a.href.endsWith(x.id)) {
          a.classList.add('active')
        } else {
          a.classList.remove('active')
        }
      })
    }
  }
}

e_menu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault()
    const id = a.href.split('#')[1]
    sections.forEach(x => {
      if (x.id === id) {
        x.scrollIntoView({behavior: 'smooth'})
      }
    })
  })
})

document.addEventListener('scroll', checkVisible)

checkVisible()