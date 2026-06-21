module.exports = {
  apps: [
    {
      name: "offanime",
      script: "npm",
      args: "run preview -- --host 0.0.0.0 --port 3000",
      cwd: "/home/user/webapp",
      env: { NODE_ENV: "production", PORT: 3000 },
      watch: false,
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
