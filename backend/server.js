
//Node imports
const http = require('http');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const path = require('path');
const { exit } = require('process');
const monk = require('monk');
const fetch = require('node-fetch');

//My imports
const IDGenerator = require('./modules/IDGenerator.js');
const URLService = require('./modules/URLService.js');
const AnalyticsService = require('./modules/AnalyticsService.js');
const urlUtil = require('./common/utils.js');
const errors = require('./common/errors.js');

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
//Constants
const PORT = process.env.PORT || 8020;
const DBLINK = process.env.DBLINK;

const app = express();
const server = http.createServer(app);

function initDB() {
    const db = monk(DBLINK);

    //Weird hack; monk apparently doesn't return a ES6 Promise. Why????????? 

    db.then = null; //Null out the custom then method on the db object

    //Setup a promise listening for open and error events
    return new Promise(function (resolve, reject) {
        db.once('open', function () {
            console.log("Connected to DB");
            resolve(db);
        });
        db.once('error-opening', function (err) {
            console.log("Couldn't connect to DB");
            reject(err);
        });
    });
}

app.use(cors({
    origin: process.env.FRONTEND_HOST,
    optionsSuccessStatus: 200
}));
app.use(bodyParser.json());
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

/*
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.htm'));
});*/
function getIP(req) {

    let x_forwarded = req.headers["x-forwarded-for"];
    let x_forwarded_ip;
    if (x_forwarded) {
        x_forwarded_ip = x_forwarded.split(',');
        x_forwarded_ip = x_forwarded_ip[x_forwarded_ip.length - 1];
    }
    return x_forwarded_ip || req.ip;
}
app.get(`/:shortID`, async function (req, res) {
    let shortID = req.params.shortID;
    let data;
    if (IDGenerator.potentiallyValidShortID(shortID) && (data = await URLService.getData(shortID))) {

        let ip = getIP(req);
        console.log(ip);

        res.json({ link: data.link });
        await AnalyticsService.updateData(data.analyticsID, ip);
    }
    else
        res.json({ error: errors.UNKNOWN_SHORT_ID });
});

async function validRecaptcha(clientToken, ip) {
    let result = { success: false };
    try {
        let resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `secret=${encodeURIComponent(process.env.RECAPTCHA_KEY)}&response=${encodeURIComponent(clientToken)}&remoteip:${encodeURIComponent(ip)}`
        });
        let respData = await resp.json();

        if (!respData.success || respData.score < 0.5) {
            result.error = errors.BAD_CAPTCHA;
            console.log(respData['error-codes']);
        }
        else
            result.success = true;
    } catch (err) {
        console.log(err);
        result.error = errors.INTERNAL_SERVER_ERROR;
    }
    return result;
}

app.post('/generate', async function (req, res) {
    let captchaResult = await validRecaptcha(req.body.recaptchaToken, getIP(req));
    if (!captchaResult.success) {
        console.log("Captcha failed");
        res.json({
            error: captchaResult.error
        });
        return;
    }
    if (urlUtil.validUrl(req.body.url)) {
        let idPair = await IDGenerator.get();

        await URLService.createRedirect(req.body.url, idPair.shortID, idPair.analyticsID);
        res.json(idPair);
    }
    else
        res.json({
            error: errors.INVALID_URL
        });
});





const wss = new WebSocket.Server({ server, path: '/analytics' });
const INITIALIZATION_TIMEOUT = 5000;

wss.on('connection', function (socket) {

    let initTimeout = setTimeout(() => {

        socket.send(JSON.stringify({ error: errors.NO_ANALYTICS_ID }));
        socket.terminate();
        console.log("Closing socket");
    }, INITIALIZATION_TIMEOUT);

    socket.once('message', async (message) => {
        let { analyticsID } = JSON.parse(message);
        clearTimeout(initTimeout);


        let _data;//Don't want 2 DB calls 
        if (_data = await AnalyticsService.getData(analyticsID))
            await AnalyticsService.addListener(_data, analyticsID, socket);
        else {
            socket.send(JSON.stringify({ error: errors.INVALID_ANALYTICS_ID }));
            socket.terminate();
        }
    });
});



(async function () {
    try {
        let db = await initDB();

        //Bypass heroku timeout to give time for id generation if required
        /*
        let bypassServer = new http.Server();

        bypassServer.listen(PORT, function () {
            console.log(`Bypassing heroku on ${PORT}`);
        });

        bypassServer.close();
        */
        await IDGenerator.init(db);
        await URLService.init(db);
        await AnalyticsService.init(db);

        server.listen(PORT, function () {
            console.log(`Listening on ${PORT}`);
        });
    } catch (e) {
        console.log(e);
        console.log("Exiting... Bye Bye... :(");
        exit(-1);
    }
})();
