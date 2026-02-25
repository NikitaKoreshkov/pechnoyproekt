/** PM2 ecosystem config — автоперезапуск при сбоях, используется на сервере */
module.exports = {
  apps: [
    {
      name: 'pechnoyproekt',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/pechnoyproekt',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' },
    },
  ],
};
