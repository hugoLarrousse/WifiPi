const request = require('requestretry');
const util = require('util');
const fs = require('fs').promises;
const cron = require('node-cron');
const exec = util.promisify(require('child_process').exec);

let info = require('../conf_file/version.json');
const timeout = require('./utils');

const needReboot = () => {
  // exec('reboot');
};

const requestFactory = async (method = 'GET', url, data, ms = 10000) => Promise.race([request({
  // url: `https://api.heptaward.com/pi/update?info=wWctrFljECq8tF0KPjhk1kSrKhhrEiudn53tMmht${serial}`,
  method,
  url,
  body: data || undefined,
  json: true,
}), timeout(ms)]);


exports.checkUpdate = async (serial) => {
  let failAttempts = 0;
  cron.schedule('0 23 * * *', async () => {
    console.log('in checkUpdate 23h!');

    try {
      // const url = `http://localhost:3333/pi/update?info=wWctrFljECq8tF0KPjhk1kSrKhhrEiudn53tMmht${serial}&version=${info.version}`;
      const response = await requestFactory('GET', `https://api.heptaward.com/pi/update?info=wWctrFljECq8tF0KPjhk1kSrKhhrEiudn53tMmht${serial}`);
      if (response && response.body && response.statusCode === 200) {
        if (response.body.needUpdate) {
          console.log('need update');
          const { files } = response.body;
          for (const file of files) {
            const { statusCode, error, body } = await request(file.url);
            if (statusCode === 200 && body && !error) {
              await fs.writeFile(file.path, body);
            }
          }

          if (response.body.version) {
            info = { version: response.body.version };
            await fs.writeFile('conf_file/version.json', JSON.stringify(info));
            console.log(info);
            // updated
            await requestFactory('POST',
              // `http://localhost:3333/pi/log?info=wWctrFljECq8tF0KPjhk1kSrKhhrEiudn53tMmht${serial}`,
              `https://api.heptaward.com/pi/log?info=wWctrFljECq8tF0KPjhk1kSrKhhrEiudn53tMmht${serial}`,
              { message: 'pi updated', type: 'updated' },
              5000);
          }
          console.log('need reboot');
          // needReboot();
        } else {
          console.log('doesn\'t need update');
        }
      } else {
        console.log('error response', response.body && response.body.error);
        const titi = await requestFactory('POST',
          // `http://localhost:3333/pi/log?info=wWctrFljECq8tF0KPjhk1kSrKhhrEiudn53tMmht${serial}`,
          `https://api.heptaward.com/pi/log?info=wWctrFljECq8tF0KPjhk1kSrKhhrEiudn53tMmht${serial}`,
          { message: (response.body && response.body.error) || 'error when reach pi/update', type: 'error-update-request' },
          5000);
        console.log('aa', titi);
      }
    } catch (e) {
      // url: ``http://localhost:3333/pi/log?info=wWctrFljECq8tF0KPjhk1kSrKhhrEiudn53tMmht${serial}`,`,
      await requestFactory('POST',
        `https://api.heptaward.com/pi/log?info=wWctrFljECq8tF0KPjhk1kSrKhhrEiudn53tMmht${serial}`,
        { message: `error, ${e.message}`, type: 'error-undefined' },
        5000);
    }
  });
  cron.schedule('* * * * *', async () => {
    console.log('IN cron check status');
    const response = await requestFactory('GET', 'https://dns.google/', undefined, 3000);
    if (!response || !response.statusCode || response.statusCode !== 200) {
      console.log('NOT OK', response && response.statusCode);
      failAttempts += 1;
    } else {
      failAttempts = 0;
    }
    if (failAttempts > 4) {
      needReboot();
    }
  });
};

exports.needReboot = needReboot;
