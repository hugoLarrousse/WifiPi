const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const server = require('http').createServer(app); //eslint-disable-line
exports.io = require('socket.io')(server);

const cli = require('./src/index');

cli.initialize();

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
    cli.notifyPi('connection');
    const { ssid, mac, password } = req.body;
    if (!ssid || !mac) {
      return res.status(400).send({ error: true, message: 'body incomplete' });
    }

    res.status(200).send({ message: 'ok' });
    cli.notifyPi('connection');
    await cli.addNetworkToConfigFile(ssid, password);
    return 1;
  } catch (e) {
    console.log('credentials errors', e.message);
    return 1;
  }
});

app.get('/network', (req, res) => {
  const networks = cli.getNetworks();
  cli.notifyPi('paired');
  res.status(networks ? 200 : 400).send(networks || { message: 'error' });
});

app.get('/pi/pair', (req, res) => {
  res.sendFile('html/pi.html', { root: __dirname });
  setTimeout(() => {
    cli.notifyPi('lookingForInternet');
  }, 2000);
});

app.all('/*', (req, res) => {
  res.sendFile('html/network.html', { root: __dirname });
});


server.listen(3000, () => {
  console.log('WifiPi API is running on port 3000');
});
