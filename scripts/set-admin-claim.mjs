/**
 * JanSahayak Administrator Provisioning Script
 * -------------------------------------------------------------
 * Sets the `{ admin: true }` custom claim on a Firebase Auth user.
 * 
 * SECURITY NOTICE:
 * Custom claims CANNOT and MUST NOT be assigned by client-side code.
 * They must only be minted by this privileged script using Firebase Admin SDK
 * credentials (service account) with the IAM role 'Firebase Authentication Admin'.
 * 
 * Prerequisites:
 *   1. Download a service account private key JSON from:
 *      Firebase Console -> Project Settings -> Service accounts -> Generate new private key
 *   2. DO NOT commit the service account key to Git (keep it outside repo or in .gitignore).
 *   3. Set the environment variable or pass the path:
 *      $env:GOOGLE_APPLICATION_CREDENTIALS = "path/to/serviceAccountKey.json" (PowerShell)
 *      export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json" (Bash)
 *   4. Install firebase-admin if not already present:
 *      npm install -D firebase-admin
 * 
 * Usage:
 *   node scripts/set-admin-claim.mjs <user-email-or-uid> [--revoke]
 * 
 * Example:
 *   node scripts/set-admin-claim.mjs admin@jansahayak.gov.in
 *   node scripts/set-admin-claim.mjs user@example.com --revoke
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

async function main() {
  const args = process.argv.slice(2);
  const targetIdentifier = args.find(arg => !arg.startsWith('--'));
  const isRevoke = args.includes('--revoke');

  if (!targetIdentifier) {
    console.error(`
Usage:
  node scripts/set-admin-claim.mjs <email-or-uid> [--revoke]

Examples:
  node scripts/set-admin-claim.mjs admin@jansahayak.gov.in
  node scripts/set-admin-claim.mjs SOME_FIREBASE_UID --revoke
`);
    process.exit(1);
  }

  // Check for firebase-admin module
  let admin;
  try {
    const adminModule = await import('firebase-admin');
    admin = adminModule.default || adminModule;
  } catch (err) {
    console.error(`
[Error] The 'firebase-admin' package is not installed.
To run this privileged provisioning script, install firebase-admin as a dev dependency:
  npm install --save-dev firebase-admin
`);
    process.exit(1);
  }

  // Initialize Firebase Admin SDK
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath || !existsSync(credPath)) {
    console.warn(`
[Notice] GOOGLE_APPLICATION_CREDENTIALS environment variable is not set or file does not exist.
Attempting default application credentials or serviceAccountKey.json in working directory...
`);
    const localKeyPath = resolve(process.cwd(), 'serviceAccountKey.json');
    if (existsSync(localKeyPath)) {
      console.log(`Loading credentials from local serviceAccountKey.json...`);
      const serviceAccount = JSON.parse(readFileSync(localKeyPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      try {
        admin.initializeApp();
      } catch (initErr) {
        console.error(`
[Authentication Error] Could not initialize Firebase Admin SDK.
Please download your service account key from Firebase Console and set:
  $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\path\\to\\serviceAccountKey.json"
`);
        process.exit(1);
      }
    }
  } else {
    console.log(`Using credentials from GOOGLE_APPLICATION_CREDENTIALS...`);
    admin.initializeApp();
  }

  // Resolve user by email or UID
  let targetUser;
  try {
    if (targetIdentifier.includes('@')) {
      targetUser = await admin.auth().getUserByEmail(targetIdentifier);
    } else {
      targetUser = await admin.auth().getUser(targetIdentifier);
    }
  } catch (lookupErr) {
    console.error(`[Error] User not found for identifier: ${targetIdentifier}`);
    console.error(lookupErr.message);
    process.exit(1);
  }

  const existingClaims = targetUser.customClaims || {};
  const newClaims = {
    ...existingClaims,
    admin: !isRevoke
  };

  if (isRevoke) {
    delete newClaims.admin;
  }

  try {
    await admin.auth().setCustomUserClaims(targetUser.uid, newClaims);
    console.log(`
=============================================================
SUCCESS: Custom claims updated for user!
-------------------------------------------------------------
Email:       ${targetUser.email}
UID:         ${targetUser.uid}
Admin Role:  ${!isRevoke ? 'GRANTED (admin: true)' : 'REVOKED'}
New Claims:  ${JSON.stringify(newClaims)}
=============================================================

IMPORTANT:
1. Custom claim updates propagate to existing ID tokens upon refresh.
2. The user must sign out and sign back in, or call 'getIdTokenResult(true)',
   for the new claim to take effect in client and Firestore Security Rules.
`);
  } catch (setErr) {
    console.error(`[Error] Failed to set custom claims:`, setErr.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
