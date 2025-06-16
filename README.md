# 雅思单词听写练习系统

一个基于 Node.js 和 Express 的单词听写练习应用，专为雅思考试准备设计。

## 功能特点

 - 🎧 **智能语音播放**: 默认使用免费在线词典接口获取真人发音, 无法获取时回退到浏览器内置的语音合成 API
- ⌨️ **类似金山打字的输入体验**: 简洁直观的听写界面
- 📊 **详细统计分析**: 实时显示正确率、进度等统计信息
- 💾 **数据持久化**: 使用SQLite数据库保存学习记录和统计数据
- 📚 **历史记录查看**: 查看过往练习记录和趋势
- 📱 **响应式设计**: 支持手机、平板、电脑等设备
- 🔐 **Google 登录**: 支持第三方登录，用户数据相互隔离

## 快速开始

1. 确保已安装 Node.js (版本 14 或更高)

2. 安装依赖:
   ```bash
   npm install
   ```

3. 复制 `.env.example` 为 `.env`，并填写以下变量：
   - `GOOGLE_CLIENT_ID`：Google OAuth 客户端 ID
   - `GOOGLE_CLIENT_SECRET`：Google OAuth 客户端密钥
   - `SESSION_SECRET`：用于会话加密的随机字符串
   - `PORT`：*(可选)* 服务器端口，默认 3000

4. 启动应用:
   ```bash
   npm start
   ```

5. 打开浏览器访问: http://localhost:3000
   启动前请设置以下环境变量用于 Google 登录：
   - `GOOGLE_CLIENT_ID`：Google OAuth 客户端 ID
   - `GOOGLE_CLIENT_SECRET`：Google OAuth 客户端密钥
   - `SESSION_SECRET`：用于会话加密的随机字符串



## 单词本格式

应用会自动读取项目根目录下的 `output.txt` 文件作为单词本。文件格式为每行一个单词：

```
ability
abstract
accountant
accuracy
...
```

## 项目结构

```
word-dictation/
├── server.js          # Node.js 服务器主文件
├── package.json       # 项目配置和依赖
├── output.txt         # 单词本文件
├── dictation.db       # SQLite 数据库（自动创建）
└── public/            # 前端静态文件
    ├── index.html     # 主页面
    ├── styles.css     # 样式文件
    └── script.js      # 前端 JavaScript
```

## 主要功能

### 1. 单词听写练习
- 点击播放按钮听取单词读音
- 在输入框中输入听到的单词
- 实时反馈正确性
- 自动播放下一个单词

### 2. 学习统计
- 实时显示当前练习进度
- 计算正确率统计
- 显示已完成和剩余单词数

### 3. 历史记录
- 保存每次练习的详细记录
- 查看历史练习的时间、正确率等信息
- 跟踪学习进度和改进情况

### 4. 数据分析
- 总体统计信息（练习次数、平均正确率等）
- 词汇掌握情况分析
- 学习趋势展示

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite3
- **前端**: HTML5 + CSS3 + Vanilla JavaScript
 - **语音**: 免费词典接口音频 + Web Speech API (speechSynthesis)

## API 接口

- `GET /api/words` - 获取单词列表
- `POST /api/start-session` - 开始新的练习会话
- `POST /api/submit-word` - 提交单词答案
- `POST /api/complete-session` - 完成练习会话
- `GET /api/stats` - 获取统计数据
- `GET /api/recent-sessions` - 获取最近的练习记录

## 浏览器支持

- Chrome 33+
- Firefox 49+
- Safari 7+
- Edge 14+

*注：当在线词典音频不可用时，将回退到浏览器提供的 Web Speech API*

## 开发计划

- [ ] 添加单词难度分级
- [ ] 支持自定义单词本导入
- [ ] 添加拼写提示功能
- [ ] 实现更多语音选项
- [ ] 添加学习目标设置
- [ ] 支持离线模式

## 许可证

MIT License
