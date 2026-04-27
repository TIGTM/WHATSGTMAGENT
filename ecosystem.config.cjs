module.exports = {
  apps: [
    {
      name: "whatsapp-gtm",
      script: "src/index.js",
      cwd: ".",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
