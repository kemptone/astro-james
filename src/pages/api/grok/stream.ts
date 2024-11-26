export const prerender = false

export async function POST({request}: {request: Request}): Promise<Response> {

  // Create a ReadableStream for streaming the response
  const stream = new ReadableStream({
    start(controller) {
      let count = 0

      // Function to send a chunk
      const sendChunk = () => {
        count++
        if (count <= 10) {
          const chunk = `Chunk ${count}\n`
          controller.enqueue(new TextEncoder().encode(chunk)) // Send chunk as encoded text
          setTimeout(sendChunk, 1000) // Send the next chunk after 1 second
        } else {
          controller.close() // Close the stream when done
        }
      }

      sendChunk()
    },
  })

  // Return the streamed response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    },
  })
}
