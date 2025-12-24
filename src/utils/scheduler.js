/**
 * Module Penjadwalan Bot
 * Handle jadwal operasional dan interval acak
 */

const config = require('../config');

/**
 * Cek apakah hari ini adalah hari kerja (Senin-Jumat)
 */
function isWorkday() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return config.schedule.workDays.includes(day);
}

/**
 * Cek apakah sekarang dalam jam operasional (08:00 - 17:00)
 */
function isOperatingHours() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= config.schedule.startHour && hour < config.schedule.endHour;
}

/**
 * Cek apakah sekarang adalah waktu aktif (hari kerja + jam operasional)
 */
function isActiveTime() {
  return isWorkday() && isOperatingHours();
}

/**
 * Dapatkan interval acak untuk pengecekan (45-90 detik)
 * @returns {number} Interval dalam milidetik
 */
function getRandomInterval() {
  const { minCheck, maxCheck } = config.intervals;
  return Math.floor(Math.random() * (maxCheck - minCheck + 1)) + minCheck;
}

/**
 * Dapatkan waktu tersisa sampai jam operasional berikutnya
 * @returns {number} Waktu dalam milidetik
 */
function getTimeUntilNextActiveWindow() {
  const now = new Date();
  
  // Jika hari kerja tapi belum jam 08:00
  if (isWorkday() && now.getHours() < config.schedule.startHour) {
    const nextStart = new Date(now);
    nextStart.setHours(config.schedule.startHour, 0, 0, 0);
    return nextStart - now;
  }
  
  // Jika sudah lewat jam operasional atau hari libur, hitung ke hari kerja berikutnya
  let nextDay = new Date(now);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(config.schedule.startHour, 0, 0, 0);
  
  // Cari hari kerja berikutnya
  while (!config.schedule.workDays.includes(nextDay.getDay())) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay - now;
}

/**
 * Format durasi dalam milidetik ke format yang mudah dibaca
 * @param {number} ms - Durasi dalam milidetik
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Sleep untuk durasi tertentu
 * @param {number} ms - Durasi dalam milidetik
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sleep mode - cek setiap 10 menit sampai waktu aktif
 */
async function sleepUntilActive() {
  console.log('[Scheduler] 😴 Di luar jam operasional. Masuk mode sleep...');
  
  while (!isActiveTime()) {
    const timeUntilActive = getTimeUntilNextActiveWindow();
    console.log(`[Scheduler] ⏰ Waktu sampai aktif: ${formatDuration(timeUntilActive)}`);
    
    // Sleep selama 10 menit atau sampai waktu aktif (mana yang lebih cepat)
    const sleepDuration = Math.min(config.intervals.sleepCheck, timeUntilActive);
    await sleep(sleepDuration);
  }
  
  console.log('[Scheduler] ☀️ Jam operasional dimulai!');
}

/**
 * Dapatkan status jadwal saat ini
 */
function getScheduleStatus() {
  const now = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  return {
    currentDay: dayNames[now.getDay()],
    currentHour: now.getHours(),
    isWorkday: isWorkday(),
    isOperatingHours: isOperatingHours(),
    isActive: isActiveTime()
  };
}

module.exports = {
  isWorkday,
  isOperatingHours,
  isActiveTime,
  getRandomInterval,
  getTimeUntilNextActiveWindow,
  formatDuration,
  sleep,
  sleepUntilActive,
  getScheduleStatus
};
