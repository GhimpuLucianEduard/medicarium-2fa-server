const port = 3000
const http = require('http')
const WebSocket = require('ws');
const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const { check, validationResult } = require('express-validator/check');
const app = express()

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use((req, res, next) => {

    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')

    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE')
        return res.status(200).json({})
    }
    next()
});

app.post('/2fa',[
    check('code').isLength({ min: 4}),
    check('number').isLength({min: 10})
], (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
    }

    if (smsSlave && smsSlave.readyState === WebSocket.OPEN) {
        smsSlave.send(JSON.stringify(req.body))
        console.log(`sms sent to ${req.body.number}, code: ${req.body.code} and text: ${req.body.text}` )
        res.status(200).json({msg: 'sms sent'})
    } else {
        res.status(500).json({error: "No SMS slave connected"})
    }

    return res
});

app.use((req, res, next) => {
    const error = new Error('Not Found')
    error.status = 404
    next(error)
});

app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({
        error: error.message
    })
});

const server = http.createServer(app)
const wsServer = new WebSocket.Server({port: 8080});
var smsSlave = null

wsServer.on('connection', ws => {
    console.log("SMS slave connected")
    smsSlave = ws
})

setInterval(() => {
    if (smsSlave) {
        console.log(`Sms with state: ${smsSlave.readyState}`)
    } else {
        console.log(`No SMS slave connected`)
    }
}, 60000)

server.listen(port)
