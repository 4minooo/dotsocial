import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "build",
    "--outDir",
    "artifacts/online-build",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_FIREBASE_API_KEY: "build-verification-placeholder",
      VITE_FIREBASE_AUTH_DOMAIN: "build-check.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "build-check",
      VITE_FIREBASE_DATABASE_URL:
        "https://build-check-default-rtdb.firebaseio.com",
      VITE_FIREBASE_APP_ID: "build-check",
    },
  },
);
process.exit(result.status ?? 1);
