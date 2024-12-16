const XAI_API_KEY = import.meta.env.XAI_API_KEY // 'grok key';

export const bad_stuff = [
  'passing notes in class',
  'lighting a girls hair on fire',
  'disrupting the school play',
  'making loud noises',
  'changing the settings on the teachers ipad',
  'Talking while the teacher is speaking',
  'Not following instructions',
  'Interrupting classmates',
  'Throwing paper or objects',
  'Using rude words',
  'Not doing homework',
  'Drawing on the desk',
  'Running around the classroom',
  'Teasing or making fun of others',
  'Refusing to participate in group work',
  'Ignoring classroom rules',
  'Playing with toys during lessons',
  'Arguing with the teacher',
  'Cheating on a test',
  'Refusing to share supplies',
  'Making loud noises',
  'Using a tablet or phone without permission',
  "Hiding another student's belongings",
  'Lying about completing assignments',
  'Talking back to the teacher',
  'Daydreaming and not paying attention',
  'Passing notes during class',
  'Mocking the teacher or imitating them disrespectfully',
  'Purposely spilling or making a mess',
  'Stealing another student’s items',
  'Pretending to be sick to avoid work',
  'Rolling eyes at the teacher or classmates',
  'Faking injuries for attention',
  'Sneaking snacks during lessons',
  'Making faces at the teacher or classmates',
  'Banging on desks or furniture loudly',
  'Complaining about assignments excessively',
  'Refusing to line up properly',
  'Shoving or pushing in line',
  'Making sarcastic or disrespectful comments',
  'Whispering secrets during quiet time',
  'Throwing tantrums when not getting their way',
  'Refusing to take turns during activities',
  'Blaming others for their own mistakes',
]

function getRandomBehavior(array: string[]) {
  const randomIndex = Math.floor(Math.random() * array.length)
  return array[randomIndex]
}

const fetchChatCompletion = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content:
          'In three sentences. Take the prompt as a Name of a girl. And this bad behavior, ' +
          getRandomBehavior(bad_stuff) +
          ', and create a short story how the girl got in trouble. Also, what color card did she get as punishment. The Black card is the worst.',
      },
      {
        role: 'user',
        content: body.prompt,
      },
    ],
    model: 'grok-beta',
    stream: false,
    temperature: 0,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    // const data = await response.json()
    // console.log(data)
    return response
    // return data
  } catch (error) {
    console.error('Failed to fetch chat completion:', error)
    return error
  }
}

//   fetchChatCompletion();

export const prerender = false
export async function POST({request}: {request: Request}) {
  const body = await request.json()
  // console.log({body})
  const results = (await fetchChatCompletion(body)) as Response
  if (results.ok) {
    const data = await results.json()
    return new Response(JSON.stringify(data), {status: 200})
  }
  return new Response(JSON.stringify({broken: true}), {status: 400})
}
