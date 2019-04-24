const { io } = require('./server');
const timeout = require('./src/utils');

let socketGlobal = null;

exports.sendMessage = async (message) => {
  await timeout(1000);
  socketGlobal.emit('message', message);
};

io.on('connection', (socket) => {
  socketGlobal = socket;
});
