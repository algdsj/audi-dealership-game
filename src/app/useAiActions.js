import { useState } from 'react';
import { CAR_MODELS } from '../game/config/vehicles.js';
import { normalizeLeadChannels, sumLeadChannels } from '../game/engine/leads.js';
import { RemoteAiAdvisorService } from '../services/index.js';

const aiAdvisorService = new RemoteAiAdvisorService({ fallbackText: '抱歉，AI 助手当前网络拥堵，请稍后再试。' });
const DEFAULT_AI_ADVICE = '店总，您好！当您需要经营策略时，随时召唤我。';

export function useAiActions({
  addLog,
  appendLedger,
  dayOfMonth,
  finance,
  inventory,
  monthlyStats,
  setFinance,
  setMarketing,
  showAlert,
  showConfirm,
}) {
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [aiAdCopy, setAiAdCopy] = useState('');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(DEFAULT_AI_ADVICE);

  const handleGenerateAIAd = async () => {
    const cost = 5000;
    if (finance.cash < cost) return showAlert('预算不足', '现金不足，AI营销需要支付 ¥5,000 的预算支持！');
    showConfirm('确认启动 AI 营销', `是否支付 ¥${cost.toLocaleString()} 预算，由 AI 店总生成一次专属营销活动？`, async () => {
      setFinance(f => ({ ...f, cash: f.cash - cost }));
      appendLedger({ label: 'AI营销策划', amount: -cost, type: 'expense' });
      setIsGeneratingAd(true);
      const stockDetails = CAR_MODELS
        .map(model => {
          const count = inventory.filter(car => car.modelId === model.id).length;
          return count > 0 ? `${model.name}(${count}台)` : null;
        })
        .filter(Boolean)
        .join(', ');
      const prompt = `你是一位顶尖奥迪营销专家。目前库存有：${stockDetails || '暂无现车'}。请写一条发朋友圈的促销广告文案。要求控制60字以内，包含Emoji，不要多余解释。`;
      const generatedCopy = await aiAdvisorService.request(prompt);
      const bonusLeads = Math.floor(Math.random() * 30) + 30;
      setMarketing(marketing => {
        const channels = normalizeLeadChannels(marketing);
        channels.livestream += bonusLeads;
        return { ...marketing, leadChannels: channels, leads: sumLeadChannels(channels) };
      });
      setAiAdCopy(generatedCopy);
      addLog('success', `✨ AI营销成功！立刻获取了 ${bonusLeads} 个高质量直播线索！`);
      setIsGeneratingAd(false);
    });
  };

  const handleAskAIConsultant = async () => {
    setIsGeneratingAdvice(true);
    const targetProgress = monthlyStats.target > 0 ? ((monthlyStats.sales / monthlyStats.target) * 100).toFixed(1) : 0;
    const prompt = `你是汽车4S店总经理顾问。根据数据给一句毒舌但一针见血的建议(最多40字)：现金${finance.cash}，负债${finance.loan}，授信${finance.creditLimit}，库存${inventory.length}，距月底${30 - dayOfMonth}天，目标完成率${targetProgress}%`;
    const advice = await aiAdvisorService.request(prompt);
    setAiAdvice(advice);
    addLog('info', '✨ AI 店总顾问给出了新的经营建议。');
    setIsGeneratingAdvice(false);
  };

  return {
    aiAdCopy,
    aiAdvice,
    handleAskAIConsultant,
    handleGenerateAIAd,
    isGeneratingAd,
    isGeneratingAdvice,
  };
}
