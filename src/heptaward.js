const util = require('util');
const exec = util.promisify(require('child_process').exec);

exports.launchChromium = async () => {
  const { stderr } = await exec('chromium-browser --start-fullscreen app.heptaward.com');
  if (stderr) {
    console.log(stderr);
  }
};
