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
      console.log('count', count);
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
  console.log('ms', ms, 'maxCount', maxCount);
  let hasResponse = false;
  let count = 0;
  console.time('count1');
  do {
    try {
      console.log('count', count);
      const response = await Promise.race([request({ url: 'https://dns.google/', json: true }), timeout(ms)]);
      if (response && response.statusCode && response.statusCode === 200) {
        hasResponse = true;
      }
    } catch (e) {
      console.log('check internet error :', e.message);
    }
    count += 1;
  } while (!hasResponse && count < maxCount);
  console.timeEnd('count1');
  console.log('hasResponse', hasResponse);
  return hasResponse;
};

exports.ethernet = async () => {
  const { stdout } = await exec('cat /sys/class/net/eth0/carrier');
  return stdout && stdout === 1;
};
