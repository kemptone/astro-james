export class SSML extends HTMLElement {
    constructor() {
    super()
    }
}

if (typeof window != 'undefined') {
  customElements.define(
    'wc-ssml',
    SSML
  )
}

/*
<speak>
The root element that encapsulates all SSML content.

<voice>
Specifies the voice to be used for synthesis, including gender, language, or specific voice characteristics.

<prosody>
Adjusts the pitch, speaking rate, and volume of the speech.

<break>
Inserts a pause in the speech with a specified duration or strength.

<emphasis>
Adds emphasis to a word or phrase for varying degrees of prominence.

<say-as>
Defines how specific text (e.g., numbers, dates, times) should be interpreted or pronounced.

<sub>
Substitutes the text with an alternate spoken phrase.

<p>
Denotes a paragraph boundary for improved natural pauses.

<s>
Marks a sentence boundary for clarity in speech.

<phoneme>
Provides the pronunciation of a word using phonetic symbols.

<audio>
Embeds an audio clip into the synthesized speech.

<lang>
Changes the spoken language or accent for a section of text.

<mark>
Inserts a marker in the speech output for synchronization or tracking.

<par>
Plays multiple speech or audio elements in parallel.

<seq>
Plays multiple speech or audio elements sequentially.
*/
