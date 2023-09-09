// fetch sample.txt

type DictionaryEntry = {
  startIndex: number
  endIndex: number
  raw: string
  word: string
  prounciation?: string
  definition?: string
  examples?: string[]
  synonyms?: string[]
  antonyms?: string[]
  related?: string[]
  etymology?: string
  others?: string
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
      // let chunks = raw.replace(lastWord + '\n', '').split(',')
      // let prounciation = chunks[0].trim()
      let definition_index = raw.search(/Defn:/)
      let etymology_index = raw.search(/Etym:/)
      let prounciation = etymology_index > -1 ? raw.slice(0, etymology_index - 1).trim() : undefined
      let definition =
        definition_index > -1 ? raw.slice(definition_index + 5).trim() : undefined
      let etymology = etymology_index > -1 ? raw.slice(etymology_index + 5, definition_index - 1).trim() : undefined
      // let others = (chunks[1] || '').replace(etymology || '', '').replace(definition || '', '').replace('Defn:', '').replace('Etym:', '').trim()

      if (lastWord) {
        parts.push({
          startIndex: lastIndex,
          endIndex: match.index,
          word: lastWord,
          raw,
          prounciation,
          definition,
          etymology,
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

    console.log(parts)

    debugger
  })
