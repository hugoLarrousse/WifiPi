const util = require('util');
const exec = util.promisify(require('child_process').exec);


exports.launchCast = async (deviceId) => {
  const { stderr } = await exec(`chromium-browser --start-fullscreen https://cast.heptaward.com/tv/${deviceId}`);
  if (stderr) {
    console.log(stderr);
  }
};

exports.launchPiDisplay = async () => {
  const { stderr } = await exec('chromium-browser --start-fullscreen ~/Desktop/WifiPi/html/pi.html');
  if (stderr) {
    console.log(stderr);
  }
};
