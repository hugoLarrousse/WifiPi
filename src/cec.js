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
      await cecCtl.closeClient();
      return reject();
    }
    const numberDev = findTVController(controller);
    if (numberDev) {
      await controller[`dev${numberDev}`].turnOff();
    }
    await cecCtl.closeClient();
    return resolve();
  });
  cecCtl.on('error', async (error) => {
    console.log(error);
    await cecCtl.closeClient();
    reject();
  });
});

exports.start = () => new Promise((resolve, reject) => {
  const cecCtl = new CecController();
  cecCtl.on('ready', async (controller) => {
    if (!controller) {
      await cecCtl.closeClient();
      return reject();
    }
    const numberDev = findTVController(controller);
    if (numberDev) {
      await controller[`dev${numberDev}`].turnOn();
    }
    await cecCtl.closeClient();
    return resolve();
  });
  cecCtl.on('error', async (error) => {
    console.log(error);
    await cecCtl.closeClient();
    reject(error);
  });
});

exports.test = () => new Promise((resolve, reject) => {
  const cecCtl = new CecController();
  cecCtl.on('ready', async (controller) => {
    const numberDev = findTVController(controller);
    await cecCtl.closeClient();
    resolve(numberDev === 0 ? true : numberDev);
  });
  cecCtl.on('error', async (error) => {
    console.log(error);
    await cecCtl.closeClient();
    reject(error);
  });
});
