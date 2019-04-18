const util = require('util');
const exec = util.promisify(require('child_process').exec);

exports.stop = async () => {
  try {
    const { stderr } = await exec('bash ./conf_file/accessPoint_stop.conf');
    if (stderr) {
      console.log('stopAcceessPoint stderr', stderr);
    }
  } catch (e) {
    console.log('stopAcceessPoint error', e.message);
  }
};

exports.restart = async () => {
  const { stderr } = await exec('bash ./conf_file/accessPoint_restart.conf');
  if (stderr) {
    console.log(stderr);
  }
};
