const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({extended: false, type: '*/*'}));


app.all('/*', (req, res) => {

    res.setHeader("X-response-date", new Date(Date.now()).toISOString());

    if ("POST" == req.method) {
        app.set(req.originalUrl, req.body);
        app.set("date_"+req.originalUrl, Date.now());
        return res.sendStatus(200);
    }

    let salvedBody;

    if ("GET" == req.method) {
        salvedBody = app.get(req.originalUrl);
    }
    console.log('req: ' + req.originalUrl);

    if(salvedBody){
        res.setHeader("X-received-date-call-back", new Date(app.get("date_"+req.originalUrl)).toISOString());
        return res.send(salvedBody);
    }else{
        return res.sendStatus(404);
    }
})

app.listen(port, () => {
    console.log(`App listening at http://------:${port}`)
})
