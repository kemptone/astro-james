import type { DictionaryEntry } from './Dictionary.types'

export async function loader(parts : DictionaryEntry[] = []) {
  // await fetch('/dictionary/sample.txt')
  await fetch('/dictionary/WebstersEnglishDictionary.txt')
    .then(response => {
      return response.text()
    })
    .then(text => {
      console.log(text)

      // split the text by CAPITAL LETTERS
      // finds all the matches of beginning of line, followed by n number of capital letters, followed by end of line

      const entryExp = /^([A-Z; ]+)$/gm


      let match
      let lastIndex = 0
      let lastWord = ''
      while ((match = entryExp.exec(text)) !== null) {
        let raw = match.input.slice(lastIndex, match.index)
        let splitByNewLine = raw.split('\n\n')
        let chunk1 = splitByNewLine[0].replace(lastWord, '')
        let etymology_index = chunk1.search(/Etym:/)
        let etymology, prounciation
        let definitions: string[] = []
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

        if (lastWord) {

          let [ word, ...alternatives ] = lastWord.split('; ')

          parts.push({
            startIndex: lastIndex,
            endIndex: match.index,
            word,
            alternatives,
            raw,
            prounciation,
            definitions,
            etymology,
            synonyms,
          })
        }

        lastIndex = match.index
        lastWord = match[0]
      }
    })

  return parts
}
