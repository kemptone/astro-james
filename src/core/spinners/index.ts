import '../../components/Spinner/wc-spinner'

const $ = (selector: string) => document.querySelector(selector)

const e_edit = $('#edit')
const e_fans = $('#change_fans')
const e_dialog = $('#page_settings') as HTMLDialogElement
const e_num_fans = $("input[name='number_of_fans']") as HTMLInputElement

e_edit?.addEventListener('click', () => {
  e_edit.classList.toggle('active')
  document.querySelectorAll('wc-spinner').forEach((e_spinner: any) => {
    e_spinner.setAttribute('edit', e_edit.classList.contains('active'))
    // e_spinner.edit = e_edit.classList.contains('active')
  })
})

e_fans?.addEventListener('click', () => {
  e_dialog.showModal()
})

e_num_fans?.addEventListener('input', e => {

  // @ts-ignore
  const count = parseInt( e.target.value )
  let x = 0

  const e_fragment = document.createDocumentFragment()

  while (x < count) {
    let e_item = document.createElement('wc-spinner')
    e_fragment.appendChild(e_item)
    x++
  }

  let e_target = $("#spinners")
  if (e_target) {
    e_target.innerHTML = ""
    e_target.appendChild(e_fragment)
  }

})
