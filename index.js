const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8080;

function ResponseEcho(list) {
    this.countArray = list.length;
    this.lastDate = list[this.countArray-1].receivedDate;
    this.list = list;
}

function ItemEcho(body, receivedDate) {
    this.body = body;
    this.receivedDate = new Date(receivedDate).toISOString();
    this.receivedDateMili = receivedDate;
}

app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({extended: false, type: '*/*'}));


app.all('/*', (req, res) => {

    let dataChegou = Date.now();

    res.setHeader("X-response-date", new Date(dataChegou).toISOString());

    if ("DELETE" == req.method) {
        app.set(req.originalUrl, null);
        return res.sendStatus(200);
    }

    if ("POST" == req.method) {

        let lista = app.get(req.originalUrl);
        if(!lista){
            lista = [];
        }

        let itemEcho = new ItemEcho(req.body, dataChegou);
        lista.push(itemEcho);

        app.set(req.originalUrl, lista);
        app.set("date_"+req.originalUrl, itemEcho.dataRecebido);

        return res.sendStatus(200);
    }

    let salvedBody;

    if ("GET" == req.method) {

        salvedBody = app.get(req.originalUrl);

    }
    console.log('req: ' + req.originalUrl);

    if(salvedBody){
        if(!salvedBody){
            salvedBody = [];
        }
        let responseEcho = new ResponseEcho(salvedBody);

        return res.send(responseEcho);
    }else{
        return res.sendStatus(404);
    }
})

app.listen(port, () => {
    console.log(`App listening at http://------:${port}`)
})
