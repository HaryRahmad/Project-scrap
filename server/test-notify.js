/**
 * Test Telegram Notification Script
 * Run: node test-notify.js
 */

require('dotenv').config();
const axios = require('axios');
const { User, UserSettings } = require('./models');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegram(chatId, message) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('❌ TELEGRAM_BOT_TOKEN not set in .env');
    return false;
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      }
    );
    return response.data.ok;
  } catch (error) {
    console.error('❌ Telegram Error:', error.response?.data || error.message);
    return false;
  }
}

async function testNotification() {
  console.log('🔔 Testing Telegram Notification...\n');
  
  // Get first active user with Telegram configured
  const user = await User.findOne({
    where: { telegramChatId: { [require('sequelize').Op.ne]: null } },
    include: [{
      model: UserSettings,
      as: 'settings',
      where: { isActive: true }
    }]
  });

  if (!user) {
    console.log('❌ No user with Telegram configured and active settings');
    return;
  }

  console.log('📧 User:', user.email);
  console.log('📱 Telegram Chat ID:', user.telegramChatId);
  console.log('📱 Telegram Username:', user.telegramUsername || 'Not set');
  console.log('📍 Location:', user.settings?.locationName);
  console.log('⚖️ Target Weights:', user.settings?.targetWeights?.join(', ') || 'All');
  console.log('');

  // Build test message
  const message = `🔔 <b>TEST NOTIFIKASI - STOK TERSEDIA!</b>

📦 <b>Produk:</b>
1. <b>Emas Antam 1 gr</b> - Rp 1.500.000
2. <b>Emas Antam 5 gr</b> - Rp 7.200.000
3. <b>Emas Antam 10 gr</b> - Rp 14.300.000

📍 <b>Lokasi:</b> ${user.settings?.locationName || 'Test Location'}

🔗 <a href="https://www.logammulia.com/id/purchase/gold">BELI SEKARANG →</a>

⚠️ Ini adalah pesan test dari sistem.`;

  console.log('📤 Sending notification to Telegram...');
  const sent = await sendTelegram(user.telegramChatId, message);

  if (sent) {
    console.log('✅ Notification sent successfully!');
    console.log('📲 Check your Telegram app');
  } else {
    console.log('❌ Failed to send notification');
  }
}

// Run
testNotification()
  .catch(console.error)
  .finally(() => process.exit());
