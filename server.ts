import { Application, send } from "https://deno.land/x/oak@v6.3.1/mod.ts"
import { acceptWebSocket, WebSocket } from "https://deno.land/std@0.73.0/ws/mod.ts"

const app = new Application()
console.log(`Chat server is running on 8080`)

let users: WebSocket[] = []

app.use(async (ctx) => {
  try {
    const { conn, r: bufReader, w: bufWriter, headers } = ctx.request.serverRequest

    let socket = await acceptWebSocket({
      conn,
      bufReader,
      bufWriter,
      headers,
    })

    try {
      try {
        await handleWs(socket)
      } catch (err) {
        console.error(`failed to receive frame: ${err}`)

        if (!socket.isClosed) {
          await socket.close(1000).catch(console.error)
        }
      }
    } catch (err) {
      console.log(err)
      await socket.send(JSON.stringify({
        type: "fail"
      }))
      socket.close()
    }
  } catch {
    await send(ctx, ctx.request.url.pathname, {
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    })
  }
})

async function handleWs(socket: WebSocket) {
  for await (const event of socket) {
    if (typeof event === "string") {
      const parsedEvent = JSON.parse(event)
      if (parsedEvent.type === "open") {
        console.log("Connection established with a client.")
        users.push(socket)

        await socket.send(JSON.stringify({
          type: "message",
          data: {
            name: "SERVER",
            message: "Hello, welcome to the webchat!"
          }
        }))
      } else if (parsedEvent.type === "message") {
        console.dir(parsedEvent)
        users = users.filter(user => {
          try {
            user.send(JSON.stringify(parsedEvent))
            return true
          } catch { // User closed connection
            return false
          }
        })
        console.log(`There ${users.length === 1 ? "is" : "are"} ${users.length} ${users.length === 1 ? "user" : "users"} online`)
      }
    }
  }
}

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${
    hostname ?? "localhost"
    }:${port}`
  )
})

await app.listen({ port: 8000 })