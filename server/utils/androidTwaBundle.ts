/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Zero-dependency ZIP Archive Generator for Android Trusted Web Activity (TWA)
 * Produces a ready-to-compile Android Studio / Bubblewrap source bundle pointing to the live host.
 */

export interface ZipFileEntry {
  name: string;
  content: string | Buffer;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function createZipBuffer(entries: ZipFileEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const fileNameBuf = Buffer.from(entry.name.replace(/^\/+/, ''), 'utf8');
    const dataBuf = Buffer.isBuffer(entry.content)
      ? entry.content
      : Buffer.from(entry.content, 'utf8');
    const crc = crc32(dataBuf);

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(0, 8); // stored (no compression)
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(fileNameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, fileNameBuf, dataBuf);

    // Central directory header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuf.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(fileNameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, fileNameBuf);
    offset += localHeader.length + fileNameBuf.length + dataBuf.length;
  }

  const centralDirBuf = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirBuf.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirBuf, endRecord]);
}

export function buildAndroidTwaZipBundle(originUrl: string): Buffer {
  const parsed = (() => {
    try {
      return new URL(originUrl);
    } catch {
      return new URL('https://tazamandi.marco100.app');
    }
  })();

  const host = parsed.host;
  const baseUrl = `${parsed.protocol}//${host}`;

  const twaManifest = {
    packageId: 'com.marco.tazamandi.twa',
    host,
    name: 'TazaMandi by MARCO 100',
    launcherName: 'TazaMandi',
    display: 'standalone',
    themeColor: '#047857',
    navigationColor: '#047857',
    backgroundColor: '#FFFFFF',
    enableNotifications: true,
    startUrl: '/',
    iconUrl: `${baseUrl}/pwa-512x512.png`,
    maskableIconUrl: `${baseUrl}/pwa-maskable-512x512.png`,
    shortcuts: [],
    signingKey: {
      path: './android.keystore',
      alias: 'tazamandi',
    },
    appVersionName: '1.0.0',
    appVersionCode: 1,
    webManifestUrl: `${baseUrl}/manifest.json`,
  };

  const buildGradle = `plugins {
    id 'com.android.application' version '8.5.0' apply false
}
`;

  const appBuildGradle = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.marco.tazamandi.twa'
    compileSdk 35

    defaultConfig {
        applicationId "com.marco.tazamandi.twa"
        minSdk 23
        targetSdk 35
        versionCode 1
        versionName "1.0.0"

        manifestPlaceholders = [
            hostName: "${host}",
            defaultUrl: "${baseUrl}/",
            launcherName: "TazaMandi",
            assetStatements: '[{ "relation": ["delegate_permission/common.handle_all_urls"], "target": { "namespace": "web", "site": "${baseUrl}" } }]'
        ]
    }

    buildTypes {
        release {
            minifyEnabled true
        }
    }
}

dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}
`;

  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:theme="@android:style/Theme.Translucent.NoTitleBar">

        <meta-data
            android:name="asset_statements"
            android:value="\${assetStatements}" />

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true">
            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="\${defaultUrl}" />
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="\${hostName}" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">TazaMandi</string>
</resources>
`;

  const readme = `TazaMandi (powered by MARCO 100) — Android Trusted Web Activity (TWA) Project
================================================================================

Note: This cloud container does not ship Android SDK / Java JDK / apksigner, so it provides:
1) Instant Chrome Standalone WebAPK Install inside the browser (runs fullscreen without URL bar).
2) This ready-to-compile Android TWA Project (.zip) to generate a Play Store .AAB or signed .APK.

Quickest Build Using Bubblewrap CLI (on PC / Mac with Node + Java 17 + Android SDK):
  npx @bubblewrap/cli init --manifest="${baseUrl}/manifest.json"
  npx @bubblewrap/cli build

Or open this folder in Android Studio -> Build -> Generate Signed Bundle / APK.
Host configured: ${baseUrl}
`;

  return createZipBuffer([
    { name: 'README_BUILD_APK.txt', content: readme },
    { name: 'twa-manifest.json', content: JSON.stringify(twaManifest, null, 2) },
    { name: 'build.gradle', content: buildGradle },
    { name: 'app/build.gradle', content: appBuildGradle },
    { name: 'app/src/main/AndroidManifest.xml', content: androidManifest },
    { name: 'app/src/main/res/values/strings.xml', content: stringsXml },
  ]);
}
