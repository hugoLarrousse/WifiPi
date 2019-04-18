const accessPoint = require('./accesspoint');
const supplicant = require('./supplicant');
const check = require('./checkConnect');
const timeout = require('./utils');
const networks = require('./networks');
const heptaward = require('./heptaward');


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
  } else {
    const hasInternet = await check.internet(7000);
    if (hasInternet) {
      heptaward.launchChromium();
      // send info to core + getinfo + connect to h7 + socket or connect castApp for socket?
      //
    } else {
      await accessPoint.restart();
    }
  }
};

exports.initialize = async () => {
  const hasInternet = await check.internet(6000, 2);

  if (hasInternet) {
    heptaward.launchChromium();
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
