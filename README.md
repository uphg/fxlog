# fxlog

一个可扩展和可配置的，用于日志记录、状态报告以及处理其他 Node 模块和应用的输出渲染。

## 安装

```bash
npm install signale
```

## 使用

### 1. 默认类型

所有可用的默认类型

- `✘` error：错误报告
- `ℹ` info：一般信息
- `✔` success：成功状态
- `⚠` warn：警告信息
- log：通用日志

### 2. 自定义类型

```ts
const custom = createLogger({
  types: {
    myLogger: {
      badge: '✨',
      color: 'magenta',
      label: '自定义'
    }
  }
})
```