const fs = require("fs");

const raw = process.env.FIREBASE_CONFIG_JSON;
if (!raw || !raw.trim()) {
  console.error("FIREBASE_CONFIG_JSON secret is empty.");
  process.exit(1);
}

// Accepts either strict JSON or the JS object literal Firebase console
// gives you directly (unquoted keys, optional trailing "const ... =" / ";").
let objectLiteral = raw.trim();
objectLiteral = objectLiteral.replace(/^\s*(export\s+)?const\s+\w+\s*=\s*/, "");
objectLiteral = objectLiteral.replace(/;\s*$/, "");

let cfg;
try {
  cfg = JSON.parse(objectLiteral);
} catch {
  // eslint-disable-next-line no-eval
  cfg = (0, eval)(`(${objectLiteral})`);
}

const required = ["apiKey", "authDomain", "projectId", "appId"];
const missing = required.filter((k) => !cfg[k]);
if (missing.length) {
  console.error(`Firebase config is missing required field(s): ${missing.join(", ")}`);
  process.exit(1);
}

const out = `export const firebaseConfig = ${JSON.stringify(cfg, null, 2)};\n`;
fs.writeFileSync("js/firebase-config.js", out);
console.log("js/firebase-config.js generated.");
