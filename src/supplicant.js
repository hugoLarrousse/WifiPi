const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

exports.setChmod = async () => {
  try {
    const { stderr } = await exec('sudo chmod 777 /etc/wpa_supplicant/wpa_supplicant.conf');
    if (stderr) throw new Error(stderr);
    return;
  } catch (e) {
    console.log('error', e.message);
  }
};

exports.copyPaste = async () => {
  try {
    const { stderr } = await exec('cp ../conf_file/wpa_supplicant.conf.orig /etc/wpa_supplicant/wpa_supplicant.conf');
    if (stderr) throw new Error(stderr);
    return;
  } catch (e) {
    console.log('error', e.message);
  }
};

exports.addNetwork = async (ssid, password) => {
  const logger = fs.createWriteStream('/etc/wpa_supplicant/wpa_supplicant.conf', {
    flags: 'a', // 'a' means appending (old data will be preserved)
  });
  logger.write(`\nnetwork={\n\tssid="${ssid}"\n\t${password ? `psk="${password}"\n\tkey_mgmt=WPA-PSK` : 'key_mgmt=NONE'}\n}\n`);
  logger.end();
};

exports.reconfigureWlan = async () => {
  const { stderr } = await exec('sudo wpa_cli -i wlan0 reconfigure');
  if (stderr) {
    console.log(stderr);
  }
};
