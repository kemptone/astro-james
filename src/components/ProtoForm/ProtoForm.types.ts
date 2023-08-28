export type Values = {
  [key: string]: FormDataEntryValue | FormDataEntryValue[] | null
}

export interface ProtoFormProps<T> {
  e_form: HTMLFormElement | null
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