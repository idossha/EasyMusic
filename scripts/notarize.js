const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`Notarizing ${appPath}`);

  try {
    console.log('Starting notarization process...');
    console.log(`Apple ID: ${process.env.APPLE_ID ? 'Set' : 'Not set'}`);
    console.log(`Team ID: ${process.env.APPLE_TEAM_ID ? 'Set' : 'Not set'}`);
    console.log(`App-specific password: ${process.env.APPLE_APP_SPECIFIC_PASSWORD ? 'Set' : 'Not set'}`);

    await notarize({
      tool: 'notarytool',
      appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });

    console.log('Notarization completed successfully');
  } catch (error) {
    console.error('Notarization failed with error:', error.message);
    console.error('Full error:', error);

    // Provide helpful troubleshooting information
    if (error.message.includes('HTTP')) {
      console.error('This appears to be an authentication or network issue.');
      console.error('Please verify:');
      console.error('1. APPLE_ID is your Apple Developer email');
      console.error('2. APPLE_APP_SPECIFIC_PASSWORD is correct (generated from appleid.apple.com)');
      console.error('3. APPLE_TEAM_ID is your Apple Developer Team ID');
    }

    throw error;
  }
};