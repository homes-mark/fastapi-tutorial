# FastAPI 学习教程 · 28 法则版 Handoff

> 本文件用于会话中断或切换后，让下一会话仅阅读本文件即可无缝接手。
> 最后更新：2026-11-05 11:00（GMT+8）

---

## 1. 任务概述

**目标**：制作一份关于 FastAPI 的完整、由浅入深的学习教程，以多个互相链接的 HTML 文件呈现，支持完全离线浏览。教程必须体现帕累托学习原则：先抓住承载主要业务逻辑与风险的 20% 主干，再按需扩展边角能力。

**当前状态**：✅ **全部完成**。15 个学习页面（10 章 + 4 阶段实战 + 1 个核心业务纵切面）加首页均已生成，共享资源、移动端目录和进度系统就绪，链接与浏览器渲染已校验。

---

## 2. 已完成内容

### 2.1 交付物清单（全部已生成）

| 文件 | 说明 | 状态 |
|------|------|------|
| `index.html` | 学习路径总览 / 首页 | ✅ |
| `01-basics/01-intro.html` | 第 1 章 简介与安装 | ✅ |
| `01-basics/02-path-request.html` | 第 2 章 路径与请求处理 | ✅ |
| `01-basics/03-request-body.html` | 第 3 章 请求体与 Pydantic | ✅ |
| `02-intermediate/04-dependency.html` | 第 4 章 依赖注入 | ✅ |
| `02-intermediate/05-middleware.html` | 第 5 章 中间件 | ✅ |
| `02-intermediate/06-background.html` | 第 6 章 后台任务 | ✅ |
| `03-advanced/07-async.html` | 第 7 章 异步编程 | ✅ |
| `03-advanced/08-database.html` | 第 8 章 数据库集成 | ✅ |
| `03-advanced/09-auth.html` | 第 9 章 认证与授权 | ✅ |
| `03-advanced/10-websocket.html` | 第 10 章 WebSocket 与部署 | ✅ |
| `04-project/01-stage1.html` | 实战阶段一 单模块 CRUD | ✅ |
| `04-project/02-stage2.html` | 实战阶段二 多模块+数据库 | ✅ |
| `04-project/03-stage3.html` | 实战阶段三 认证+后台任务 | ✅ |
| `04-project/04-stage4.html` | 实战阶段四 企业级完善 | ✅ |
| `04-project/05-core-slice.html` | 28 法则核心业务纵切面 | ✅ |
| `assets/css/style.css` | 全局样式 | ✅ |
| `assets/css/highlight.css` | 语法高亮配色 | ✅ |
| `assets/css/progress.css` | 进度条样式 | ✅ |
| `assets/js/highlight.js` | 自研 Python/JSON/bash 高亮器 | ✅ |
| `assets/js/nav.js` | 复制按钮、目录高亮 | ✅ |
| `assets/js/progress.js` | 进度持久化（localStorage） | ✅ |

### 2.2 已实现的教程要求对照

1. **学习路径与目标**：首页按 4 阶段（入门/进阶/高级/实战）组织，每章含学习目标、前置知识、难度标签（入门/进阶/高级）、建议顺序。✅
2. **核心概念**：覆盖路径与请求、Pydantic 校验、依赖注入、中间件、后台任务、async/await、数据库、认证授权、WebSocket 与部署；每章含「概念关联」板块说明概念间关系与演进。✅
3. **代码示例与练习**：每章含可运行代码 + 由易到难练习（★ 简单 ~ ★★★ 较难）+ 预期输出/验证方法；关键依赖均已标注版本（fastapi 0.110.0、uvicorn 0.29.0、pydantic 2.6.4、sqlalchemy 2.0.29、python-jose 3.3.0、passlib 1.7.4 等）。✅
4. **误区与最佳实践**：每章含「⚠️ 常见误区/坑」和「💡 最佳实践」callout。✅
5. **实战项目**：4 阶段递进（单模块 CRUD → 多模块+数据库 → 认证+后台任务 → 企业级完善），每阶段有目标与增量说明。✅
6. **页面呈现**：侧边栏目录（可跳转）、自研语法高亮、进度条+完成按钮（localStorage 持久化）、完全离线（无 CDN 依赖）。✅
7. **28 法则**：首页新增主干学习地图、20%/80% 投入说明和推荐路线；第 2、3、4、6、7、8、9 章标记为主干；新增 Todo 业务纵切面，把契约、依赖、事务、认证、数据隔离、后台任务和测试串成闭环。✅
8. **公众号参考内容**：参考“FastAPI 入门到实战”系列 19 篇，补充框架选型、APIRouter、Pydantic 模型分层、依赖树与覆盖、异常与请求 ID、Celery、异步性能、SQLAlchemy 2.0、现代认证、文件安全、测试与生产实践。✅
9. **交付物**：本 handoff 文件。✅

---

## 3. 关键设计决策

1. **无外部依赖，完全离线**：语法高亮用自研 JS tokenizer（不引 highlight.js CDN），避免联网失败导致高亮失效。仅支持 `python`、`bash`、`json`、`yaml` 四种语言标记（yaml 目前按纯文本处理）。
2. **进度持久化**：用 `localStorage` 的 key `fastapi_tutorial_progress`，以「页面文件名（去 .html）」为 ID。当前 `data-total-pages="15"`，`data-page-ids` 包含 15 个学习页。**注意**：若未来增删页面，需同步更新所有 HTML 的这两个属性、侧边栏和首页章节卡片。
3. **目录结构固定**：侧边栏是全站统一导航（15 项），每个页面都内嵌完整的 `<nav class="sidebar">`。新增/删除章节时必须批量同步所有 HTML；`core-slice` 是新增的核心纵切面 ID。
4. **浅色主题**：遵循 IDE 浅色主题要求，配色以 FastAPI 品牌绿 `#009688` 为主色。
5. **页面模板约定**：每页 `data-current-page` 必须是该页文件名（去 .html），用于目录 active 高亮；`<script>` 加载顺序固定为 highlight.js → nav.js → progress.js。
6. **移动端导航**：`nav.js` 在窄屏注入“展开章节”按钮，CSS 默认折叠目录，避免正文被完整目录推到首屏之外。移动端完成按钮改为文档流布局，避免遮挡正文。
7. **内容来源**：新增内容参考微信文章专辑“FastAPI 入门到实战”，但页面结构、中文叙述和示例均按本教程上下文重写。引用说明已放在首页、README 和相关章节末尾。

---

## 4. 进行中 / 待办事项

**无阻塞项。** 以下为可选的后续增强（非必需，按需决定是否继续）：

- [ ] 可考虑把侧边栏抽成 JS 模板（用一个 `sidebar.js` 动态生成），消除 16 处重复。当前结构可用，只是维护成本略高。
- [ ] 可补充一个基于核心纵切面的自测题 / 复习卡片页面。
- [ ] 可增加打印样式优化（当前已有基础 `@media print`）。
- [ ] 若教程需要更多语言高亮（如 `toml`、`ini`），需扩展 `assets/js/highlight.js`。

---

## 5. 目录结构（当前实际）

```
fastapi-tutorial/
├── index.html
├── HANDOFF.md              # 本文件
├── assets/
│   ├── css/{style,highlight,progress}.css
│   └── js/{highlight,nav,progress}.js
├── 01-basics/  {01-intro,02-path-request,03-request-body}.html
├── 02-intermediate/ {04-dependency,05-middleware,06-background}.html
├── 03-advanced/ {07-async,08-database,09-auth,10-websocket}.html
└── 04-project/ {01-stage1,02-stage2,03-stage3,04-stage4,05-core-slice}.html
```

---

## 6. 下一步计划（如继续工作）

1. 若用户反馈某章内容偏薄/偏深，直接编辑对应 HTML 文件（用 Edit 工具，注意侧边栏无需改动）。
2. 若需新增章节：新建 HTML → 复制任一页面做模板 → 改 `data-current-page`、正文、`page-nav` 前后链接 → 在**所有页面**侧边栏加一项 → 更新所有页面 `data-page-ids` 和 `data-total-pages`。
3. 修改后至少运行：本地链接检查、HTML 结构检查、`node --check assets/js/*.js`，并用桌面/移动视口截图确认首页和核心纵切面排版。
4. 交付方式：直接打开 `index.html`。

---

## 7. 环境与约定

- 工作目录：`D:/AAAJob/NoteJob/fastapi-tutorial/`
- 编码：所有 HTML 为 UTF-8，`lang="zh-CN"`。
- 引号规范：HTML 属性用 ASCII 双引号；正文中文用中文标点。
- 相对路径：子目录页面引用共享资源用 `../assets/...`，跨目录跳转用 `../01-basics/...` 等。
