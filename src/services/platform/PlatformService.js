export class PlatformService {
  getPlatformId() {
    return 'browser';
  }

  getCapabilities() {
    return {
      cloudSave: false,
      leaderboard: false,
      achievements: false,
      overlay: false,
    };
  }

  async unlockAchievement(_achievementId) {}
}
