const express = require('express');
const bodyParser = require('body-parser');
const cli = require('./src/index');

const app = express();
const server = require('http').createServer(app); //eslint-disable-line

cli.initialize();

// const chromium = require('chromium');
// const {execFile} = require('child_process');

// execFile(chromium.path, ['https://google.com'], err => {
//    console.log('Hello Google!');
// });

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});
app.use(express.static(__dirname));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/credentials', async (req, res) => {
  try {
    const { ssid, mac, password } = req.body;
    if (!ssid || !mac) {
      res.status(400).send({ error: true, message: 'body incomplete' });
    } else {
      res.status(200).send({ message: 'ok' });
    }
    await cli.addNetworkToConfigFile(ssid, password);
  } catch (e) {
    console.log('credentails errors', e.message);
  }
});

app.get('/network', (req, res) => {
  const networks = cli.getNetworks();
  res.status(networks ? 200 : 400).send(networks || { message: 'error' });
});

app.all('/*', (req, res) => {
  // Just send the index.html for other files to support HTML5Mode
  res.sendFile('index.html', { root: __dirname });
});


server.listen(3000, () => {
  console.log('ScanWifi API is running on port 3000');
});
