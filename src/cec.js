const CecController = require('cec-controller');

exports.stop = () => new Promise((resolve, reject) => {
  const cecCtl = new CecController();
  cecCtl.on('ready', async (controller) => {
    if (!controller) {
      return reject();
    }
    if (controller.dev4) {
      await controller.dev4.turnOff();
    }
    return resolve();
  });
  cecCtl.on('error', (error) => {
    console.log(error);
    reject();
  });
});

exports.start = () => new Promise((resolve, reject) => {
  const cecCtl = new CecController();
  cecCtl.on('ready', async (controller) => {
    if (!controller) {
      return reject();
    }
    if (controller.dev4) {
      await controller.dev4.turnOn();
    }
    return resolve();
  });
  cecCtl.on('error', (error) => {
    console.log(error);
    reject(error);
  });
});

exports.test = () => new Promise((resolve, reject) => {
  const cecCtl = new CecController();
  cecCtl.on('ready', (controller) => {
    resolve(controller && controller.dev4);
  });
  cecCtl.on('error', (error) => {
    console.log(error);
    reject(error);
  });
});
