import type {ProtoFormProps, Values} from './ProtoForm.types'
import type {ReturnValues} from './ProtoForm.types'

const WhenItChanges =
  (
    e_form: HTMLFormElement,
    allUniqueCheckboxKeys: Set<string>,
    values: Values,
    keys = new Set<string>()
  ) =>
  (e: Event) => {
    const formData = new FormData(e_form)

    for (const key of formData.keys()) {
      keys.add(key)
    }

    keys.forEach(key => {
      if (allUniqueCheckboxKeys.has(key)) {
        values[key] = formData.getAll(key)
      } else {
        values[key] = formData.get(key)
      }
    })

    return {values}
  }

export default function ProtoForm<T>(props: ProtoFormProps<T>) {
  const e_form = props.e_form || new HTMLFormElement()

  if (props.noValidate) e_form.noValidate = true

  function dispatchWraper<Z = {}>(name: string, Event: ReturnValues<T> & Z) {
    e_form.dispatchEvent(
      new CustomEvent(name, {
        detail: Event,
      })
    )
    return Event
  }

  const values: Values = {}
  const keys = new Set<string>()
  const blurredKeys = new Set<string>()

  // Values are generally a string, but can be a string[] for checkboxes
  // since they have multiple values, it might be needed for multiselects too,
  // come back to this if needed
  const allUniqueCheckboxKeys = new Set<string>(props.allUniqueCheckboxKeys)
  e_form
    .querySelectorAll?.('input[type=checkbox][name]')
    .forEach((e: Element) => {
      if (
        e_form?.querySelectorAll?.(`input[type=checkbox][name=${e?.name}]`)
          .length > 1
      ) {
        // it's more than one, then string[], otherwise, it's a string
        // @ts-ignore, since it's a checkbox, it's always a checkbox
        allUniqueCheckboxKeys.add(e.name)
      }
    })

  const whenItChanges = WhenItChanges(
    e_form,
    allUniqueCheckboxKeys,
    values,
    keys
  )

  function onChange(e: Event) {
    const {values} = whenItChanges(e)
    props.onChange?.({
      values: values as T,
      blurredKeys,
      keys,
      e_form: e_form as HTMLFormElement,
      lastTouched: e?.name || e?.target?.name || e?.currentTarget?.name,
    })
    checkValidity()
  }

  function onSubmit(e: Event) {
    e.preventDefault()
    e.stopImmediatePropagation()
    e.stopPropagation()

    for (const field of e_form.elements) {
      field.removeAttribute('aria-invalid')
    }

    const {values} = whenItChanges(e)
    if (checkValidity(false)) {
      let r = dispatchWraper('proto-submit', {
        values: values as T,
        blurredKeys,
        keys,
        e_form: e_form as HTMLFormElement,
        lastTouched: '',
      })

      props.onSubmit?.(r)
      // props.onSubmit?.({
      //   values: values as T,
      //   blurredKeys,
      //   keys,
      //   e_form: e_form as HTMLFormElement,
      //   lastTouched: '',
      // })
    } else {
      debugger
    }
  }

  function checkValidity(useRefortValidity = false) {
    // if (e_form?.checkValidity()) {
    if (
      useRefortValidity ? e_form?.reportValidity() : e_form?.checkValidity()
    ) {
      let r = dispatchWraper('proto-valid', {
        values: values as T,
        blurredKeys,
        keys,
        e_form: e_form as HTMLFormElement,
        lastTouched: '',
      })
      // props.onIsValid?.({
      //   values: values as T,
      //   blurredKeys,
      //   keys,
      //   e_form: e_form as HTMLFormElement,
      //   lastTouched: '',
      // })
      props.onIsValid?.(r)
      // console.count("valid")
      return true
    } else {
      let r = dispatchWraper('proto-invalid', {
        values: values as T,
        blurredKeys,
        keys,
        e_form: e_form as HTMLFormElement,
        lastTouched: '',
      })
      // props.onIsInvalid?.({
      //   values: values as T,
      //   blurredKeys,
      //   keys,
      //   e_form: e_form as HTMLFormElement,
      //   lastTouched: '',
      // })
      props.onIsInvalid?.(r)
      // console.count("invalid")
      return false
    }
  }

  function onBlur(e: Event) {
    const target = e.target as HTMLInputElement
    if (!target) return

    blurredKeys.add(target.name)
    let r = dispatchWraper<{name: string}>('proto-blur', {
      // @ts-ignore, since it always has a name
      name: e.name || e.target.name,
      blurredKeys,
      values: values as T,
      keys,
      e_form: e_form as HTMLFormElement,
      lastTouched: target.name,
    })
    props.onBlur?.(r)
    // props.onBlur?.({
    //   // @ts-ignore, since it always has a name
    //   name: e.name || e.target.name,
    //   blurredKeys,
    //   values: values as T,
    //   keys,
    //   e_form: e_form as HTMLFormElement,
    //   lastTouched: target.name,
    // })

    // if the id is set, then we can inject the error message there
    // otherwise, we can still mark it as invalid
    // That allows us complete customization of the error message
    let e_error = e_form?.querySelector(
      `#${target.dataset.validationid}`
    ) as HTMLElement | null

    if (checkValidity(false)) {
      target.removeAttribute('aria-invalid')
    } else {
      target.setAttribute('aria-invalid', 'true')
      if (e_error) {
        e_error.innerHTML = target.validationMessage
      }
    }

    checkValidity()
  }

  function onKeyUp(e: Event) {
    if (e.target?.getAttribute('aria-invalid') === 'true') {
      checkValidity(false)
    } else {
      checkValidity(false)
    }
  }

  function removeAllEventListeners() {
    const clonedElement = e_form.cloneNode(true) // Create a clone of the element with its content
    e_form.replaceWith(clonedElement) // Replace the original element with the clone
  }

  e_form.addEventListener('change', onChange)
  e_form.addEventListener('submit', onSubmit)

  for (const field of e_form.elements) {
    field.removeAttribute('aria-invalid')
    // const e_error = e_form?.querySelector( `#${field.dataset.validationid}` ) as HTMLElement | null

    field.addEventListener('invalid', function handleInvalidField(event) {
      if (!blurredKeys.has(field?.name || 'BBBBBB')) return
      field.setAttribute('aria-invalid', 'true')
      if (field?.dataset) {
        const e_error = e_form?.querySelector(
          `#${field.dataset.validationid}`
        ) as HTMLElement | null
        if (!e_error) return
        e_error.innerHTML = field?.validationMessage || ''
      }
    })
  }

  e_form.querySelectorAll?.('input[name], textarea[name]').forEach(e => {
    e.addEventListener('blur', onBlur)
    e.addEventListener('keyup', onKeyUp)
  })

  // Check the validity of the form on load
  checkValidity()

  return {
    removeAllEventListeners,
  }
}
