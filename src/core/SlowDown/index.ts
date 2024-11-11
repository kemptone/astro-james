import ProtoForm from '../../components/ProtoForm/ProtoForm'

type FormType = {}

// waits for the body to load
document.body.onload = () => {
  const e_form = document.querySelector('form')
  const e_trigger_settings = document.querySelector('#trigger_settings')
  const e_settings = document.querySelector('#settings') as HTMLDialogElement
  const e_number_of_steps = document.querySelector(
    'input[name="number_of_steps]'
  )
  const e_steps = document.querySelector('#steps')

  ProtoForm<FormType>({
    e_form,
    onSubmit: form => {
      debugger
    },
    allUniqueCheckboxKeys: ['step'],
  })

  e_trigger_settings?.addEventListener('click', () => {
    e_settings.showModal()
  })

  e_number_of_steps?.addEventListener('change', e => {

    debugger

    if (!e_steps) return

    e_steps.innerHTML = ''
    // const big_fragent = document.createDocumentFragment()
    const target = e.currentTarget as HTMLInputElement
    const count = Number(target.value)
    const range = document.createRange()
    for (let i = 0; i < count; ++i) {
      let fragment = range.createContextualFragment(
        `<input type="number" name="step" value="1" />`
      )
      range.insertNode(fragment)
    //   big_fragent?.appendChild(fragment)
    }
    // e_steps.appendChild(big_fragent)
    e_steps.innerHTML = range.toString()
  })
}
