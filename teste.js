const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ extended: false, type: '*/*' }));

app.all('/*', (req, res) => {
  console.log('req: '+req.originalUrl);


  console.log('body: '+req.body);
  res.setHeader("headeDeRetorno", Date.now());


//iterating dinamically
let props = [];
for(let prop in req){
if(prop.substring(0, 1)!="_"){
	props.push(prop);
}

}

  res.json(JSON.stringify(req, props));
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
