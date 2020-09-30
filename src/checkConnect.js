const request = require('requestretry');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const _ = require('lodash');

const timeout = require('./utils');

const parseIfConfig = (str) => {
  if (str) {
    const lines = str.split('\n');
    let hasInet = false;
    lines.forEach((line) => {
      if (_.startsWith(line.trim(), 'inet ')) {
        hasInet = true;
      }
    });
    return hasInet;
  }
  return false;
};


exports.inet = async (countMax) => {
  try {
    let inet = false;
    let count = 0;

    do {
      try {
        if (count === 0) {
          await timeout(1500);
        } else {
          await timeout(500);
        }
        const { stdout } = await exec('sudo ifconfig wlan0 | grep inet');
        if (stdout) {
          inet = parseIfConfig(stdout);
        }
      } catch (e) {
        console.log('error checkInet', e.message);
      }
      if (!inet) {
        await timeout(1000);
      }
      count += 1;
    } while (!inet && count < countMax);
    return inet;
  } catch (e) {
    console.log('checkInet error:', e.message);
    return false;
  }
};


exports.internet = async (ms = 8000, maxCount = 2) => {
  let hasResponse = false;
  let count = 0;
  do {
    try {
      const response = await Promise.race([request({ url: 'https://dns.google/', json: true }), timeout(ms)]);
      if (response && response.statusCode && response.statusCode === 200) {
        hasResponse = true;
      }
    } catch (e) {
      console.log('check internet error :', e.message);
    }
    count += 1;
  } while (!hasResponse && count < maxCount);
  return hasResponse;
};

exports.ethernet = async () => {
  try {
    const { stdout } = await exec('sudo cat /sys/class/net/eth0/carrier');
    return stdout && Number(stdout) === 1;
  } catch (e) {
    return false;
  }
};

exports.ping = async (ip = '8.8.8.8', count = 10, maxLoop = 10) => {
  let currentLoop = 0;
  let stderrGlobal = null;
  let needTimeout = false;

  do {
    try {
      if (needTimeout) await timeout(6000);
      const { stderr } = await exec(`sudo ping ${ip} -c ${count}`);
      stderrGlobal = stderr;
      needTimeout = false;
    } catch (e) {
      needTimeout = true;
      stderrGlobal = 'error';
    }
    currentLoop += 1;
  } while (stderrGlobal && maxLoop !== currentLoop);
};
