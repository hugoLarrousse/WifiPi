const util = require('util');
const exec = util.promisify(require('child_process').exec);

const accessPoint = require('./accesspoint');
const supplicant = require('./supplicant');
const check = require('./checkConnect');
const timeout = require('./utils');
const networks = require('./networks');
const chromium = require('./chromium');
const socket = require('../socket');
const heptaward = require('./heptaward');
const managePi = require('./managePi');

const notifyPi = async (...messages) => {
  for (const message of messages) {
    socket.sendMessage(message);
    if (messages.length > 1) {
      await timeout(5000);
    }
  }
};


exports.addNetworkToConfigFile = async (ssid, password) => {
  console.log('ssid', ssid);
  await supplicant.setChmod();
  await supplicant.copyPaste();
  supplicant.addNetwork(ssid, password);
  await timeout(500);
  await accessPoint.stop();
  await supplicant.reconfigureWlan();
  await timeout(5000);
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
    } else {
      await timeout(1000);
      await accessPoint.stop();
      await timeout(2000);
      await accessPoint.restart();
      await notifyPi('errorConnection', 'waitingPairing');
    }
  }
};

const firstConnection = async () => {
  networks.setNetworks(await networks.scan() || []);
  if (networks.getNetworks().length === 0) {
    await accessPoint.stop();
    await timeout(2000);
    networks.setNetworks(await networks.scan() || []);
  }
  await timeout(1000);
  await accessPoint.stop();
  await timeout(2000);
  await accessPoint.restart();
  await timeout(2000);
  await notifyPi('waitingPairing');
};

exports.initialize = async () => {
  console.log('initialize');
  chromium.launchPiDisplay();
  console.log('screen open');
  await timeout(8000);
  let hasInternet = null;
  let wpaSSID = null;
  const isEthernet = await check.ethernet();
  console.log('isEthernet', isEthernet);
  if (isEthernet) {
    await timeout(5000);
    await accessPoint.stop();
    await timeout(2000);
    await notifyPi('checkEthernet');
    hasInternet = await check.internet(20000, 3);
  }
  if (!hasInternet) {
    wpaSSID = await supplicant.hasWpa();
    console.log('wpaSSID', wpaSSID);
    if (!wpaSSID) {
      await timeout(10000);
      await firstConnection();
      return;
    }
  }
  if (!hasInternet) {
    await notifyPi('lookingForInternet2');
    hasInternet = await check.internet(20000, 3);
    if (!hasInternet) {
      await notifyPi('lookingForInternet3');
      await accessPoint.restart();
      await timeout(2000);
      await accessPoint.stop();
      await timeout(2000);
      hasInternet = await check.internet(15000, 3);
    }
  }

  if (!hasInternet) {
    const networksScanned = await networks.scan();
    if (networksScanned && !networksScanned.find(n => n.ssid === wpaSSID)) {
      await firstConnection();
      return;
    }
    await accessPoint.stop();
    await timeout(3000);
    await notifyPi('lookingForInternet4');
    hasInternet = await check.internet(18000, 2);
  }
  if (hasInternet) {
    const serial = await heptaward.getSerial();
    const deviceId = await heptaward.activePi();
    socket.initializeSocketH7(serial);
    managePi.checkUpdate(serial);
    if (!deviceId) {
      await notifyPi('errorSerial');
    } else {
      chromium.launchCast(deviceId);
    }
  } else {
    exec('sudo reboot');
  }
};

exports.getNetworks = () => networks.getNetworks();
exports.notifyPi = notifyPi;
