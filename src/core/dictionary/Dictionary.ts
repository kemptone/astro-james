import '../../components/Dictionary/wc-dictionary-item'
// fetch sample.txt

type DictionaryEntry = {
  startIndex: number
  endIndex: number
  raw: string
  word: string
  prounciation?: string
  definitions?: string[]
  examples?: string[]
  synonyms?: string[]
  antonyms?: string[]
  related?: string[]
  etymology?: string
  others?: string
}

const e_dictionary = document.querySelector('#dictionary')
const e_list = document.querySelector('#list')

function renderList (list : DictionaryEntry[]) {
  if (!e_list) return
  const e_fragment = document.createDocumentFragment()
  list.forEach(entry => {
    const e_element = document.createElement('wc-dictionary-item')
    const { definitions, ...others } = entry
    for (let key in others) {
      // @ts-ignore
      if (!others[key]) delete others[key]
    }
    Object.assign(e_element.dataset, {
      ...others,
      definitions: definitions?.join('\n\n'),
    })
    e_fragment.appendChild(e_element)
  })
  e_list.appendChild(e_fragment)
}

fetch('/dictionary/sample.txt')
  .then(response => {
    return response.text()
  })
  .then(text => {
    console.log(text)

    // split the text by CAPITAL LETTERS
    // finds all the matches of beginning of line, folloed by n number of capital letters, followed by end of line

    const entryExp = /^([A-Z; ]+)$/gm

    const parts: DictionaryEntry[] = []

    let match
    let lastIndex = 0
    let lastWord = ''
    while ((match = entryExp.exec(text)) !== null) {
      let raw = match.input.slice(lastIndex, match.index)
      let splitByNewLine = raw.split('\n\n')
      let chunk1 = splitByNewLine[0].replace(lastWord, '')
      let etymology_index = chunk1.search(/Etym:/)
      let etymology, prounciation
      let definitions : string[] = []
      let synonyms

      if (etymology_index > -1) {
        etymology = chunk1.slice(etymology_index + 5).trim()
        prounciation = chunk1.slice(0, etymology_index - 1).trim()
      } else {
        prounciation = chunk1.trim()
      }

      const rest = splitByNewLine.slice(1)

      rest.forEach(chunk => {
        if (chunk.startsWith('Defn:')) {
          definitions.push(chunk.replace('Defn:', '').trim())
        } else if (chunk.startsWith('Etym:')) {
          etymology = chunk.replace('Etym:', '').trim()
        } else if (chunk.startsWith('Syn.')) {
          synonyms = chunk.replace('Syn.', '').trim()
        } else {
          if (chunk.trim()) definitions.push(chunk.trim())
        }
      })

      // let chunks = raw.replace(lastWord + '\n', '').split(',')
      // let prounciation = chunks[0].trim()
      // let definition_index = raw.search(/Defn:/)
      // let prounciation = etymology_index > -1 ? raw.slice(0, etymology_index - 1).trim() : undefined
      // let definition =
      // definition_index > -1 ? raw.slice(definition_index + 5).trim() : undefined
      // let etymology = etymology_index > -1 ? raw.slice(etymology_index + 5, definition_index - 1).trim() : undefined
      // let others = (chunks[1] || '').replace(etymology || '', '').replace(definition || '', '').replace('Defn:', '').replace('Etym:', '').trim()

      if (lastWord) {
        parts.push({
          startIndex: lastIndex,
          endIndex: match.index,
          word: lastWord,
          raw,
          prounciation,
          definitions,
          etymology,
          synonyms,
          // others
        })
      }

      lastIndex = match.index
      lastWord = match[0]
    }

    // const words = text.match(/^([A-Z; ]+)$/gm)
    // // loops over the matches
    // words?.forEach((a, b, c) => {
    //     debugger
    // })

    // console.log(parts)
    // console.log(parts.filter(p => p.synonyms))
    renderList(parts)

  })
