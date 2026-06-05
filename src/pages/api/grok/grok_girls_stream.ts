const XAI_API_KEY = import.meta.env.XAI_API_KEY // 'grok key';

type StyleProfile = {
  opening: string
  notice: string
  attitudeGood: string
  attitudeBad: string
  teacherGood: string
  teacherBad: string
  classGood: string
  classBad: string
  endingGood: string
  endingBad: string
}

const STYLE_PROFILES: Record<string, StyleProfile> = {
  '0': {
    opening: 'in the worst possible way',
    notice: 'the whole moment felt rough right away',
    attitudeGood: 'but it still came out clumsy and uncomfortable',
    attitudeBad: 'everything about it felt harsh and ugly',
    teacherGood: 'even the teacher sounded disappointed by how messy it felt',
    teacherBad: 'the teacher sounded very upset and serious about it',
    classGood: 'Other students saw the effort, but the moment still felt bad',
    classBad: 'Other students could tell the moment had gone badly',
    endingGood: 'ended the day wishing the good idea had come out better',
    endingBad: 'ended the day understanding the moment had gone as badly as it could',
  },
  '1': {
    opening: 'in a very bad way',
    notice: 'the moment quickly felt unpleasant',
    attitudeGood: 'but it still sounded rough and awkward',
    attitudeBad: 'it came across as very mean and troubling',
    teacherGood: 'the teacher could tell the intention was better than the result',
    teacherBad: 'the teacher had a very hard reaction to it',
    classGood: 'Other students saw that it was meant well, even though it felt off',
    classBad: 'Other students could see the moment had turned ugly',
    endingGood: 'ended the day wanting to handle the same good choice in a better way next time',
    endingBad: 'ended the day knowing the moment had gone very badly',
  },
  '2': {
    opening: 'in a rough way',
    notice: 'the whole moment felt shaky',
    attitudeGood: 'but it came out uneven and awkward',
    attitudeBad: 'the moment felt rough from start to finish',
    teacherGood: 'the teacher noticed that the action was good even if the moment was rough',
    teacherBad: 'the teacher reacted with clear concern',
    classGood: 'Other students could see the kindness, even through the awkward moment',
    classBad: 'Other students could tell it was a rough scene',
    endingGood: 'ended the day knowing the good choice needed a better moment around it',
    endingBad: 'ended the day understanding why the moment felt so rough',
  },
  '3': {
    opening: 'in a not very good way',
    notice: 'it made the moment feel off',
    attitudeGood: 'but it still felt a little clumsy',
    attitudeBad: 'it left a sour feeling in the room',
    teacherGood: 'the teacher tried to focus on the good part of the choice',
    teacherBad: 'the teacher had to step in because it was clearly not going well',
    classGood: 'Other students noticed the good choice, even if the moment was not smooth',
    classBad: 'Other students could tell the choice was causing a bad moment',
    endingGood: 'ended the day knowing it was a good choice in a not-so-good moment',
    endingBad: 'ended the day understanding why the moment felt wrong',
  },
  '4': {
    opening: 'in a slightly weak way',
    notice: 'the moment felt a little flat',
    attitudeGood: 'the kindness came across a little weakly',
    attitudeBad: 'the trouble felt a little too easy to notice',
    teacherGood: 'the teacher appreciated it, but the moment still felt a little weak',
    teacherBad: 'the teacher spoke about it in a disappointed voice',
    classGood: 'Other students could see it was good, even if the moment was not very strong',
    classBad: 'Other students could see the moment had slipped in the wrong direction',
    endingGood: 'ended the day knowing the choice was good, even if the moment felt weak',
    endingBad: 'ended the day understanding why the choice caused trouble in a weak moment',
  },
  '5': {
    opening: 'in a plain and neutral way',
    notice: 'the moment felt ordinary',
    attitudeGood: 'the kindness came across in a regular way',
    attitudeBad: 'the trouble showed up in a plain way',
    teacherGood: 'the teacher treated it as a regular good moment',
    teacherBad: 'the teacher treated it as a regular problem that needed attention',
    classGood: 'Other students saw it as a normal good example',
    classBad: 'Other students saw it as a normal bad moment',
    endingGood: 'ended the day with a normal good memory of the moment',
    endingBad: 'ended the day understanding why the choice caused trouble',
  },
  '6': {
    opening: 'in a pretty good way',
    notice: 'the moment felt a bit stronger',
    attitudeGood: 'the kindness showed clearly',
    attitudeBad: 'the trouble stood out more than usual',
    teacherGood: 'the teacher responded warmly to it',
    teacherBad: 'the teacher responded firmly because it stood out',
    classGood: 'Other students could clearly see that it was a good moment',
    classBad: 'Other students could clearly see the trouble it caused',
    endingGood: 'ended the day feeling pretty good about the moment',
    endingBad: 'ended the day understanding why the stronger moment caused trouble',
  },
  '7': {
    opening: 'in a strong way',
    notice: 'the moment felt important',
    attitudeGood: 'the kindness felt strong and clear',
    attitudeBad: 'the trouble landed in a strong and obvious way',
    teacherGood: 'the teacher made it clear that the moment mattered',
    teacherBad: 'the teacher made it clear that the moment was serious',
    classGood: 'Other students could tell it was a strong good example',
    classBad: 'Other students could tell the moment had gone strongly in the wrong direction',
    endingGood: 'ended the day feeling that the moment had really mattered',
    endingBad: 'ended the day understanding why the strong moment caused trouble',
  },
  '8': {
    opening: 'in a very strong way',
    notice: 'the moment stood out right away',
    attitudeGood: 'the kindness felt powerful and easy to notice',
    attitudeBad: 'the trouble felt heavy and obvious',
    teacherGood: 'the teacher spoke about it like a standout moment',
    teacherBad: 'the teacher spoke about it like a major problem',
    classGood: 'Other students could see it was one of the stronger good moments of the day',
    classBad: 'Other students could see it had become one of the rougher moments of the day',
    endingGood: 'ended the day knowing the moment had stood out in a good way',
    endingBad: 'ended the day understanding why the strong moment caused so much trouble',
  },
  '9': {
    opening: 'in an excellent way',
    notice: 'the whole moment felt big',
    attitudeGood: 'the kindness came across beautifully',
    attitudeBad: 'the trouble felt intense right away',
    teacherGood: 'the teacher treated it like a truly excellent moment',
    teacherBad: 'the teacher treated it like an intensely bad moment',
    classGood: 'Other students could see it was an unusually good example',
    classBad: 'Other students could see it was an unusually bad moment',
    endingGood: 'ended the day feeling proud of how good the moment had been',
    endingBad: 'ended the day understanding why the intense moment caused so much trouble',
  },
  '10': {
    opening: 'in the best possible way',
    notice: 'the whole moment felt remarkable',
    attitudeGood: 'the kindness came across at its very best',
    attitudeBad: 'the trouble felt extreme and impossible to miss',
    teacherGood: 'the teacher treated it like one of the best moments of the day',
    teacherBad: 'the teacher treated it like one of the worst moments of the day',
    classGood: 'Other students could see it was the kind of good moment people remember',
    classBad: 'Other students could see it was the kind of bad moment people remember',
    endingGood: 'ended the day with one of the best moments they could have hoped for',
    endingBad: 'ended the day understanding why the extreme moment caused so much trouble',
  },
}

function getStyleTone(styleScore: string) {
  return STYLE_PROFILES[styleScore] || STYLE_PROFILES['4']
}

function getMomentCategory(styleScore: string) {
  const score = Number(styleScore)

  if (score < 5) {
    return 'trouble'
  }

  if (score > 5) {
    return 'good'
  }

  return 'neutral'
}

function buildFallbackStory(body: Record<string, string>) {
  const personName = body.person_name || body.girl || 'This person'
  const choice = body.choice || body.bad_thing || 'made a choice at school'
  const styleScore = body.style_score || '4'
  const behaviorScore = body.behavior_score || '1000'
  const whatHappened =
    body.what_happened || body.got_caught || 'the teacher noticed right away'
  const normalizedChoice = choice.toLowerCase()
  const goodKeywords = [
    'help',
    'share',
    'kind',
    'respect',
    'homework',
    'focus',
    'clean',
    'encourag',
    'truth',
    'follow',
    'quiet',
  ]
  const isGoodChoice = goodKeywords.some(keyword =>
    normalizedChoice.includes(keyword)
  )
  const styleTone = getStyleTone(styleScore)
  const momentCategory = getMomentCategory(styleScore)

  const lines =
    momentCategory === 'good'
      ? [
          `${personName} had Behavior Number Day at school and chose ${choice} ${styleTone.opening}.`,
          `Everyone noticed because ${whatHappened}, ${styleTone.notice}.`,
          `${personName} handled the moment in a no-trouble way, and ${
            isGoodChoice ? styleTone.attitudeGood : 'the moment still sounded clearly good'
          }.`,
          `The teacher said that choice matched a strong school behavior score of ${behaviorScore}, and ${styleTone.teacherGood}.`,
          `${styleTone.classGood}.`,
          `${personName} ${styleTone.endingGood}.`,
        ]
      : momentCategory === 'neutral'
        ? [
            `${personName} had Behavior Number Day at school and chose ${choice} ${styleTone.opening}.`,
            `Everyone noticed because ${whatHappened}, ${styleTone.notice}.`,
            `${personName} moved through the moment without trouble, and ${
              isGoodChoice ? styleTone.attitudeGood : 'the mood stayed plain and balanced'
            }.`,
            `The teacher said that choice matched a school behavior score of ${behaviorScore}, and ${
              isGoodChoice ? styleTone.teacherGood : 'the teacher treated it like a regular moment that needed attention'
            }.`,
            `${isGoodChoice ? styleTone.classGood : 'Other students saw it as a normal classroom moment'}.`,
            `${personName} ${
              isGoodChoice
                ? 'ended the day with a calm and ordinary memory of the moment'
                : 'ended the day understanding the moment without it turning into trouble'
            }.`,
          ]
        : [
            `${personName} had Behavior Number Day at school and chose ${choice} ${styleTone.opening}.`,
            `The problem grew bigger because ${whatHappened}, ${styleTone.notice}.`,
            `${personName} moved through a trouble moment, and ${
              isGoodChoice ? 'even the good choice still landed badly in that moment' : styleTone.attitudeBad
            }.`,
            `${personName} was told that the school behavior score for that choice was ${behaviorScore}, and ${styleTone.teacherBad}.`,
            `${styleTone.classBad}.`,
            `${personName} ${styleTone.endingBad}.`,
          ]

  return lines.join(' ')
}

const fetchChatCompletionStream = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content:
          'Based on a JSON prompt, build a school story. Use the following properties from the JSON to build the story. person_name = the person name, choice = what they chose to do and it can be good or bad, style_score = a separate 0 to 10 rating for how good the moment is. Scores below 5 mean the moment is trouble. Score 5 is neutral. Scores above 5 mean the moment is good, and 6 should clearly feel like no trouble. Do not say the style_score number directly in the story. Instead, let it change the wording and whether the full moment feels troubling, neutral, or good. behavior_score = what school behavior score they got on a 1 to 2052 scale where 1000 is the best score, what_happened = what happened next. The result should be about 6 sentences.',
      },
      {
        role: 'user',
        content: JSON.stringify(body),
      },
    ],
    model: 'grok-beta',
    stream: true, // Enable streaming
    temperature: 1,
  }

  let json

  try {
    json = JSON.stringify(requestBody)
  } catch (error) {
    console.error('something is wrong with the requestBody', body, error)
    return null
  }

  if (!XAI_API_KEY) {
    return null
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: json,
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.body // Return the readable stream
  } catch (error) {
    console.error('Failed to fetch chat completion:', error)
    throw error
  }
}

// Streaming handler for Astro API route
export const prerender = false

export async function POST({request}: {request: Request}) {
  let body
  try {
    body = await request.json() // Attempt to parse JSON
  } catch (error) {
    console.error('Failed to parse request body as JSON:', error)
    return new Response(JSON.stringify({error: 'Invalid JSON format'}), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const stream = await fetchChatCompletionStream(body)
    if (!stream) {
      return new Response(`data: ${JSON.stringify({
        choices: [{delta: {content: buildFallbackStory(body)}}],
      })}\n\ndata: [DONE]\n\n`, {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
        },
      })
    }

    // Stream the response to the client
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Error handling streaming:', error)
    return new Response(
      `data: ${JSON.stringify({
        choices: [{delta: {content: buildFallbackStory(body)}}
        ],
      })}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
        },
      }
    )
  }
}
