#!/bin/bash
# 本地开发一键启动脚本

echo "🚀 启动奥迪4S店经营模拟 - 本地开发模式"
echo ""

# 启动后端（后台运行）
echo "📡 启动后端服务 (端口 3001)..."
cd "$(dirname "$0")/server"
node index.js &
BACKEND_PID=$!

# 启动前端
echo "🎨 启动前端开发服务器 (端口 5173)..."
cd "$(dirname "$0")"
npx vite --open

# 前端退出后，杀掉后端进程
kill $BACKEND_PID 2>/dev/null
echo "👋 已退出"
