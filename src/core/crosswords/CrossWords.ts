import ProtoForm from "../../components/ProtoForm/ProtoForm"

const e_grid = document.querySelector('#crosswordgrid')
const e_width = document.querySelector('input[name="width"]')
const e_height = document.querySelector('input[name="height"]')
const e_words = document.querySelector('textsarea[name="words"]')
const e_form = document.querySelector('form#crosswords') as HTMLFormElement
const protoForm = ProtoForm<{
    height: string
    width: string
    words: string
}>({
    e_form,
    noValidate: true,
    onSubmit: (e) => {
        debugger
    }
})
