let score

window.addEventListener('DOMContentLoaded', _ => {
    const cvs = document.getElementById("canvas")
    const fg = document.getElementById("fg")
    const ctx = cvs.getContext("2d")
    const scoreValue = document.getElementById("score")
    const name = document.getElementById("name")
    const message = document.getElementById("message")
    const send = document.getElementById("send")
    const restart = document.getElementById("replay")
    const background = document.getElementById("background")

    let ws = new WebSocket(`wss://${window.location.host}`)

    cvs.width = window.innerWidth
    cvs.height = window.innerHeight

    const bird = new Image()
    const pipeNorth = new Image()
    const pipeSouth = new Image()

    bird.src = "images/bird.png"
    pipeNorth.src = "images/pipeNorth.png"
    pipeSouth.src = "images/pipeSouth.png"

    const gap = 200
    const gravity = 3
    const speed = 5

    let bX
    let bY
    let pipe

    function keydown() {
        bY -= 100
    }

    function game() {
        bX = 100
        bY = 150
        score = 0

        pipe = []

        pipe[0] = {
            x: cvs.width,
            y: 0
        }

        document.addEventListener("keydown", keydown)

        // draw images
        function draw() {
            ctx.clearRect(0, 0, cvs.width, cvs.height)
            for (let i = 0; i < pipe.length; i++) {
                let southPipePosGap = pipeNorth.height + gap
                ctx.drawImage(pipeNorth, pipe[i].x, pipe[i].y)
                ctx.drawImage(pipeSouth, pipe[i].x, pipe[i].y + southPipePosGap)

                pipe[i].x -= 5

                console.log(pipe[i].x)

                let newPipeWhenOldPipeAt = cvs.width / 5 * 4

                if (pipe[i].x >= newPipeWhenOldPipeAt && pipe[i].x < newPipeWhenOldPipeAt + 5) {
                    console.log("test")
                    pipe.push({
                        x: cvs.width,
                        y: Math.floor(Math.random() * pipeNorth.height) - pipeNorth.height
                    })
                }

                // detect collision
                if (
                    bX + bird.width >= pipe[i].x
                    && bX <= pipe[i].x + pipeNorth.width
                    && (
                        bY <= pipe[i].y + pipeNorth.height
                        || bY + bird.height >= pipe[i].y + southPipePosGap
                    )
                    || bY + bird.height >= cvs.height - fg.scrollHeight
                ) {
                    document.removeEventListener("keydown", keydown)
                    return showChat()
                }

                if (pipe[i].x < 5 && pipe[i].x >= 0) {
                    score++
                    scoreValue.innerHTML = `Score: ${score}`
                }
            }

            // ctx.drawImage(fg, 0, cvs.height - fg.height)
            ctx.drawImage(bird, bX, bY, bird.width * 2, bird.height * 2)
            bY += gravity

            requestAnimationFrame(draw)
        }

        draw()
    }
    game()

    let charLimit = 0
    async function showChat() {
        charLimit = charLimit + score * 5

        document.getElementById("limit").innerHTML = charLimit
        fg.style.display = "none"
        cvs.style.display = "none"
        scoreValue.style.display = "none"
        document.getElementById("chat").style.display = ""
        background.style.display = ""

        send.addEventListener("click", sendMessage)
        message.addEventListener("keydown", keydown)
        restart.addEventListener("click", replay)

        function keydown(event) {
            document.getElementById("limit").innerHTML = charLimit - message.value.length
            if (event.key === "Enter") {
                event.preventDefault()
                sendMessage()
            }
        }
        function sendMessage() {
            if (name.value.trim() === "") {
                swal("Please enter your name", "", "warning")
            } else if (message.value.trim() === "") {
                swal("Please enter your message", "", "warning")
            } else if (message.value.length > charLimit) {
                swal("Character Limit Exceeded", "You can only type as many characters as 5 times the number of pipes you cross in Flappy Malte. Play again to gain more characters", "error")
            } else {
                ws.send(JSON.stringify({
                    type: "message",
                    data: {
                        name: name.value,
                        message: message.value
                    }
                }))
                charLimit -= (message.value.length - 1)
                message.value = ""
            }
        }

        function replay() {
            send.removeEventListener("click", sendMessage)
            message.removeEventListener("keydown", keydown)
            restart.removeEventListener("click", replay)

            document.getElementById("limit").innerHTML = ""
            fg.style.display = ""
            cvs.style.display = ""
            scoreValue.style.display = ""
            scoreValue.innerHTML = `Score: 0`
            
            document.getElementById("chat").style.display = "none"
            background.style.display = "none"

            score = 0
            bX = 100
            bY = 150

            pipe[0] = {
                x: cvs.width,
                y: 0
            }

            game()
        }
    }

    ws.onopen = function () {
        console.log("Socket connection is open")
        ws.send(JSON.stringify({ type: "open", data: {} }))
    }

    ws.onmessage = function (event) {
        console.log("Message received")
        const msg = JSON.parse(event.data)
        console.log(msg.data)
        addMessages(msg.data)
    }

    function addMessages(message) {
        console.log(message)
        document.getElementById("messageLog").insertAdjacentHTML(
            'beforeend',
            `<p><b>${message.name}</b>: ${message.message}</p>`
        )
    }
})