/**
 * Scheduler Utility
 */

class Scheduler {
  /**
   * Sleep for specified duration
   */
  static sleep(min, max = null) {
    const duration = max ? Math.random() * (max - min) + min : min;
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Get random interval
   */
  static getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Check if current time is within operating hours
   */
  static isActiveTime(schedule) {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    
    return schedule.workDays.includes(day) &&
           hour >= schedule.startHour &&
           hour < schedule.endHour;
  }

  /**
   * Sleep until active time
   */
  static async sleepUntilActive(schedule, checkInterval) {
    while (!this.isActiveTime(schedule)) {
      await this.sleep(checkInterval);
    }
  }

  /**
   * Format duration
   */
  static formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  }
}

module.exports = Scheduler;
