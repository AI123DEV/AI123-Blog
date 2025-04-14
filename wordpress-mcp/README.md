# AI123.dev WordPress MCP

这是AI123.dev博客的WordPress MCP服务，用于实现Cursor编辑器与WordPress博客系统的集成。

## 功能特性

- 基于JWT认证的WordPress API通信
- 自动监控文章目录变化
- 从Markdown转换为WordPress文章
- 支持文章的分类和标签管理
- 自动处理文章状态流转

## 文件结构

```
wordpress-mcp/
├── build/              # 编译后的JS文件目录
├── src/                # 源代码目录
│   ├── types.ts        # 类型定义
│   ├── wpClient.ts     # WordPress API客户端
│   ├── articleProcessor.ts # 文章处理器
│   ├── fileWatcher.ts  # 文件监控服务
│   ├── mcpMethods.ts   # MCP方法实现
│   ├── index.ts        # 主入口文件
│   └── mcpserver.json  # MCP服务配置
├── .env                # 环境变量（包含敏感信息，不应提交到版本控制）
├── .env.example        # 环境变量示例
├── package.json        # 项目依赖配置
├── tsconfig.json       # TypeScript配置
└── README.md           # 项目说明文档
```

## 安装和设置

1. 安装依赖

```bash
cd wordpress-mcp
npm install
```

2. 配置环境变量

复制`.env.example`为`.env`并填入您的WordPress站点信息：

```bash
cp .env.example .env
```

编辑`.env`文件，填入正确的WordPress凭据和路径设置。

3. 编译TypeScript代码

```bash
npm run build
```

## 使用方法

### 启动服务

```bash
npm start
```

### 开发模式（自动重启）

```bash
npm run dev
```

### 文章流程

1. 在`articles/crafts/`目录创建Markdown文章
2. 文章准备好后，将其移动到`articles/staging/`目录
3. 文件监控服务会自动检测新增的文件，处理并发布到WordPress
4. 发布成功后，文件会被移动到`articles/published/`目录

## Cursor集成

在Cursor编辑器中，可以通过MCP框架与该服务通信：

1. 创建文章：`wordpress.create_post`
2. 获取文章列表：`wordpress.get_posts`
3. 更新文章：`wordpress.update_post`
4. 获取分类：`wordpress.get_categories`
5. 获取标签：`wordpress.get_tags`

## 文章前置元数据格式

```yaml
---
title: "文章标题"
author: "作者姓名"
date: "YYYY-MM-DD"
category: "分类"
categories: ["分类1", "分类2"]
tags: ["标签1", "标签2", "标签3"]
featuredImage: "/path/to/featured/image.jpg"
excerpt: "文章摘要"
status: "draft|published"
slug: "custom-slug"
---
```

## 故障排除

如果遇到问题，请检查：

1. WordPress站点的API是否可访问
2. JWT认证插件是否正确安装和配置
3. 环境变量是否正确设置
4. 文件目录权限是否正确

## 维护和更新

- 定期更新依赖包
- 监控WordPress API变化
- 确保JWT密钥安全 