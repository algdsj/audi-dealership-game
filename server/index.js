const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const tencentcloud = require('tencentcloud-sdk-nodejs-hunyuan');

dotenv.config();

const HunyuanClient = tencentcloud.hunyuan.v20230901.Client;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 腾讯混元客户端初始化
const client = new HunyuanClient({
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: 'ap-guangzhou',
  profile: {
    httpProfile: { endpoint: 'hunyuan.tencentcloudapi.com' },
  },
});

// 通用聊天接口
app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: '缺少 prompt 参数' });
  }

  try {
    const response = await client.ChatCompletions({
      Model: 'hunyuan-lite',
      Messages: [{ Role: 'user', Content: prompt }],
      Temperature: 0.9,
      TopP: 0.8,
    });

    const text = response.Choices?.[0]?.Message?.Content || 'AI 思考中出错了...';
    res.json({ text });
  } catch (error) {
    console.error('混元 API 调用失败:', error.message);
    // 指数退避重试一次
    try {
      await new Promise(r => setTimeout(r, 2000));
      const retry = await client.ChatCompletions({
        Model: 'hunyuan-lite',
        Messages: [{ Role: 'user', Content: prompt }],
        Temperature: 0.9,
        TopP: 0.8,
      });
      const text = retry.Choices?.[0]?.Message?.Content || 'AI 思考中出错了...';
      res.json({ text });
    } catch (retryError) {
      console.error('重试也失败:', retryError.message);
      res.status(500).json({ text: '抱歉，AI 助手当前网络拥堵，请稍后再试。' });
    }
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: 'hunyuan-lite' });
});

app.listen(PORT, () => {
  console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
  console.log(`📡 混元模型: hunyuan-lite`);
});
