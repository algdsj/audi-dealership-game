import { AuthService } from './AuthService.js';

const LOCAL_USER = {
  id: 'local-player',
  displayName: '本地玩家',
  provider: 'local',
};

export class LocalAuthService extends AuthService {
  async getCurrentUser() {
    return LOCAL_USER;
  }

  async signIn() {
    return LOCAL_USER;
  }
}
