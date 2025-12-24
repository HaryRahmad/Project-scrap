/**
 * PM2 Ecosystem File
 * Konfigurasi optimal untuk VPS 2GB RAM
 * 
 * Jalankan dengan: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [{
    name: 'antam-monitor',
    script: 'app.js',
    
    // Tidak perlu cluster untuk bot single instance
    instances: 1,
    
    // Auto restart jika crash
    autorestart: true,
    
    // Watch mode disabled untuk production
    watch: false,
    
    // Memory limit - restart jika melebihi 400MB
    max_memory_restart: '400M',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      // Telegram credentials dari .env
    },
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    
    // Restart policy
    exp_backoff_restart_delay: 1000,
    max_restarts: 10,
    min_uptime: 5000,
    
    // Node.js flags untuk optimasi memory
    node_args: [
      '--max-old-space-size=256',
      '--optimize-for-size'
    ],
    
    // Cron restart harian jam 06:00 untuk fresh start
    cron_restart: '0 6 * * *'
  }]
};
