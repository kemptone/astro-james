type Values = {
  [key: string]: FormDataEntryValue | FormDataEntryValue[] | null
}

export interface Props<T> {
  e_form: HTMLFormElement
  onChange?: (form: ReturnValues<T>) => void
  onBlur?: (
    obj: ReturnValues<T> & {
      name: string
    }
  ) => void
  onIsValid?: (form: ReturnValues<T>) => void
  onIsInvalid?: (form: ReturnValues<T>) => void
  onSubmit?: (form: ReturnValues<T>) => void
  children?: HTMLElement | HTMLElement[]
  noValidate?: Boolean
}

export interface ReturnValues<T> {
  values: T
  blurredKeys: Set<string>
  keys: Set<string>
  e_form: HTMLFormElement
  lastTouched?: string
}

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

export default function ProtoForm<T>(props: Props<T>) {
  const {e_form} = props

  if (!e_form.current) return

  if (props.noValidate) e_form.current.noValidate = true

  const values: Values = {}
  const keys = new Set<string>()
  const blurredKeys = new Set<string>()

  // Values are generally a string, but can be a string[] for checkboxes
  // since they have multiple values, it might be needed for multiselects too,
  // come back to this if needed
  const allUniqueCheckboxKeys = new Set<string>()
  e_form.current.querySelectorAll?.('input[type=checkbox][name]').forEach((e : HTMLInputElement) => {
    if (
      e_form.current?.querySelectorAll?.(
        `input[type=checkbox][name=${e?.name}]`
      ).length > 1
    ) {
      // it's more than one, then string[], otherwise, it's a string
      // @ts-ignore, since it's a checkbox, it's always a checkbox
      allUniqueCheckboxKeys.add(e.name)
    }
  })

  const whenItChanges = WhenItChanges(
    e_form.current,
    allUniqueCheckboxKeys,
    values,
    keys
  )

  function onChange (e: Event) {
    const {values} = whenItChanges(e)
    props.onChange?.({
      values: values as T,
      blurredKeys,
      keys,
      e_form: e_form.current as HTMLFormElement,
      lastTouched: e?.name || e?.target?.name || e?.currentTarget?.name,
    })
    checkValidity()
  }

  function onSubmit (e: Event) {
    e.preventDefault()
    const {values} = whenItChanges(e)
    if (checkValidity()) {
      props.onSubmit?.({
        values: values as T,
        blurredKeys,
        keys,
        e_form: e_form.current as HTMLFormElement,
        lastTouched: '',
      })
    }
  }

  function checkValidity() {
    if (e_form.current?.checkValidity()) {
      props.onIsValid?.({
        values: values as T,
        blurredKeys,
        keys,
        e_form: e_form.current as HTMLFormElement,
        lastTouched: '',
      })
      // console.count("valid")
      return true
    } else {
      props.onIsInvalid?.({
        values: values as T,
        blurredKeys,
        keys,
        e_form: e_form.current as HTMLFormElement,
        lastTouched: '',
      })
      // console.count("invalid")
      return false
    }
  }

  function onBlur (e: Event) {
    // console.count("onBlur")
    // @ts-ignore, since it always has a name
    blurredKeys.add(e.name || e.target.name)
    props.onBlur?.({
      // @ts-ignore, since it always has a name
      name: e.name || e.target.name,
      blurredKeys,
      values: values as T,
      keys,
      e_form: e_form.current as HTMLFormElement,
      lastTouched: e?.name || e?.target?.name || e?.currentTarget?.name || '',
    })

    const target = e.target as HTMLInputElement
    if (!target) return

    // if the id is set, then we can inject the error message there
    // otherwise, we can still mark it as invalid
    // That allows us complete customization of the error message
    let e_error = e_form.current?.querySelector(
      `#${target.dataset.validationid}`
    ) as HTMLElement | null

    if (checkValidity()) {
      target.removeAttribute('aria-invalid')
    } else {
      target.setAttribute('aria-invalid', 'true')
      if (e_error) {
        e_error.innerHTML = target.validationMessage
      }
    }

    checkValidity()
  }

  function onKeyUp (e: Event) {
    checkValidity()
  }

  function removeAllEventListeners() {
    const clonedElement = e_form.cloneNode(true) // Create a clone of the element with its content
    e_form.replaceWith(clonedElement) // Replace the original element with the clone
  }

  e_form.current.addEventListener('change', onChange)
  e_form.current.addEventListener('submit', onSubmit)
  e_form.current
    .querySelectorAll?.('input[name], textarea[name]')
    .forEach(e => {
      e.addEventListener('blur', onBlur)
      e.addEventListener('keyup', onKeyUp)
    })

  // Check the validity of the form on load
  checkValidity()

  return {
    removeAllEventListeners,
  }
}