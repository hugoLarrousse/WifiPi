const util = require('util');
const exec = util.promisify(require('child_process').exec);


exports.launchCast = async (deviceId) => {
  // const { stderr } = await exec(`chromium-browser --start-fullscreen --new-window https://cast.heptaward.com/tv/${deviceId}`);
  // const { stderr } = await exec(`chromium-browser --kiosk --new-window --incognito https://cast.staging.heptaward.com/tv/${deviceId}`);
  // const { stderr } = await exec(`chromium-browser --start-fullscreen --noerrdialogs --disable-translate --disable-infobars --new-window --incognito https://cast.heptaward.com/tv/${deviceId}`);
  const { stderr } = await exec(`chromium-browser --kiosk --noerrdialogs --disable-translate --disable-infobars --new-window --incognito https://cast.heptaward.com/tv/${deviceId}`);
  if (stderr) {
    console.log('launchCast stderr', stderr);
  }
};

exports.launchPiDisplay = async () => {
  const { stderr } = await exec('chromium-browser --start-fullscreen --incognito http://localhost:3000/pi/pair');
  if (stderr) {
    console.log('launchPiDisplay stderr', stderr);
  }
};
