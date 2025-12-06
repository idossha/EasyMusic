const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  // Credentials from environment variables (set in build-mac-signed.sh)
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  // Skip notarization if credentials are not provided
  if (!appleId || !appleIdPassword || !teamId) {
    console.log('  ⚠️  Skipping notarization - missing credentials');
    console.log('     Required: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID');
    return;
  }

  const { electronPlatformName, appOutDir } = context;

  // Only notarize macOS builds
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`  • notarizing   ${appPath}`);
  console.log(`    This may take several minutes...`);

  try {
    await notarize({
      appPath,
      appleId,
      appleIdPassword,
      teamId,
    });

    console.log(`  ✅ Notarization complete`);
  } catch (error) {
    console.error('  ❌ Notarization failed:', error.message);
    // Don't throw - allow build to continue
  }
};
