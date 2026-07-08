module.exports = {
  apps: [
    {
      name: "offanime",
      script: "npx",
      // sirv-cli serves the built SPA with single-page-app fallback so deep
      // links (e.g. /naruto-20, /sitemap.xml) resolve correctly during preview.
      args: "sirv-cli dist --single --host 0.0.0.0 --port 3000 --cors",
      cwd: "/home/user/webapp/frontend",
      env: { NODE_ENV: "production", PORT: 3000 },
      watch: false,
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
