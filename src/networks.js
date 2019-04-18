const _ = require('lodash');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let networks = [];
const macRegex = /([0-9a-zA-Z]{1}[0-9a-zA-Z]{1}[:]{1}){5}[0-9a-zA-Z]{1}[0-9a-zA-Z]{1}/;
const cellRegex = /Cell [0-9]{2,} - Address:/;

function parseOutput(str) {
  const wifis = [];
  try {
    const blocks = str.split(cellRegex);

    blocks.forEach((block) => {
      const network = {};
      const lines = block.split('\n');
      if (macRegex.exec(lines[0])) {
        // First line is the mac address (always! (?))
        network.mac = lines[0].trim();

        lines.forEach((line) => {
          // SSID
          if (line.indexOf('ESSID:') > 0) {
            network.ssid = _.trim(line.split(':')[1], '"');
            if (_.startsWith(network.ssid, '\\x00')) {
              // The raspi 3 interprets a string terminator as character, it's an empty SSID
              network.ssid = '';
            }
          } else if (_.startsWith(line.trim(), 'Encryption key:')) {
            network.needPassword = line.trim().split('Encryption key:')[1] !== 'off';
          }
          // Channel, an ugly thing to get it
          // else if (_.startsWith(line.trim(), 'Frequency:')) {
          //  network.channel = parseInt(_.trim(line, ' )').split(/Channel/)[1], 10);
          // }
        });
        wifis.push(network);
      }
    });
  } catch (e) {
    console.log('e.message :', e.message);
  }
  return wifis;
}

exports.scan = async () => {
  try {
    const { stdout, stderr } = await exec('sudo iwlist wlan0 scan');
    if (stderr) {
      throw new Error(stderr);
    } else {
      return parseOutput(stdout);
    }
    // const networks = await wifi.scan();
    // console.log('networks :', networks);
    // return serializeNetworks(networks);
  } catch (e) {
    console.log('e.message :', e.message);
    return null;
  }
};

exports.getNetworks = () => networks;
exports.setNetworks = n => { networks = n || []; };
