# Fxlog

本项目是基于 TypeScript 构建的 Node.js 日志打印工具

## Basic Info

- 我在使用 Ubuntu 进行开发
- 中文交流，代码及注释统一使用英文

## Build/Test/Lint Commands

```bash
pnpm install      # 安装项目依赖
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm test:unit    # 执行单元测试
pnpm type-check   # 运行类型检查
pnpm lint         # 代码质量检查
```

## Code Style Guidelines

- 源代码的回车都使用 linux 风格
- 使用单引号，默认不使用分号(仅在必要时添加)
- 只有一句话，且字符数不超过 100 的代码不要过早抽离成函数，除非它出现了的次数大于 2
- 工具类/工具函数：kebab-case (例: `data-formatter.ts`)

## Formatting

- 不要对现有代码进行重新格式化，除非我要求你格式化现有代码

## Committing

- ALWAYS use semantic commits (fix:, feat:, chore:, refactor:, docs:).
