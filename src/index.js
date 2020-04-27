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
      await timeout(2000);
      const serial = await heptaward.getSerial();
      await timeout(2000);
      const deviceId = await heptaward.activePi(serial);
      await timeout(2000);
      socket.initializeSocketH7(serial);
      await managePi.checkFirstTimeUpDate(serial);
      await timeout(2000);
      if (!deviceId) {
        await notifyPi('errorSerial');
      } else {
        console.log('ready to launch', new Date());
        await timeout(5000);
        await notifyPi('connected');
        await timeout(5000);
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

exports.initialize = async () => {
  try {
    console.log('initialize', new Date());
    chromium.launchPiDisplay();
    console.log('screen open', new Date());
    await timeout(8000);
    await notifyPi('lookingForInternet');
    let hasInternet = null;
    let wpaSSID = null;

    // up eth0 to check ethernet
    const commandDone = await managePi.execUnsafeCommand('sudo ifup eth0');
    await timeout(2000);
    const isEthernet = commandDone && await check.ethernet();
    console.log('isEthernet', isEthernet, new Date());
    if (isEthernet) {
      await timeout(5000);
      await accessPoint.stop();

      await timeout(2000);
      await notifyPi('checkEthernet');
      hasInternet = await check.internet(20000, 3);
    }

    if (!hasInternet) {
      await notifyPi('lookingForInternet2');
      console.log('hasInternet false 1', new Date());
      await managePi.execUnsafeCommand('sudo ifdown eth0');
      console.log('eth0 down...');
      await managePi.execUnsafeCommand('sudo ifconfig eth0 down');
      console.log('eth0 down done...');
      await timeout(3000);
      wpaSSID = await supplicant.hasWpa();
      console.log('wpaSSID', wpaSSID, new Date());
      if (!wpaSSID) {
        await timeout(10000);
        await firstConnection();
        return;
      }
    }
    if (!hasInternet) {
      console.log('hasInternet false 2', new Date());
      hasInternet = await check.internet(20000, 3, true);
      console.log('hasInternet', hasInternet, new Date());
      if (!hasInternet) {
        console.log('hasInternet false 3', new Date());
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
      console.log('hasInternet true', new Date());
      const serial = await heptaward.getSerial();
      // TEST PING
      console.log('START CHECK PI', new Date());
      const hasStableInternet = await check.ping();
      console.log('hasStableInternet', Boolean(hasStableInternet));
      console.log('END CHECK PI', new Date());
      // await timeout(8000);
      const deviceId = await heptaward.activePi(serial);
      console.log('deviceId', new Date());
      // await timeout(6000);
      socket.initializeSocketH7(serial);
      await timeout(1000);
      await managePi.checkFirstTimeUpDate(serial);
      await timeout(1000);
      await notifyPi('connected');
      console.log('almostConnected', new Date());
      if (!deviceId) {
        await notifyPi('errorSerial');
      } else {
        console.log('ready to launch', new Date());
        // await timeout(8000);
        // await notifyPi('connected');
        await timeout(2000);
        chromium.launchCast(deviceId);
      }
    } else {
      await managePi.execUnsafeCommand('sudo reboot');
    }
  } catch (e) {
    console.log('ERROR', e.message);
  }
};

exports.getNetworks = () => networks.getNetworks();
exports.notifyPi = notifyPi;
