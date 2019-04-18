const request = require('requestretry');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const _ = require('lodash');

const timeout = require('./utils');

const parseIfconfig = (str) => {
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
          await timeout(1000);
        }
        const { stdout } = await exec('sudo ifconfig wlan0 | grep inet');
        if (stdout) {
          inet = parseIfconfig(stdout);
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


exports.internet = async (ms, maxCount) => {
  let hasResponse = false;
  let count = 0;
  do {
    try {
      const response = await Promise.race([request({ url: 'https://api.heptaward.com/status', json: true }), timeout(ms || 8000)]);
      if (response && response.body) {
        console.log('response.body :', response.body);
        hasResponse = response.body === 'OK';
      }
    } catch (e) {
      console.log('e.message :', e.message);
    }
    count += 1;
  } while (!hasResponse && count < (maxCount || 2));
  return hasResponse;
};
