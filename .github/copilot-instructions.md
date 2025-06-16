<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# 雅思单词听写练习系统

这是一个基于 Node.js + Express 的雅思单词听写练习应用。

## 项目特点

- 使用 SQLite 数据库存储用户练习记录和统计数据
- 前端使用原生 JavaScript + Web Speech API 实现语音播放
- 支持实时统计、历史记录查看等功能
- 响应式设计，支持多种设备

## 代码风格

- 后端使用 Express.js 框架，遵循 RESTful API 设计
- 前端使用 ES6+ 语法，采用类的方式组织代码
- 数据库操作使用 sqlite3 模块，注意异步处理
- CSS 使用现代布局技术（Flexbox、Grid）

## 开发注意事项

- 所有 API 接口都需要适当的错误处理
- 数据库操作需要考虑并发安全
- 语音功能需要考虑浏览器兼容性
- 用户体验要保持流畅，避免阻塞操作
