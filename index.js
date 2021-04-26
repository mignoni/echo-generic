const log4js = require("log4js");
const loggerEcho = log4js.getLogger("echo");
loggerEcho.level = "info";

const config = require("./config");

const jwt = require('express-jwt');
const getPublicKey = require('./lib/getPublicKey');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8080;

function ResponseEcho(list) {
    this.countArray = list.length;
    this.lastDate = list[this.countArray - 1].receivedDate;
    this.list = list;
}

function ItemEcho(body, receivedDate, withAuthentication) {
    this.body = body;
    this.receivedDate = new Date(receivedDate).toISOString();
    this.receivedDateMili = receivedDate;
    this.withAuthentication = withAuthentication;
}

app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({extended: false, type: '*/*'}));

let withAuthentication = false;
if (config.AUTH0_DOMAIN && config.RESOURCE_SERVER) {

    withAuthentication = true;

    loggerEcho.info('Aplicação echo-generic COM autenticação');
    loggerEcho.info('AUTH0_DOMAIN: ' + config.AUTH0_DOMAIN);
    loggerEcho.info('RESOURCE_SERVER: ' + config.RESOURCE_SERVER);

    const jwtCheck = jwt({
        secret: getPublicKey(config.AUTH0_DOMAIN),
        audience: config.RESOURCE_SERVER,
        algorithms: ['RS256'],
        issuer: `https://${config.AUTH0_DOMAIN}/`
    });

    app.use('/auth/*', jwtCheck, function (req, res, next) {
        if (req.user) {
            loggerEcho.info('Auth: Current user: ' + req.user.sub + ' (scope=' + (req.user.scope || 'N/A') + ')');
        }
        next();
    });
} else {
    loggerEcho.info('Aplicação echo-generic SEM autenticação');
}

app.all('/*', (req, res) => {

    let dataChegou = Date.now();

    res.setHeader("X-response-date", new Date(dataChegou).toISOString());

    if ("DELETE" === req.method) {
        app.set(req.originalUrl, null);
        return res.sendStatus(200);
    }

    if ("POST" === req.method) {

        let lista = app.get(req.originalUrl);
        if (!lista) {
            lista = [];
        }

        let itemEcho = new ItemEcho(req.body, dataChegou, withAuthentication);
        lista.push(itemEcho);

        app.set(req.originalUrl, lista);
        app.set("date_" + req.originalUrl, itemEcho.receivedDate);

        return res.sendStatus(200);
    }

    let salvedBody;

    if ("GET" === req.method) {

        salvedBody = app.get(req.originalUrl);

    }
    loggerEcho.log('req: ' + req.originalUrl);

    if (salvedBody) {
        if (!salvedBody) {
            salvedBody = [];
        }
        let responseEcho = new ResponseEcho(salvedBody);

        return res.send(responseEcho);
    } else {
        return res.sendStatus(404);
    }
})

app.listen(port, () => {
    loggerEcho.log(`App listening at https://------:${port}`)
})

