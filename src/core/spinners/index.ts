import '../../components/Spinner/wc-spinner'

const $ = (selector: string) => document.querySelector(selector)

const e_num_fans = $("input[name='number_of_fans']") as HTMLInputElement

e_num_fans?.addEventListener('input', e => {
  //@ts-ignore
  const count = parseInt(e.target.value)
  let x = 0

  const e_fragment = document.createDocumentFragment()

  while (x < count) {
    let e_item = document.createElement('wc-spinner')
    // if (is_edit_mode) {
    //   e_item.setAttribute('edit', 'true')
    // }
    e_fragment.appendChild(e_item)
    x++
  }

  let e_target = $('#spinners')
  if (e_target) {
    e_target.innerHTML = ''
    e_target.appendChild(e_fragment)
  }
})
