const request = require('requestretry');
const util = require('util');
const fs = require('fs').promises;
const cron = require('node-cron');
const exec = util.promisify(require('child_process').exec);
const socket = require('../socket');

require('dotenv').config();

const { di } = process.env;

let info = require('../conf_file/version.json');
const timeout = require('./utils');

const needReboot = () => {
  exec('sudo reboot');
};

const needExc = async (a) => {
  await exec(`sudo ${a}`);
  return 1;
};

const requestFactory = async (method = 'GET', url, data, ms = 10000) => Promise.race([request({
  method,
  url,
  body: data || undefined,
  json: true,
}), timeout(ms)]);

const checkUpDate = async (serial, isOnBoot) => {
  try {
    socket.sendMessage('lookingForUpdate');
    await timeout(2000);
    const response = await requestFactory('GET', `https://api.heptaward.com/pi/update?info=${di}${serial}&version=${info.version}`);
    if (response && response.body && response.statusCode === 200) {
      if (response.body.needUpdate) {
        console.log('need update');
        socket.sendMessage('isUpdating');
        await timeout(2000);
        const { files, cmdS } = response.body;
        if (files) {
          for (const file of files) {
            const { statusCode, error, body } = await request(file.url);
            if (statusCode === 200 && body && !error) {
              await fs.writeFile(file.path, body);
            }
          }
        }
        if (cmdS) {
          for (const cmd of cmdS) {
            await timeout(3000);
            await needExc(cmd);
          }
        }

        if (response.body.version) {
          info = { version: response.body.version };
          await fs.writeFile('conf_file/version.json', JSON.stringify(info));
          console.log(info);
          // updated
          await requestFactory('POST',
            `https://api.heptaward.com/pi/log?info=${di}${serial}`,
            { message: 'pi updated', type: 'updated' },
            5000);
        }
        if (isOnBoot) {
          socket.sendMessage('isRebooting');
          await timeout(5000);
        }
        needReboot();
        return 0;
      }
      console.log('doesn\'t need update');
      socket.sendMessage('piUpToDate');
      await timeout(4000);
      return 1;
    }
    console.log('error response', response.body && response.body.error);
    await requestFactory('POST',
      `https://api.heptaward.com/pi/log?info=${di}${serial}`,
      { message: (response.body && response.body.error) || 'error when reach pi/update', type: 'error-update-request' },
      5000);
    return 1;
  } catch (e) {
    await requestFactory('POST',
      `https://api.heptaward.com/pi/log?info=${di}${serial}`,
      { message: `error, ${e.message}`, type: 'error-undefined' },
      5000);
    return 1;
  }
};

const cronCheckInternet = () => {
  let failAttempts = 0;
  cron.schedule('* * * * *', async () => {
    const response = await requestFactory('GET', 'https://dns.google/', undefined, 3000);
    if (!response || !response.statusCode || response.statusCode !== 200) {
      console.log('NOT OK', response && response.statusCode);
      failAttempts += 1;
    } else {
      console.log('OK');
      failAttempts = 0;
    }
    if (failAttempts > 5) {
      console.log('MORE THAN FIVE');
      needReboot();
    }
  });
};


const cronUpDate = (serial) => {
  cron.schedule('0 23 * * *', async () => {
    console.log('in checkUpdate 23h!');
    await checkUpDate(serial);
  });
};


const checkFirstTimeUpDate = async (serial) => {
  const noUpDate = await checkUpDate(serial, true);
  if (noUpDate) {
    cronCheckInternet();
    cronUpDate(serial);
  }
};

const execUnsafeCommand = async (cmd) => {
  try {
    await exec(cmd);
    return 1;
  } catch (e) {
    console.log('execUnsafeCommand', e.message);
    return null;
  }
};

exports.needReboot = needReboot;
exports.needExc = needExc;
exports.checkFirstTimeUpDate = checkFirstTimeUpDate;
exports.execUnsafeCommand = execUnsafeCommand;
