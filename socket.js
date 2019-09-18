const ioH7 = require('socket.io-client');
require('dotenv').config();

const { io } = require('./server');
const timeout = require('./src/utils');
const managePi = require('./src/managePi');

const { socketUrl } = process.env;
console.log('socketUrl', socketUrl);

exports.initializeSocketH7 = (serial) => {
  const socketH7 = ioH7.connect(socketUrl, { secure: true, reconnect: true });

  socketH7.on('connect', () => {
    setTimeout(() => {
      socketH7.emit('newPi', serial);
    }, 1000);
  });

  socketH7.on('need_reboot_pi', async (serialToReboot) => {
    console.log('serial inside reboot', serial);
    if (serialToReboot === serial) {
      managePi.needReboot();
    }
  });
};

let socketGlobal = null;

exports.sendMessage = async (message) => {
  await timeout(1000);
  socketGlobal.emit('message', message);
};

io.on('connection', (socket) => {
  socketGlobal = socket;
});
