const CecController = require('cec-controller');

const findTVController = (controller) => {
  if (controller && controller.dev4 && controller.dev4.name === 'TV') return 4;
  if (controller && controller.dev0 && controller.dev0.name === 'TV') return 0;
  return null;
};

exports.stop = () => new Promise((resolve, reject) => {
  const cecCtl = new CecController();
  cecCtl.on('ready', async (controller) => {
    if (!controller) {
      return reject();
    }
    const numberDev = findTVController(controller);
    if (numberDev) {
      await controller[`dev${numberDev}`].turnOff();
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
    const numberDev = findTVController(controller);
    if (numberDev) {
      await controller[`dev${numberDev}`].turnOn();
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
    resolve(findTVController(controller));
  });
  cecCtl.on('error', (error) => {
    console.log(error);
    reject(error);
  });
});
