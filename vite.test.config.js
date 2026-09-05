import { defineConfig, mergeConfig } from "vite";
import base from "./vite.config.js";
import { fileURLToPath } from "node:url";
const fixture = (name) =>
  fileURLToPath(new URL(`./tests/fixtures/${name}.js`, import.meta.url));
// Only this separate test server replaces services. Production always uses Firebase/Stripe.
export default mergeConfig(
  base,
  defineConfig({
    cacheDir: "node_modules/.vite-test",
    define: {
      "import.meta.env.VITE_ADMIN_EMAIL": JSON.stringify("admin@example.test"),
    },
    resolve: {
      alias: [
        {
          find: /.*\/firebaseConfig(?:\.js)?$/,
          replacement: fixture("firebase-config"),
        },
        { find: /^firebase\/auth$/, replacement: fixture("auth") },
        { find: /^firebase\/firestore$/, replacement: fixture("firestore") },
      ],
    },
    server: { port: 5175 },
  }),
);
