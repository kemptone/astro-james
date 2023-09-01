import ProtoForm from '../../components/ProtoForm/ProtoForm'

type FormType = {
  name: string
  age: string
  birth: string
  date: string
}

ProtoForm<FormType>({
  e_form: document.querySelector('form'),
  onSubmit: ({values}) => {
    debugger
    console.log(JSON.stringify(values))
  },
  noValidate: true,
})