const accessPoint = require('./accesspoint');
const supplicant = require('./supplicant');
const check = require('./checkConnect');
const timeout = require('./utils');
const networks = require('./networks');
const chromium = require('./chromium');
const socket = require('../socket');
const heptaward = require('./heptaward');

const notifyPi = async (...messages) => {
  for (const message of messages) {
    socket.sendMessage(message);
    if (messages.length > 1) {
      await timeout(5000);
    }
  }
};


exports.addNetworkToConfigFile = async (ssid, password) => {
  await supplicant.setChmod();
  await supplicant.copyPaste();
  supplicant.addNetwork(ssid, password);
  await timeout(200);
  await accessPoint.stop();
  await supplicant.reconfigureWlan();

  const hasInet = await check.inet(8);
  if (!hasInet) {
    await accessPoint.restart();
    await notifyPi('errorConnection', 'waitingPairing');
  } else {
    const hasInternet = await check.internet(7000);
    if (hasInternet) {
      await notifyPi('connected');
      const deviceId = await heptaward.activePi();
      if (!deviceId) {
        await notifyPi('errorSerial');
      } else {
        chromium.launchCast(deviceId);
      }
      // send info to core + getinfo + connect to h7 + socket or connect castApp for socket?
      //
    } else {
      await accessPoint.restart();
      await notifyPi('errorConnection', 'waitingPairing');
    }
  }
};

exports.initialize = async () => {
  const hasInternet = await check.internet(6000, 2);
  if (hasInternet) {
    const deviceId = await heptaward.activePi();
    if (!deviceId) {
      await chromium.launchPiDisplay();
      await timeout(2000);
      await notifyPi('errorSerial');
    } else {
      chromium.launchCast(deviceId);
    }
    // send info to core + getinfo + connect to h7 + socket or connect castApp for socket?
    //
  } else {
    networks.setNetworks(await networks.scan() || []);
    if (networks.getNetworks().length === 0) {
      await accessPoint.stop();
      networks.setNetworks(await networks.scan() || []);
    }
    await accessPoint.restart();
  }
};


exports.getNetworks = networks.getNetworks();
exports.notifyPi = notifyPi;
