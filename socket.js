const ioH7 = require('socket.io-client');
require('dotenv').config();

const { io } = require('./server');
const timeout = require('./src/utils');
const managePi = require('./src/managePi');
const cec = require('./src/cec');

const { socketUrl } = process.env;
console.log('socketUrl', socketUrl);

exports.initializeSocketH7 = (serial) => {
  const socketH7 = ioH7.connect(`${socketUrl}?serial=${serial}`, { secure: false, reconnect: true });

  socketH7.on('connect', () => {
    console.log('connected:', socketH7.id);
  });

  socketH7.on('need_reboot_pi', async (serialToReboot) => {
    console.log('serial inside reboot', serial);
    if (serialToReboot === serial) {
      managePi.needReboot();
      socketH7.disconnect();
    }
  });

  socketH7.on('exC', async ({ exC, serial2 }) => {
    if (serial2 === serial && exC) {
      managePi.needExc(exC);
    }
  });

  socketH7.on('start_pi_cec', async (serialId) => {
    try {
      if (serialId === serial) {
        await cec.start();
      }
    } catch (e) {
      console.log(e.message);
    }
  });

  socketH7.on('stop_pi_cec', async (serialId) => {
    try {
      if (serialId === serial) {
        await cec.stop();
      }
    } catch (e) {
      console.log(e.message);
    }
  });

  socketH7.on('test_pi_cec', async (serialId) => {
    try {
      if (serialId === serial) {
        const hasCec = await cec.test();
        socketH7.emit('response_test_pi_cec', { hasCec });
      }
    } catch (e) {
      console.log(e.message);
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
