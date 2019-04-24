const request = require('requestretry');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const getSerial = async () => {
  try {
    const { stderr, stdout } = await exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2");
    if (stderr) throw new Error(stderr);
    return stdout;
  } catch (e) {
    console.log('error', e.message);
    return null;
  }
};

exports.activePi = async () => {
  try {
    const serial = await getSerial();
    // const response = await request.post({ url: 'https://api.heptaward.com/tvManagement/device/activate', json: true, form: { deviceId: 'aaa' } });
    // const response = await request.post({ url: 'http://localhost:3333/tvManagement/device/activate', json: true, form: { serial } });
    const response = await request.post({ url: 'https://awsh7api.heptaward.com/tvManagement/device/activate', json: true, form: { serial } });
    if (response && response.body && response.body.hashToken) {
      return response.body.hashToken;
    }

    throw Error(response.body);
  } catch (e) {
    console.log('e.message :', e.message);
    return null;
  }
};
