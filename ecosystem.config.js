/**
 * PM2 Ecosystem File untuk SaaS Multi-User
 * 
 * Jalankan: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    // API Server
    {
      name: 'antam-api',
      cwd: './server',
      script: 'app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '../logs/api-error.log',
      out_file: '../logs/api-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    
    // Checker Bot
    {
      name: 'antam-checker',
      cwd: './checker',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/checker-error.log',
      out_file: '../logs/checker-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      node_args: [
        '--max-old-space-size=256'
      ],
      // Restart harian jam 06:00
      cron_restart: '0 6 * * *'
    }
  ]
};
