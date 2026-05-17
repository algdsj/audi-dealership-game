import { AiAdvisorService } from './AiAdvisorService.js';

export class RemoteAiAdvisorService extends AiAdvisorService {
  constructor({
    endpoint = '/api/chat',
    fetchImpl = globalThis.fetch,
    retryDelays = [1000, 2000, 4000],
    fallbackText = 'AI暂时忙，请稍后再试。',
  } = {}) {
    super();
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl;
    this.retryDelays = retryDelays;
    this.fallbackText = fallbackText;
  }

  async request(prompt) {
    for (let index = 0; index < this.retryDelays.length; index++) {
      try {
        const response = await this.fetchImpl(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
        const data = await response.json();
        return data.text || 'AI 思考中出错了...';
      } catch (_error) {
        if (index < this.retryDelays.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelays[index]));
        }
      }
    }
    return this.fallbackText;
  }

  async getAdvice(gameSnapshot) {
    return this.request(`请基于经营快照给出建议：${JSON.stringify(gameSnapshot)}`);
  }
}
