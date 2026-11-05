# FastAPI 由浅入深完整学习教程 · 全项目汇总

> 本文汇总当前项目中除 `editable-version/` 之外的内容，包括教程说明、首页学习地图、15 个学习页面、4 个实战阶段、核心业务纵切面，以及 HTML/CSS/JavaScript 站点实现。

> [!IMPORTANT]
> 本版本保留每章与每个实战阶段的主体讲解、代码示例、表格、练习、预期输出和常见坑，只在结构上统一为 Markdown，并把页面提示框转换为 Typora callouts。章节链接仍指向原始 HTML，方便对照。

> [!NOTE]
> 下文使用 Typora 可识别的 GitHub 风格提示块，例如 `> [!NOTE]`、`> [!TIP]`、`> [!IMPORTANT]`、`> [!WARNING]`、`> [!CAUTION]`。这些块在 Typora 中可渲染为不同颜色的提示框。

- **汇总日期：** 2026-11-05
- **内容基线：** FastAPI 0.110+、Python 3.11+、Pydantic 2、SQLAlchemy 2.0、uv
- **排除目录：** `editable-version/`

## 目录

[TOC]

---

## 1. 项目速览

> **一句话总结：** 这是一套完全离线的 FastAPI 学习站点，以“28 法则”的学习顺序为主线，把请求契约、Pydantic、依赖注入、数据库、认证、异步任务和部署串成一个可运行的工程闭环。

### 1.1 项目定位

| 项目维度 | 当前设计 |
| --- | --- |
| 教程形式 | 多页面离线 HTML 教程，共享 CSS/JS 资源 |
| 内容规模 | 10 章知识课 + 4 个递进阶段 + 1 个核心业务纵切面 |
| 学习主线 | 先抓 20% 主干，再按真实需求补 WebSocket、任务队列、文件处理和运维 |
| 代码风格 | 类型注解、Pydantic 边界、依赖注入、薄路由、明确事务边界 |
| 依赖管理 | `uv + pyproject.toml + uv.lock` |
| 交互能力 | 侧边栏导航、代码复制、移动端折叠目录、学习进度本地持久化 |
| 离线能力 | 不依赖 CDN，自带轻量语法高亮、样式和脚本 |

### 1.2 内容构成

| 类型 | 数量 | 说明 |
| --- | ---: | --- |
| 首页 | 1 | `index.html`，学习路径、进度和章节地图 |
| 知识章节 | 10 | 从 FastAPI 入门到 WebSocket 与部署 |
| 实战阶段 | 4 | 单模块 CRUD → 多模块数据库 → 认证后台任务 → 企业级完善 |
| 核心纵切面 | 1 | Todo API 的契约、事务、认证、归属隔离、后台任务和测试闭环 |
| 项目说明 | 2 | `README.md`、`HANDOFF.md` |
| 前端资源 | 6 | 3 个 CSS 文件、3 个 JavaScript 文件 |

> [!TIP]
> 如果时间有限，推荐的阅读顺序不是从第 1 页平均用力读到最后一页，而是：
>
> `第 1 章 → 第 2–3 章 → 第 4 章 → 第 8 章 → 第 9 章 → 第 6 章 → 核心纵切面`
>
> 完成这条主干后，再补第 5、7、10 章和四个阶段项目的工程细节。

### 1.3 推荐学习路线

```mermaid
flowchart LR
    A[1 基础与环境] --> B[2-3 请求契约]
    B --> C[4 依赖注入]
    C --> D[8 数据库与事务]
    D --> E[9 认证与授权]
    E --> F[6 后台任务]
    F --> G[核心纵切面]
    G --> H[5 中间件]
    H --> I[7 异步优化]
    I --> J[10 WebSocket 与部署]
```

> [!IMPORTANT]
> “28 法则”强调投入优先级，不意味着跳过基础。先把一条真实业务链走通，后续每学一个能力，都能清楚地挂到已有的工程骨架上。

---

## 2. 28 法则：真正的主干是什么

### 2.1 20% 的核心能力

| 主干能力 | 解决的问题 | 对应章节 |
| --- | --- | --- |
| 请求契约 | URL、查询参数、JSON 请求体、状态码和响应结构如何约定 | 第 2–3 章 |
| Pydantic 边界 | 外部输入如何校验，内部数据如何与公开响应隔离 | 第 3、8 章 |
| 依赖与会话 | 当前用户、数据库会话、配置和清理如何统一管理 | 第 4、8 章 |
| 认证与数据隔离 | 登录是否有效、用户能操作哪些资源、如何防 IDOR | 第 8–9 章 |
| 异步任务边界 | 什么时候用 `async`、`BackgroundTasks` 或真正的任务队列 | 第 6–7 章 |

> **核心判断：** 绝大多数 CRUD、后台系统、小程序 API 和 AI 服务接口，都绕不开“请求进入 → 输入可信 → 身份明确 → 数据隔离 → 事务正确 → 响应返回 → 后台任务可控”这条链路。

### 2.2 80% 的业务风险

真实项目里，大量问题不是“接口写不出来”，而是：

- 客户端能提交本不该提交的字段；
- 查询只带 `id`，忘记 `owner_id`，造成越权；
- 一次性写多张表，却让每个 repository 自己提交；
- `async def` 里调用同步数据库驱动或 `requests`，阻塞整个事件循环；
- 后台任务复用请求级 `Session`、ORM 对象或 `ContextVar`；
- JWT 密钥硬编码，或者把敏感资料塞进可被 Base64 解码的 Payload；
- 多 worker 部署后仍使用进程内字典保存广播、限流或临时状态；
- 生产环境使用 `create_all()` 和 `--reload`；
- 测试只验证“接口能返回 200”，却没有覆盖 401、422、403、404 和越权路径。

> [!WARNING]
> 不要用“能跑”代替“边界正确”。FastAPI 提供了类型系统和依赖注入，但认证、事务、数据归属和任务生命周期仍必须由代码明确表达。

### 2.3 剩余能力的触发条件

| 能力 | 什么时候需要 |
| --- | --- |
| Celery / Dramatiq / arq | 任务必须持久化、重试、可查询进度或跨进程执行 |
| Redis 缓存与限流 | 热点读、登录防爆破、共享计数、多实例状态 |
| WebSocket | 实时聊天、通知、协作编辑是核心需求 |
| 文件上传与对象存储 | 附件、头像、导入导出是真实业务功能 |
| 压测与性能分析 | 已明确瓶颈出现在并发、连接池或外部调用 |
| 容器编排与 CI/CD | 需要稳定发布、扩容、回滚和自动验收 |

> [!NOTE]
> 这些能力不是“不重要”，而是不应该在主干闭环尚未跑通时被平均用力。

---

## 3. 章节地图

| 章节 | 页面 | 核心主题 | 定位 |
| --- | --- | --- | --- |
| 第 1 章 | [简介与安装](./01-basics/01-intro.html) | FastAPI、uv、Hello World、OpenAPI | 入门 |
| 第 2 章 | [路径与请求处理](./01-basics/02-path-request.html) | 路径参数、查询参数、路由顺序、APIRouter | 入门 |
| 第 3 章 | [请求体与 Pydantic](./01-basics/03-request-body.html) | 请求体、字段约束、模型分层、响应白名单 | 入门 |
| 第 4 章 | [依赖注入](./02-intermediate/04-dependency.html) | `Depends`、yield 依赖、依赖缓存、测试覆盖 | 进阶 |
| 第 5 章 | [中间件](./02-intermediate/05-middleware.html) | 请求钩子、CORS、request ID、异常响应 | 进阶 |
| 第 6 章 | [后台任务](./02-intermediate/06-background.html) | `BackgroundTasks`、生命周期、任务队列 | 进阶 / 主干 |
| 第 7 章 | [异步编程](./03-advanced/07-async.html) | 事件循环、阻塞陷阱、异步客户端、压测 | 高级 / 主干 |
| 第 8 章 | [数据库集成](./03-advanced/08-database.html) | SQLAlchemy 2.0、Session、事务、N+1 | 高级 / 主干 |
| 第 9 章 | [认证与授权](./03-advanced/09-auth.html) | Argon2、JWT、当前用户、401/403、IDOR | 高级 / 主干 |
| 第 10 章 | [WebSocket 与部署](./03-advanced/10-websocket.html) | 长连接、广播、Docker、文件安全 | 高级 / 按需扩展 |
| 阶段一 | [单模块 CRUD](./04-project/01-stage1.html) | 单文件、内存存储、完整 CRUD | 实战铺垫 |
| 阶段二 | [多模块 + 数据库](./04-project/02-stage2.html) | 分层、SQLAlchemy、SQLite、会话依赖 | 实战主干 |
| 阶段三 | [认证 + 后台任务](./04-project/03-stage3.html) | 注册登录、JWT、受保护接口、通知任务 | 实战主干 |
| 阶段四 | [企业级完善](./04-project/04-stage4.html) | 配置、限流、日志、Docker、CI、测试 | 上线前加固 |
| 核心路线 | [20% 主干业务纵切面](./04-project/05-core-slice.html) | Todo API 的完整安全业务闭环 | 必修 |

---

## 4. 基础篇：完整章节与示例

> [!TIP]
> 这一部分完整保留第 1–3 章正文，包括环境搭建、路由参数、Pydantic 模型、请求体校验和全部练习。

---

### 第 1 章 · FastAPI 简介与安装

*难度：入门 前置：会写基础 Python 预计：30 分钟 依赖：uv*

> [!TIP]
>
> **学习目标**
>
> - 理解 FastAPI 是什么、解决什么问题、为什么「快」；
> - 能根据项目类型在 Django、FastAPI、Flask 之间做出合理选择；
> - 用 uv 独立完成环境搭建、依赖安装与项目运行；
> - 写出并运行第一个 Hello World 应用；
> - 认识自动生成的交互式 API 文档（Swagger / ReDoc）。

> [!NOTE]
>
> **前置知识**
>
> 会写基础 Python：函数、变量、`if/for`、装饰器（了解即可）。无需 Web 框架经验。

#### 1.1 FastAPI 是什么

FastAPI 是一个现代、高性能的 Python Web 框架，用于构建 API。它基于两大支柱：

- **Starlette** —— 底层的 ASGI 框架，负责 HTTP 请求、路由、WebSocket、中间件等网络细节；
- **Pydantic** —— 数据校验与序列化库，负责把请求/响应数据转换成类型安全的 Python 对象。

FastAPI 在这两者之上，用 Python 的**类型注解（type hints）**作为声明式接口，让你写很少的代码就能获得：

- **自动数据校验**：请求体字段类型、必填性、约束，全自动检查；
- **自动文档**：无需手写，自动生成 OpenAPI 规范的交互式文档；
- **编辑器补全**：因为参数有类型，IDE 能给出精准的补全和错误提示；
- **高性能**：基于 ASGI 异步，性能可媲美 Node.js 和 Go。

> [!NOTE]
>
> **为什么「快」？**
>
> FastAPI 的「快」有两层：一是**开发快**——类型注解 + 自动文档省去大量样板代码；二是**运行快**——基于 ASGI 的异步事件循环，在 I/O 密集场景下吞吐远高于传统 WSGI 框架（如 Flask、Django）。

#### 1.2 什么时候选 FastAPI

框架没有谁绝对更高级，关键看项目的主要工作量。下面这张表比“哪个框架最好”更接近真实决策：

| 项目特征 | 优先选择 | 原因 |
|----|----|----|
| 需要完整后台、Admin、内容管理、现成权限体系 | Django | ORM、认证、权限、后台管理开箱即用；对外 API 可再接 DRF |
| 主要交付 JSON API、AI 服务、小程序或 App 后端 | FastAPI | 类型校验、自动文档、依赖注入和异步 I/O 形成完整 API 开发链路 |
| 小工具、课程 Demo、快速验证想法 | Flask | 核心极小、整合自由，几十个页面以内跑得很快 |

> [!NOTE]
>
> **选型判断可以很朴素**
>
> 如果核心工作是“管理内容和用户”，先看 Django；如果核心工作是“接收请求、校验数据、调用服务、返回 JSON”，FastAPI 更顺手；如果只是写一个很小、生命周期很短的内部工具，Flask 的自由度反而更低成本。

#### 1.3 用 uv 管理环境与依赖

新项目统一使用 [uv](https://docs.astral.sh/uv/) 管理 Python 版本、虚拟环境和依赖。uv 会根据项目配置自动创建并维护 `.venv`，日常不需要手动激活环境，也不要在项目里直接运行 `pip install`。教程以 Python 3.11+ 为基线。

```bash
# 首次安装 uv（Windows PowerShell）
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# 首次安装 uv（macOS / Linux）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 创建应用项目并添加 FastAPI 运行依赖
uv init --app fastapi-hello
cd fastapi-hello
uv add "fastapi[standard]"
```

> [!TIP]
>
> **uv 项目里该提交什么**
>
> `pyproject.toml` 记录直接依赖，`uv.lock` 记录完整依赖解析结果，两者都要提交到 Git；`.venv` 不提交。团队成员执行 `uv sync --frozen` 就能还原锁文件中的环境。需要固定版本时可用 `uv add "fastapi[standard]==0.141.1"`；常规升级使用 `uv lock --upgrade-package fastapi`，验证后再提交新的锁文件。

#### 1.4 第一个应用：Hello World

把项目中的 `main.py` 替换为：

**main.py**

```python
from fastapi import FastAPI

app = FastAPI(title="我的第一个 FastAPI 应用", version="0.1.0")


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}
```

逐行理解：

- `app = FastAPI(...)`：创建应用实例，是核心对象；
- `@app.get("/")`：**路径操作装饰器**，声明「对根路径的 GET 请求」走这个函数；
- `read_root()`：**路径操作函数**，返回值会被自动序列化为 JSON。

启动服务：

```bash
# FastAPI CLI：开发时推荐
uv run fastapi dev main.py

# 或直接使用 Uvicorn
uv run uvicorn main:app --reload
```

访问 `http://127.0.0.1:8000`，会看到 `{"message":"Hello, FastAPI!"}`。`--reload` 表示代码改动后自动重启，仅用于开发环境。

> [!NOTE]
>
> **为什么命令前面都加 uv run**
>
> `uv run` 会先确保项目环境与 `uv.lock` 同步，再用该环境执行命令，因此不依赖终端有没有激活虚拟环境。`fastapi dev main.py` 是 FastAPI CLI 的开发模式，自带热重载；`uvicorn main:app --reload` 是更底层的 ASGI 启动方式。生产环境不要使用 `--reload`。

#### 1.5 自动生成的 API 文档

FastAPI 最惊艳的特性之一——无需任何额外配置，访问以下地址即可看到交互式文档：

- **Swagger UI**：`http://127.0.0.1:8000/docs` —— 可视化、可在线调试；
- **ReDoc**：`http://127.0.0.1:8000/redoc` —— 更适合阅读的文档样式；
- **OpenAPI JSON**：`http://127.0.0.1:8000/openapi.json` —— 机器可读的接口规范。

这些文档是**从你的类型注解自动推导**出来的，这也是 FastAPI 核心设计理念「声明即文档」的体现。后续章节你会看到，写一个带 Pydantic 模型的路由，文档里立刻就有字段说明和示例。

> [!NOTE]
>
> **概念关联**
>
> **概念关联：**本章的 `@app.get` 装饰器和 ASGI 服务器（Uvicorn）是后续一切的地基——第 2 章会展开路径与请求处理的细节；第 7 章会深入 ASGI 背后的异步事件循环。

#### 1.6 动手练习

**练习 1 · 自定义路由 ★ 简单**

在 `main.py` 中新增一个 `GET /ping` 路由，返回 `{"status": "ok"}`，并用浏览器访问验证。

> [!TIP]
>
> **验证与预期**
>
> **预期输出：**访问 `/ping` 返回 `{"status":"ok"}`；访问 `/docs` 能看到新增的路由。

**练习 2 · 修改应用元信息 ★ ★ 中等**

给 `FastAPI()` 传入 `title`、`description`、`version` 参数，观察 `/docs` 页面的标题和说明变化。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**打开 `/docs`，页面顶部应显示你设置的应用名和描述。

> [!WARNING]
>
> **常见误区**
>
> 「`uv run uvicorn main:app` 里的 `main` 是模块名，`app` 是变量名」——如果你的文件不叫 `main.py` 或变量不叫 `app`，启动命令要相应改。模块名和变量名对不上，是初学者启动失败的高频原因。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**框架选型、类型注解驱动文档和 FastAPI CLI 的说明，参考自微信公众号“FastAPI 入门到实战”系列第 1 篇。本文已按当前教程上下文重新编写。

> 原始页面：[01-basics/01-intro.html](./01-basics/01-intro.html)

---

### 第 2 章 · 路径与请求处理

*难度：入门 前置：第 1 章 预计：45 分钟*

> [!TIP]
>
> **学习目标**
>
> - 掌握路径参数、查询参数、请求体的声明方式与区别；
> - 理解 FastAPI 如何根据参数位置自动推断数据来源；
> - 学会路径匹配规则、参数校验与默认值；
> - 能用 `Annotated` + `Query`/`Path` 做精细参数约束；
> - 会用 `APIRouter` 把一组资源接口从单文件中拆出去。

> [!NOTE]
>
> **前置知识**
>
> 第 1 章内容：能创建 `FastAPI` 实例、写路径操作装饰器、启动 Uvicorn。

#### 2.1 请求的三种参数来源

HTTP 请求里，参数可以出现在三个位置，FastAPI 通过**函数参数声明的位置**自动区分：

| 参数类型 | URL 示例 | 在 FastAPI 中如何声明 |
|----|----|----|
| 路径参数（Path） | `/items/42` | 写在路径字符串 `{item_id}` 里 |
| 查询参数（Query） | `/items?page=1&size=10` | 普通函数参数（不带默认值则必填） |
| 请求体（Body） | POST 的 JSON 载荷 | 声明为 Pydantic 模型参数（第 3 章详述） |

#### 2.2 路径参数

**main.py**

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/items/{item_id}")
def read_item(item_id: int):
    # item_id 从 URL 路径中提取，并自动转成 int
    return {"item_id": item_id, "type": type(item_id).__name__}
```

访问 `/items/42`，返回 `{"item_id":42,"type":"int"}`。注意：

- URL 里的 `42` 是字符串，但 FastAPI 根据类型注解 `int` 自动转换；
- 访问 `/items/abc` 会得到 **422 校验错误**，因为 `abc` 无法转成 `int`——这就是声明式校验的威力。

> [!WARNING]
>
> **路径顺序陷阱（重要）**
>
> 路由是按**声明顺序**匹配的。固定路径必须写在带参数路径的**前面**：
>
> ``` python
> @app.get("/users/me")        # 先声明固定路径
> def read_me():
>     return {"id": "me"}
>
> @app.get("/users/{user_id}")  # 后声明动态路径
> def read_user(user_id: str):
>     return {"id": user_id}
> ```
>
> 如果顺序颠倒，访问 `/users/me` 会被 `{user_id}` 捕获，把 `me` 当成 `user_id` 传进去。

#### 2.3 查询参数

**main.py**

```python
from fastapi import FastAPI
from typing import Optional

app = FastAPI()


@app.get("/items/")
def list_items(page: int = 1, size: int = 10, keyword: Optional[str] = None):
    # page、size 是查询参数（有默认值），keyword 是可选的查询参数
    return {"page": page, "size": size, "keyword": keyword}
```

- 没有默认值的参数 → **必填**查询参数；
- 有默认值的参数 → 可选查询参数；
- `Optional[str] = None` → 可选且可为空。

#### 2.4 用 Query / Path 做精细校验

需要额外约束（如长度、范围、别名）时，用 `Query` 和 `Path` 补充元数据：

**main.py**

```python
from typing import Annotated
from fastapi import FastAPI, Query, Path

app = FastAPI()


@app.get("/items/{item_id}")
def read_item(
    item_id: Annotated[int, Path(ge=1, description="物品 ID，必须 >= 1")],
    q: Annotated[str | None, Query(
        min_length=3,
        max_length=50,
        description="搜索关键词",
    )] = None,
):
    return {"item_id": item_id, "q": q}
```

- `Annotated[int, Path(ge=1)]`：类型仍是 `int`，`Path` 只提供 FastAPI 元数据；
- `= None` 才表示可选；`str | None` 只表示“值允许为 None”；
- 这些约束会自动反映在 `/docs` 文档里，并触发 422 校验。

> [!TIP]
>
> **为什么不继续写 Query(None, ...)**
>
> 老写法能运行，但默认值被包进 `Query(...)` 后，IDE 和静态类型检查器更难识别真实参数类型。`Annotated` 把“类型”和“校验元数据”分开，也让分页参数等约束可以定义成别名后跨接口复用。

#### 2.5 用 APIRouter 组织一个资源

REST 的核心不是“把五个函数写在一起”，而是**路径标识资源，HTTP 方法标识操作**：

| 操作     | 方法 + 路径               | 成功状态码 | 资源不存在 |
|----------|---------------------------|------------|------------|
| 列表     | `GET /todos`              | 200        | \-         |
| 创建     | `POST /todos`             | 201        | \-         |
| 详情     | `GET /todos/{todo_id}`    | 200        | 404        |
| 全量更新 | `PUT /todos/{todo_id}`    | 200        | 404        |
| 删除     | `DELETE /todos/{todo_id}` | 204        | 404        |

**routers/todos.py**

```python
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/todos", tags=["todos"])

todos: dict[int, dict] = {
    1: {"id": 1, "title": "写 FastAPI 教程", "done": False},
}


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)


@router.get("")
def list_todos():
    return list(todos.values())


@router.post("", status_code=status.HTTP_201_CREATED)
def create_todo(payload: TodoCreate):
    new_id = max(todos, default=0) + 1
    todo = {"id": new_id, "title": payload.title, "done": False}
    todos[new_id] = todo
    return todo


@router.get("/{todo_id}")
def get_todo(todo_id: int):
    if todo_id not in todos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    return todos[todo_id]
```

**main.py**

```python
from fastapi import FastAPI
from routers import todos

app = FastAPI(title="Todo API")
app.include_router(todos.router)
```

`prefix="/todos"` 与 `@router.get("")` 组合出的路径是 `/todos`；如果写成 `@router.get("/")`，路径会变成 `/todos/`，客户端访问不带尾斜杠的地址时可能收到 307 重定向。

> [!WARNING]
>
> **路由顺序在 APIRouter 内部同样生效**
>
> 如果在 `/todos/{todo_id}` 后面才声明 `/todos/summary`，前者会先吞掉 `summary`，随后因无法转换为整数返回 422。固定路径永远放在动态路径前面。

> [!NOTE]
>
> **概念关联**
>
> **概念关联：**本章的「参数自动校验」正是 Pydantic 能力的初步体现——第 3 章会看到，请求体用 Pydantic 模型声明后，能获得**更强大、嵌套、可复用**的校验与序列化能力。而 `Query` / `Path` 本质上就是「参数级的 Pydantic 约束」。

#### 2.6 动手练习

**练习 1 · 混合参数 ★ 简单**

写一个 `GET /users/{user_id}/posts` 路由，接收路径参数 `user_id: int` 和查询参数 `limit: int = 10`，返回这两个值。

> [!TIP]
>
> **验证与预期**
>
> **预期输出：**访问 `/users/7/posts?limit=3` 返回 `{"user_id":7,"limit":3}`。

**练习 2 · 路径顺序验证 ★ ★ 中等**

把 `/users/me` 声明在 `/users/{user_id}` 之后，观察访问 `/users/me` 时发生了什么，再把顺序调回来对比。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**顺序颠倒时访问 `/users/me` 会走 `{user_id}` 分支（返回 `{"id":"me"}` 而不是固定值）；调回正确顺序后返回固定值。

**练习 3 · 参数校验 ★ ★ 中等**

用 `Path(..., ge=1, le=1000)` 约束一个路径参数，然后用 `/items/0` 和 `/items/2000` 测试。

> [!TIP]
>
> **验证与预期**
>
> **预期输出：**两者都应返回 422 校验错误，错误信息里包含「大于等于 1」或「小于等于 1000」的提示。

> [!TIP]
>
> **最佳实践**
>
> 优先用**类型注解**声明参数，只在需要额外约束时才引入 `Query`/`Path`。过多的 `Query(...)` 会让函数签名变得冗长，可读性下降。校验逻辑属于「数据层」，尽量放在 Pydantic 模型里（第 3 章），路由函数保持薄。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**路由匹配顺序、`APIRouter`、尾部斜杠和 404 语义参考自“FastAPI 入门到实战”系列第 2 篇；本页示例与练习已重新组织。

> 原始页面：[01-basics/02-path-request.html](./01-basics/02-path-request.html)

---

### 第 3 章 · 请求体与 Pydantic

*难度：入门 前置：第 1、2 章 预计：60 分钟*

> [!TIP]
>
> **学习目标**
>
> - 理解 Pydantic 模型的核心作用：校验、转换、序列化；
> - 掌握声明请求体的方法，以及嵌套模型、可选字段、默认值；
> - 学会用 `Field` 添加字段级约束和示例；
> - 能拆分创建、更新、内部和公开响应模型，避免字段越界；
> - 理解请求体校验失败时返回的 422 错误结构。

> [!NOTE]
>
> **前置知识**
>
> 第 1、2 章：路径/查询参数。了解 Python 类的基本写法（`class`、继承）。

#### 3.1 认识 Pydantic 模型

Pydantic 模型是一个继承自 `BaseModel` 的类，用类型注解声明字段：

**models.py**

```python
from pydantic import BaseModel


class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = False  # 有默认值 → 可选字段
```

这个模型做了三件事：

- **校验（Validation）**：传入的数据类型必须匹配，否则报错；
- **转换（Coercion）**：比如把字符串 `"3.5"` 自动转成 `float`；
- **序列化（Serialization）**：把对象转成 dict / JSON。

#### 3.2 在路由中使用请求体

只要把 Pydantic 模型作为路由函数的参数类型，FastAPI 就会自动从请求体中解析 JSON 并校验：

**main.py**

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = False


@app.post("/items/")
def create_item(item: Item):
    # item 已经是校验后的 Item 对象
    return {"name": item.name, "price": item.price, "is_offer": item.is_offer}
```

用 curl 测试：

```bash
curl -X POST http://127.0.0.1:8000/items/ \
  -H "Content-Type: application/json" \
  -d '{"name":"键盘","price":299.0}'
```

返回 `{"name":"键盘","price":299.0,"is_offer":false}`——注意 `is_offer` 没传，用了默认值 `false`。

> [!CAUTION]
>
> **校验失败会发生什么**
>
> 如果传 `{"name":123,"price":"abc"}`，FastAPI 会返回 **422 Unprocessable Entity**，响应体结构如下：
>
> ``` json
> {
>   "detail": [
>     {
>       "loc": ["body", "price"],
>       "msg": "Input should be a valid number...",
>       "type": "float_parsing"
>     }
>   ]
> }
> ```
>
> `loc` 指出了出错字段的位置（`body.price`），这对前端联调非常有价值。

#### 3.3 嵌套模型与复杂结构

模型可以嵌套、组合，构建复杂的数据结构：

**main.py**

```python
from pydantic import BaseModel, Field


class Address(BaseModel):
    city: str
    street: str


class User(BaseModel):
    name: str
    age: int
    tags: list[str] = Field(default_factory=list)  # 每次实例独立创建
    address: Address | None = None                  # 可选嵌套模型


@app.post("/users/")
def create_user(user: User):
    return {"user": user, "city": user.address.city if user.address else None}
```

嵌套模型让校验规则自然组合，这也是后续「数据库 ORM 模型」与「API 请求模型」分离设计的基础（第 8 章）。

#### 3.4 用 Field 添加约束与示例

**main.py**

```python
from pydantic import BaseModel, Field


class Product(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="商品名")
    price: float = Field(..., gt=0, description="价格，必须大于 0")
    stock: int = Field(0, ge=0, description="库存，不能为负")
    sku: str = Field(..., pattern=r"^[A-Z]{2}-\d{4}$", description="SKU 编码")
```

- `gt=0` / `ge=0`：数值范围约束；
- `min_length` / `max_length`：字符串长度约束；
- `pattern`：正则校验；
- 所有 `description` 都会出现在 `/docs` 文档中；Pydantic v2 用复数 `examples=[...]` 提供示例。

#### 3.5 同一实体的四套模型

真实业务里，“创建用户”“更新用户”“数据库中的用户”“返回给前端的用户”拥有的字段并不相同。最稳妥的做法是按边界拆模型，而不是用一个类贯穿所有场景：

**schemas/user.py**

```python
from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    email: str


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=64)


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=20)
    email: str | None = None
    model_config = ConfigDict(extra="forbid")


class UserPublic(UserBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)
```

| 模型         | 用途           | 关键约束                                       |
|--------------|----------------|------------------------------------------------|
| `UserCreate` | POST 注册      | 必须带密码，禁止客户端指定 `id`                |
| `UserUpdate` | PATCH 更新     | 字段可选，`extra="forbid"` 防止越权字段        |
| `UserInDB`   | 内部数据库视图 | 可包含密码哈希，绝不能直接作为响应模型         |
| `UserPublic` | 对外响应       | 只声明允许暴露的字段；可开启 `from_attributes` |

做局部更新时，用 `exclude_unset=True` 区分“没传”和“传了默认值”：

```python
@app.patch("/users/{user_id}", response_model=UserPublic)
def update_user(user_id: int, payload: UserUpdate):
    user = get_user_or_404(user_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    return user
```

#### 3.6 response_model 是响应白名单

请求模型负责“允许客户端传什么”，响应模型负责“允许服务端返还什么”。两者不是同一件事：

```python
class UserInDB(UserBase):
    id: int
    hashed_password: str
    is_active: bool = True
    model_config = ConfigDict(from_attributes=True)


@app.get("/users/{user_id}", response_model=UserPublic)
def get_user(user_id: int):
    # 即使内部对象包含 hashed_password，
    # FastAPI 也只按 UserPublic 的字段构造响应。
    return load_user_from_db(user_id)
```

> [!CAUTION]
>
> **ResponseValidationError 只会在运行时出现**
>
> 如果 `response_model` 声明的字段在返回对象里不存在，服务启动时通常不报错，只有真实请求触发序列化时才返回 500。修改响应模型后，必须实际调用接口验证，不能只看启动成功。

> [!NOTE]
>
> **概念关联**
>
> **概念关联：**Pydantic 模型是贯穿整个 FastAPI 的核心抽象——第 4 章依赖注入会用它声明依赖的返回值；第 8 章数据库集成会区分「Pydantic Schema」和「SQLAlchemy Model」；第 9 章认证会用模型声明 Token 与用户信息。掌握好本章，后续事半功倍。

#### 3.7 动手练习

**练习 1 · 基础请求体 ★ 简单**

定义一个 `POST /books/`，接收 `{title, author, pages, published}` 四个字段（`published` 默认 `true`），返回完整对象。

> [!TIP]
>
> **验证与预期**
>
> **预期输出：**POST 缺省 `published` 时返回中该字段为 `true`；缺 `title` 时返回 422。

**练习 2 · 嵌套模型 ★ ★ 中等**

定义 `Order` 模型，包含 `items: list[Item]`（嵌套第 3.2 节的 `Item`），写一个 `POST /orders/` 返回订单总价。

> [!TIP]
>
> **验证与预期**
>
> **预期输出：**POST `{"items":[{"name":"a","price":10},{"name":"b","price":20}]}`，返回总价 `30.0`。

**练习 3 · Field 约束 ★ ★ ★ 较难**

给 `Product.sku` 加正则约束（如 `^[A-Z]{2}-\d{4}$`），分别用合法与非法的 SKU 测试，观察 422 差异。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**`"AB-1234"` 通过；`"ab-1234"` 或 `"A1-234"` 返回 422，`detail[0].loc` 指向 `body.sku`。

> [!TIP]
>
> **最佳实践**
>
> 请求模型、响应模型、数据库模型要**分开定义**，不要复用同一个类。因为三者职责不同（校验输入 / 塑造输出 / 持久化），混用会导致「数据库字段泄露到 API」或「API 字段污染数据库」。这个原则在第 8 章会详细展开。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**本页的模型分层、`from_attributes`、`extra="forbid"` 与 PATCH 更新语义参考自“FastAPI 入门到实战”系列第 3、7 篇，并按本教程用户模型重新简化。

> 原始页面：[01-basics/03-request-body.html](./01-basics/03-request-body.html)

## 5. 进阶篇：完整章节与示例

> [!IMPORTANT]
> 依赖注入、中间件和后台任务决定项目如何组织公共逻辑与资源生命周期，是后续数据库、认证和测试的地基。

---

### 第 4 章 · 依赖注入（Dependency Injection）

*难度：进阶 前置：第 1–3 章 预计：60 分钟*

> [!TIP]
>
> **学习目标**
>
> - 理解依赖注入（DI）的核心思想及其解决的问题；
> - 掌握 `Depends` 的用法：函数依赖、类依赖、带参数的依赖；
> - 理解依赖的生命周期、缓存与作用域；
> - 会用依赖实现「复用逻辑」和「共享资源」（数据库会话、当前用户）；
> - 能用路由级依赖统一认证，并在测试中通过 `dependency_overrides` 替换依赖。

> [!NOTE]
>
> **前置知识**
>
> 第 1–3 章：路由、参数声明、Pydantic 模型。了解「函数可复用」的基本思想即可。

#### 4.1 为什么需要依赖注入

想象一个场景：多个接口都需要**验证请求头里的 API Key**。不用 DI 时，你得在每个函数里复制粘贴这段逻辑：

```python
@app.get("/a/")
def endpoint_a(api_key: str):
    if api_key != SECRET:      # 重复逻辑
        raise HTTPException(401, "Invalid key")
    ...

@app.get("/b/")
def endpoint_b(api_key: str):
    if api_key != SECRET:      # 又重复一遍
        raise HTTPException(401, "Invalid key")
    ...
```

问题很明显：逻辑重复、难以维护、改一处要改 N 处。依赖注入把这段「公共逻辑」抽出来，让 FastAPI 自动调用并注入结果。

#### 4.2 用 Depends 抽取公共逻辑

**main.py**

```python
from typing import Annotated
from fastapi import FastAPI, Depends, Header, HTTPException

app = FastAPI()
SECRET = "my-secret-key"


def verify_api_key(api_key: Annotated[str | None, Header()] = None):
    """公共依赖：校验 API Key，返回解析后的身份"""
    if api_key != SECRET:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return {"client": "trusted"}


@app.get("/a/")
def endpoint_a(auth: Annotated[dict, Depends(verify_api_key)]):
    return {"endpoint": "a", "auth": auth}


@app.get("/b/")
def endpoint_b(auth: Annotated[dict, Depends(verify_api_key)]):
    return {"endpoint": "b", "auth": auth}
```

现在 `verify_api_key` 成了一个可复用的「依赖」，任何路由只要写 `Depends(verify_api_key)` 就能自动完成校验。依赖函数本身也可以有自己的依赖（比如这里的 `Header`），形成依赖链。

#### 4.3 依赖的返回值与作用

- **校验与拦截**：依赖里 `raise HTTPException`，路由根本不会执行；
- **提供共享资源**：返回数据库会话、当前用户、配置对象等；
- **控制生命周期**：用 `yield` 可以在请求结束后做清理（见下）。

#### 4.4 yield 依赖：请求后清理

依赖函数用 `yield` 代替 `return`，`yield` 之前的代码在请求前执行，之后的代码在响应后执行——非常适合管理资源（如数据库连接）：

**main.py**

```python
from fastapi import FastAPI, Depends

app = FastAPI()


def get_db():
    db = {"connection": "active"}
    print("打开数据库连接")
    try:
        yield db                 # 把 db 注入给路由
    except Exception:
        print("业务异常，回滚")
        raise
    finally:
        print("关闭数据库连接")    # 无论成功或异常都清理


@app.get("/data/")
def read_data(db: Annotated[dict, Depends(get_db)]):
    return {"db": db}
```

这正是第 8 章数据库集成中「会话管理」的实现原理——`get_db` 依赖在请求结束时自动关闭 SQLAlchemy 会话。

> [!NOTE]
>
> **依赖缓存与作用域**
>
> 在**同一次请求**中，如果多个路由或子依赖都依赖了同一个 `get_db`，FastAPI 默认**只调用一次**并复用结果（缓存）。这能避免一个请求内重复建立数据库连接。理解这一点对性能优化很关键。

> [!WARNING]
>
> **yield 之后不等于自动提交事务**
>
> `finally: db.close()` 只保证连接被释放，不保证业务数据已经提交。简单 CRUD 可以让 service 显式 `commit()`；需要跨多个写操作保持原子性时，应由同一个用例统一决定提交或回滚。不要把“没报错”误认为“事务已成功”。

#### 4.5 类依赖

依赖也可以是一个类，FastAPI 会实例化它。适合有状态、需要初始化的复杂依赖：

**main.py**

```python
class Config:
    def __init__(self):
        self.db_url = "sqlite:///app.db"
        self.debug = True


@app.get("/config/")
def read_config(cfg: Annotated[Config, Depends()]):
    return {"db_url": cfg.db_url, "debug": cfg.debug}
```

#### 4.6 路由级依赖与测试替换

如果一组接口都需要登录，逐个函数添加 `Depends(get_current_user)` 仍然可能漏掉。把认证挂到 router 上，安全边界就不会依赖开发者记性：

**routers/todos.py**

```python
from fastapi import APIRouter, Depends
from deps import get_current_user

router = APIRouter(
    prefix="/todos",
    tags=["todos"],
    dependencies=[Depends(get_current_user)],
)


@router.get("")
def list_todos():
    # 能进入函数，说明认证已经通过
    return []


@router.post("")
def create_todo():
    return {"created": True}
```

依赖注入还有一个常被低估的价值：测试时可替换。真实依赖查数据库、校验外部令牌；测试依赖直接返回固定测试用户：

**tests/conftest.py**

```python
from fastapi.testclient import TestClient
from app.main import app
from deps import get_current_user


def fake_current_user() -> dict:
    return {"id": 1, "username": "tester", "is_active": True}


app.dependency_overrides[get_current_user] = fake_current_user
client = TestClient(app)


def test_authenticated_route():
    response = client.get("/todos")
    assert response.status_code == 200

    # 测试结束后应恢复，避免污染其他用例
    app.dependency_overrides.pop(get_current_user, None)
```

> [!TIP]
>
> **依赖树先想清楚，再写函数**
>
> 一个典型安全链路是 `oauth2_scheme → get_current_user → require_admin`；数据库链路是 `get_db → repository`。依赖失败会在业务函数执行前中断请求，因此认证、权限和资源存在性检查都适合放入依赖或 service 的前置逻辑。

> [!NOTE]
>
> **概念关联**
>
> **概念关联：**依赖注入是 FastAPI 的「黏合剂」。第 8 章用它注入数据库会话，第 9 章用它注入「当前登录用户」做权限校验，实战项目里几乎每个路由都依赖 `get_db` 和 `get_current_user`。理解本章，后面的代码会变得非常自然。

#### 4.7 动手练习

**练习 1 · 抽取校验依赖 ★ 简单**

写一个 `require_admin` 依赖，检查查询参数 `role` 是否为 `"admin"`，不是则抛 403。给两个路由都加上它。

> [!TIP]
>
> **验证与预期**
>
> **预期输出：**带 `?role=admin` 返回正常数据；不带或 `role=user` 返回 403。

**练习 2 · yield 清理验证 ★ ★ 中等**

用 `get_db` 的 `yield` 模式，观察终端里「打开/关闭」日志的打印顺序，确认清理在响应后执行。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**访问一次 `/data/`，终端依次打印「打开数据库连接」→ 返回响应 →「关闭数据库连接」。

**练习 3 · 依赖链 ★ ★ ★ 较难**

让 `get_current_user` 依赖 `verify_api_key` 依赖（依赖套依赖），返回当前用户，并在路由中使用。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**带合法 Key 访问时返回用户信息；非法 Key 返回 401，且路由不执行。

> [!TIP]
>
> **最佳实践**
>
> 把依赖理解为「路由的前置协议」。优先用**函数依赖**（简单、易测试），只有需要初始化状态时才用类依赖。依赖函数保持单一职责；对整组受保护接口使用 router 级依赖，比逐路由手工添加更安全。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**依赖树、缓存、路由级认证和测试覆盖参考自“FastAPI 入门到实战”系列第 6 篇；本页保留了教程原有的 API Key 入门示例，并补充数据库会话边界。

> 原始页面：[02-intermediate/04-dependency.html](./02-intermediate/04-dependency.html)

---

### 第 5 章 · 中间件（Middleware）

*难度：进阶 前置：第 4 章 预计：45 分钟*

> [!TIP]
>
> **学习目标**
>
> - 理解中间件在请求处理链路中的位置与作用；
> - 掌握 `@app.middleware("http")` 的写法；
> - 学会实现日志记录、请求计时、CORS 跨域等常见中间件；
> - 理解中间件与依赖注入、异常处理器的职责边界；
> - 能用 request_id 串联一次请求的日志与错误响应。

> [!NOTE]
>
> **前置知识**
>
> 第 4 章依赖注入（便于对比）。了解 HTTP 请求/响应模型。

#### 5.1 中间件是什么

中间件是一个「包裹」在路由处理函数**外层**的函数：请求进入时先经过中间件，再进入路由；响应返回时也先经过中间件。它适合处理**全局性、横切**的逻辑。

> [!NOTE]
>
> **概念关联**
>
> **与依赖注入的区别：**依赖注入作用于**特定路由**（显式声明才生效），是「按需」的；中间件作用于**所有请求**，是「全局」的。粒度不同：全局日志、计时、CORS 适合中间件；按路由复用逻辑放依赖注入；把 `HTTPException` 或 `RequestValidationError` 映射成统一响应，用异常处理器而不是中间件硬编码。

#### 5.2 基本写法

**main.py**

```python
import time
from fastapi import FastAPI, Request

app = FastAPI()


@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.perf_counter()
    # call_next 把请求传给下一个中间件或最终的路由处理函数
    response = await call_next(request)
    process_time = time.perf_counter() - start
    # 给响应加一个自定义头
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.get("/")
def read_root():
    return {"message": "Hello"}
```

现在每次请求的响应头里都会带 `X-Process-Time`，表示处理耗时。要点：

- 中间件必须是 `async` 函数；
- `call_next(request)` 是分界线：之前是「请求前」逻辑，之后是「响应后」逻辑；
- 必须把 `call_next` 的返回值（response）最终 `return` 出去。

> [!WARNING]
>
> **顺序与性能**
>
> 中间件按**注册顺序**依次执行（后注册的在更外层）。中间件里若放了阻塞操作（如同步的数据库查询），会拖慢**所有**请求，所以要特别小心——性能敏感的逻辑别放这里。中间件无法直接访问路由的依赖（如当前用户），这是它和依赖注入的又一区别。

#### 5.3 常见中间件：CORS 跨域

前端页面（如 `localhost:3000`）调用 API（`localhost:8000`）会触发浏览器跨域限制。用内置的 CORS 中间件解决：

**main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 允许的来源
    allow_credentials=True,
    allow_methods=["*"],                      # 允许的 HTTP 方法
    allow_headers=["*"],                      # 允许的请求头
)
```

FastAPI 还内置了 `GZipMiddleware`（压缩响应）、`TrustedHostMiddleware`（限制 Host 头）等，可在官方文档按需取用。

#### 5.4 用 request_id 串联日志与错误

线上排查最怕“知道 500 了，但不知道是哪一次请求”。给每个请求生成唯一 ID，写入响应头和日志，就能把用户反馈、网关日志和应用日志串起来：

**main.py**

```python
import logging
import uuid
from fastapi import FastAPI, Request

app = FastAPI()
logger = logging.getLogger("app")


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = uuid.uuid4().hex[:12]
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "%s %s status=%s request_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        request_id,
    )
    return response
```

- 把 `request_id` 放在 `request.state` 中，异常处理器可以读取；
- 响应头返回 `X-Request-ID`，前端报错时可一并提交；
- 高并发下不要用模块级全局变量保存请求 ID，应该使用请求状态或 `ContextVar`；
- 读取请求体前要谨慎：ASGI 的 receive 通道是一次性的，中间件消费 body 后，路由可能读不到。

#### 5.5 统一异常响应的位置

请求校验失败默认返回 422，且 `detail` 是数组；业务异常可能返回字符串。前端如果不想写三套解析逻辑，可以在应用层统一错误结构：

```python
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request,
    exc: RequestValidationError,
):
    return JSONResponse(
        status_code=422,
        content={
            "code": "VALIDATION_ERROR",
            "message": "请求参数校验失败",
            "request_id": getattr(request.state, "request_id", ""),
            "errors": [
                {
                    "location": error["loc"][0],
                    "field": ".".join(str(part) for part in error["loc"][1:]),
                    "reason": error["msg"],
                    "type": error["type"],
                }
                for error in exc.errors()
            ],
        },
    )
```

> [!WARNING]
>
> **中间件顺序不是背出来的**
>
> `add_middleware()` 后注册的会先进入、最后退出，整体形式类似洋葱。不要照抄固定顺序：能提前短路请求的限流或认证通常靠近外层；CORS 的位置还要考虑 500 响应是否需要带跨域头；代理层已经压缩时，应用内不要再重复 GZip。最终顺序应结合真实请求验证。

> [!CAUTION]
>
> **不要在全局中间件里做数据库查询**
>
> 中间件服务于全部请求，包括静态文件、健康检查和错误请求。把数据库查询、复杂权限和业务判断放进去，会把无关请求也拖慢，并让错误边界变复杂。中间件保持轻，业务判断放依赖或 service。

#### 5.6 动手练习

**练习 1 · 请求计时中间件 ★ 简单**

复现 5.2 的计时中间件，用 curl 的 `-i` 参数查看响应头里的 `X-Process-Time`。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**`curl -i http://127.0.0.1:8000/`，响应头中出现 `X-Process-Time: 0.0003` 之类的值。

**练习 2 · 日志中间件 ★ ★ 中等**

写一个中间件，在每次请求时打印 `方法 + 路径`，如 `GET /items`。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**访问任意路由，终端打印对应的方法和路径。

**练习 3 · 对比依赖注入 ★ ★ ★ 较难**

分别用「中间件」和「依赖注入」实现同一个功能（比如记录请求路径），体会两者在作用范围上的差异。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**中间件对所有路由生效；依赖注入只有显式声明 `Depends` 的路由才生效。

> [!TIP]
>
> **最佳实践**
>
> 中间件要「轻」。把重逻辑（复杂校验、数据库访问）放依赖注入，中间件只做横切关注点：日志、计时、CORS、全局异常兜底。中间件里务必用 `async` 且避免阻塞调用，否则会拖垮并发性能。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**请求 ID、异常响应、日志与 CORS 边界参考自“FastAPI 入门到实战”系列第 10 篇；本页示例为本教程独立简化版本。

> 原始页面：[02-intermediate/05-middleware.html](./02-intermediate/05-middleware.html)

---

### 第 6 章 · 后台任务（Background Tasks）

*难度：进阶 前置：第 4 章 预计：40 分钟 28 法则主干*

> [!TIP]
>
> **学习目标**
>
> - 理解后台任务解决的问题：让「响应后」的耗时操作不阻塞用户；
> - 掌握 `BackgroundTasks` 的用法；
> - 区分「后台任务」与「异步」的区别（易混淆点）；
> - 了解后台任务在生产环境中的局限与替代方案（Celery 等）。

> [!NOTE]
>
> **前置知识**
>
> 第 4 章依赖注入。了解基本函数调用。

#### 6.1 为什么要后台任务

假设用户注册后要「发送欢迎邮件」。如果同步发邮件，用户可能要等好几秒才能收到响应，体验很差。后台任务让响应**先返回**，邮件发送**稍后执行**。

> [!NOTE]
>
> **后台任务 ≠ 异步**
>
> 这是最常见的混淆点。**异步**（第 7 章）解决的是「并发等待 I/O」，请求仍在处理中；**后台任务**是把任务**推迟到响应返回之后**再执行。两者解决不同层面的问题，可以配合使用。

#### 6.2 基本用法

**main.py**

```python
from fastapi import FastAPI, BackgroundTasks

app = FastAPI()


def send_welcome_email(email: str, message: str = ""):
    # 模拟耗时操作（实际中这里是发邮件、写日志等）
    print(f"正在给 {email} 发送欢迎邮件... {message}")


@app.post("/users/")
def create_user(email: str, background_tasks: BackgroundTasks):
    # 把任务加入后台队列，响应返回后再执行
    background_tasks.add_task(send_welcome_email, email, message="欢迎注册！")
    return {"message": "用户已创建，欢迎邮件稍后发送"}
```

流程：请求进来 → 路由把 `send_welcome_email` 加入队列 → **立即返回响应** → 服务器在响应发送后执行 `send_welcome_email`。

#### 6.3 最重要的坑：不要带请求作用域资源

后台任务是“响应之后”执行，而数据库会话、`Request`、ORM 对象和 `ContextVar` 都属于“请求期间”。把它们传给后台任务，看起来能跑，实际上生命周期已经失控：

> [!CAUTION]
>
> **不要这样写**
>
> ``` python
> background_tasks.add_task(
>     send_email_and_log,
>     db,
>     user,
> )
> ```
>
> 请求结束后会话会被关闭、ORM 对象可能 detached，连接还会被后台任务拖住。

> [!TIP]
>
> **推荐写法**
>
> ``` python
> background_tasks.add_task(
>     send_email_and_log,
>     user.id,
> )
> ```
>
> 任务内部通过 `SessionLocal()` 查询需要的数据，自己负责关闭。

**tasks.py**

```python
from database import SessionLocal
import models


def send_email_and_log(user_id: int) -> None:
    db = SessionLocal()
    try:
        user = db.get(models.UserDB, user_id)
        if user is None:
            return
        send_welcome_email(user.email)
    finally:
        db.close()
```

> [!CAUTION]
>
> **ContextVar 也有同样的生命周期问题**
>
> 如果第 5 章用 `ContextVar` 保存 `request_id`，中间件可能在后台任务之前就已经 reset。正确做法是在路由函数中读取值，把字符串作为参数传给任务；任务内部需要时再自行 `set()` 和 `reset()`。

#### 6.4 注意事项与适用边界

- **执行时机**：后台任务在**响应发送后**执行，但**仍与请求在同一进程**；
- **不保证可靠**：如果服务器在任务执行前崩溃，任务会丢失；
- **阻塞影响**：同步的后台任务仍会占用工作进程，大量重任务需要独立队列；
- **无法返回结果**：后台任务不向客户端返回任何东西。

> [!WARNING]
>
> **何时不该用 BackgroundTasks**
>
> 需要**持久化、重试、定时、分布式**的任务（如每天凌晨跑报表、批量发百万邮件），应该用真正的任务队列，如 **Celery + Redis**、**RQ** 或 **Dramatiq**。`BackgroundTasks` 只适合「轻量、一次性、不关心可靠性」的场景。实战项目阶段三会再讨论这个取舍。

#### 6.5 从 BackgroundTasks 升级到任务队列

是否需要消息队列，可以用三个问题判断：任务丢了会造成什么损失？失败后是否必须自动重试？是否需要查询进度或在 API 进程重启后继续执行？

| 场景                               | BackgroundTasks | 任务队列         |
|------------------------------------|-----------------|------------------|
| 欢迎邮件、缓存刷新、轻量通知       | 适合            | 可用但可能偏重   |
| 支付回调、审计日志、第三方数据同步 | 不适合          | 必须使用         |
| 失败可人工补、无需进度             | 适合            | 按可靠性要求选择 |
| 需要重试、状态、独立扩容           | 不适合          | 适合             |

```python
# FastAPI 进程：只发布任务并立即返回
from celery.result import AsyncResult
from tasks.celery_app import celery_app
from tasks.reports import generate_report


@app.post("/reports")
def create_report():
    task = generate_report.delay(user_id=1)
    return {"task_id": task.id, "status": "queued"}


@app.get("/tasks/{task_id}")
def task_status(task_id: str):
    result = AsyncResult(task_id, app=celery_app)
    return {"task_id": task_id, "status": result.status}
```

真正的后台任务执行在独立 Celery worker 中。Broker 传消息，worker 执行任务，backend 保存状态。FastAPI 进程重启不影响队列里的任务，但两者仍共享数据库、Redis、CPU 和网络资源。

> [!NOTE]
>
> **概念关联**
>
> **概念关联：**后台任务常与数据库、邮件、日志等服务配合。实战项目阶段三会在「下单」接口里用后台任务发送通知邮件，让你看到它在真实业务里的落地。

#### 6.6 动手练习

**练习 1 · 基础后台任务 ★ 简单**

复现 6.2 的例子，观察终端里打印「发送邮件」的时机是否晚于响应返回。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**POST 后立即收到响应，随后终端才打印邮件发送日志。

**练习 2 · 多任务排队 ★ ★ 中等**

在同一个路由里 `add_task` 三个不同的后台任务，观察它们的执行顺序。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**三个任务按 `add_task` 的先后顺序依次执行。

**练习 3 · 对比同步耗时 ★ ★ ★ 较难**

分别用「同步等待 sleep 2 秒」和「后台任务 sleep 2 秒」实现同一个接口，对比响应耗时。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**同步方式响应约 2 秒；后台任务方式响应毫秒级返回，sleep 在后台执行。

> [!TIP]
>
> **最佳实践**
>
> 后台任务函数要**幂等**、**独立**（不依赖请求上下文）。任务失败要自己处理异常，因为调用方已经收到响应、无法感知失败。任务较重时，果断切换到 Celery 等成熟队列。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**本页的请求作用域陷阱、任务可靠性边界与队列选型参考自“FastAPI 入门到实战”系列第 13、14 篇；Celery 示例只保留主干概念，具体部署需结合项目规模。

> 原始页面：[02-intermediate/06-background.html](./02-intermediate/06-background.html)

## 6. 高级篇：完整章节与示例

> [!WARNING]
> 异步、数据库、认证和部署不是零散技巧。它们必须与请求契约、依赖注入和事务边界一起理解。

---

### 第 7 章 · 异步编程 async/await

*难度：高级 前置：第 1–6 章 预计：60 分钟 28 法则主干*

> [!TIP]
>
> **学习目标**
>
> - 理解同步阻塞 vs 异步并发的本质区别；
> - 掌握事件循环、`async def`、`await` 的基本概念；
> - 知道何时该用 `async def` 路由、何时不该用（关键！）；
> - 理解 FastAPI 如何调度异步与同步路由；
> - 会复用异步 HTTP 客户端、设置超时，并用压测数据判断优化是否有效。

> [!NOTE]
>
> **前置知识**
>
> 前 6 章。对「阻塞 I/O」有基本体感即可。

#### 7.1 为什么要异步

Web 服务的瓶颈往往不是 CPU，而是 **I/O 等待**：读数据库、调第三方 API、读写文件，都要等。同步模式下，进程在等待时**什么也做不了**；异步模式则能在等待时**切换到别的任务**，大幅提升并发吞吐。

> [!NOTE]
>
> **事件循环（Event Loop）**
>
> 异步编程的核心是一个「事件循环」：它维护一批任务，遇到 `await` 挂起当前任务、去执行别的任务，等被挂起的 I/O 完成后再回来继续。这一切在**单线程**里完成，靠「协作式切换」而非多线程抢占。

#### 7.2 基本语法

**main.py**

```python
import asyncio


async def fetch_data():
    # 模拟异步 I/O（如数据库查询、HTTP 请求）
    await asyncio.sleep(1)
    return "数据"


@app.get("/data/")
async def read_data():
    result = await fetch_data()   # 挂起，让出控制权
    return {"result": result}
```

- `async def`：声明一个**协程函数**；
- `await`：挂起当前协程，等待一个可等待对象（awaitable）完成；
- 只有**真正异步的库**（如 `httpx.AsyncClient`、`asyncpg`、`aiosqlite`）才能从 `await` 中获益。

#### 7.3 关键：async 路由与阻塞的陷阱

这是 FastAPI 异步编程**最容易踩的坑**。看下面两个对比：

```python
import time

@app.get("/slow/")
async def slow_endpoint():
    time.sleep(5)   # ❌ 阻塞！整个事件循环被卡住 5 秒
    return {"done": True}
```

`time.sleep` 是**同步阻塞**的，即使函数是 `async def`，它也会卡住整个事件循环，期间**所有请求都无法处理**。

```python
import asyncio

@app.get("/slow/")
async def slow_endpoint():
    await asyncio.sleep(5)  # ✅ 异步等待，让出控制权
    return {"done": True}
```

> [!WARNING]
>
> **黄金法则**
>
> 如果路由里**只有同步阻塞代码**（如普通 `requests`、同步 `sqlalchemy`、CPU 密集计算），就**别用 `async def`**，用普通 `def`。FastAPI 会把同步路由放到**线程池**里执行，反而能避免阻塞事件循环。反过来，用了异步库（`httpx.AsyncClient` 等）才用 `async def`。

| 场景                     | 推荐写法                    |
|--------------------------|-----------------------------|
| 纯 CPU 计算 / 同步库调用 | `def`（进线程池）           |
| 异步 I/O（async 库）     | `async def`                 |
| async 里混入少量阻塞     | 用 `run_in_threadpool` 包裹 |

#### 7.4 异步 HTTP 客户端：复用、超时、关闭

正确使用异步库只是第一步。生产接口还必须处理连接复用和超时，否则下游服务变慢时，请求会持续堆积并耗尽资源：

**main.py**

```python
from contextlib import asynccontextmanager
from typing import Annotated

import httpx
from fastapi import Depends, FastAPI, Request


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(
        timeout=httpx.Timeout(connect=2.0, read=5.0, write=5.0, pool=1.0),
        limits=httpx.Limits(max_connections=100),
    )
    yield
    await app.state.http.aclose()


app = FastAPI(lifespan=lifespan)


def get_http(request: Request) -> httpx.AsyncClient:
    return request.app.state.http


HTTP = Annotated[httpx.AsyncClient, Depends(get_http)]


@app.get("/proxy")
async def proxy(client: HTTP):
    resp = await client.get("https://api.example.com/data")
    return resp.json()
```

不要在每个请求里新建 `AsyncClient`，否则连接池无法复用，每次都要重新建连。客户端应放入 `lifespan` 管理，应用关闭时统一 `aclose()`。

> [!WARNING]
>
> **没有超时的外部调用是生产事故来源**
>
> 只设置重试而不设置超时，会让最坏等待时间成倍放大。例如 3 次重试 × 每次 5 秒，最坏可能等待 15 秒。应该同时设置单次超时和整个操作的总预算；只对幂等请求和可恢复错误（5xx、429、连接错误）做有限重试，并使用指数退避与抖动。

#### 7.5 先测量，再优化

`async def` 不是性能开关。它只改变等待 I/O 时的调度方式；CPU 密集计算、同步数据库驱动和 CPU 热循环仍会占用事件循环。优化顺序应当是：**先测出瓶颈，再改代码或部署**。

```bash
# 观察吞吐、延迟分位数和错误率
hey -n 2000 -c 50 http://127.0.0.1:8000/api/v1/todos

# 或使用 wrk
wrk -t4 -c50 -d30s http://127.0.0.1:8000/api/v1/todos
```

重点看 P95/P99、错误率和数据库连接数，不要只看单次平均响应。常见瓶颈依次是：同步阻塞调用、N+1 查询、数据库连接池耗尽、外部服务超时、序列化大响应、worker 数量与连接预算不匹配。

| 症状 | 优先怀疑 | 处理方向 |
|----|----|----|
| async 接口 QPS 很低 | 事件循环里混入同步阻塞 | 改异步库、普通 `def` 或 `run_in_threadpool` |
| P99 远高于 P50 | 连接池耗尽、下游抖动 | 超时、连接池、缓存、重试退避 |
| 10 条记录出现 11 条 SQL | N+1 查询 | 预加载关系或改为聚合查询 |
| 多 worker 部署后数据不稳定 | 用进程内存保存共享状态 | 改用 Redis、数据库或粘性会话 |

> [!TIP]
>
> **CPU 密集任务不要塞进 async 路由**
>
> 图片处理、批量加密、复杂计算会持续占用事件循环。应根据任务粒度选择线程池、进程池、任务队列或独立服务。能短暂释放 GIL 的库可尝试线程池，CPU 计算通常需要进程级并行。

> [!NOTE]
>
> **概念关联**
>
> **概念关联：**异步是贯穿后面所有章节的「性能底座」。第 8 章的异步数据库驱动（`asyncpg`/`aiosqlite`）、第 10 章的 WebSocket（天然异步）都建立在本章的事件循环之上。

#### 7.6 动手练习

**练习 1 · 观察阻塞 ★ ★ 中等**

写两个路由：一个 `async def` 里用 `time.sleep(5)`，另一个普通 `def` 快速返回。先访问慢路由，再立刻访问快路由。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**慢路由的 `time.sleep` 会阻塞事件循环，导致快路由也要等 5 秒才响应——这正是「async 里放阻塞代码」的危害。

**练习 2 · 正确异步等待 ★ ★ 中等**

把练习 1 的 `time.sleep(5)` 改成 `await asyncio.sleep(5)`，重复测试。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**快路由这次**立即**返回，不再被慢路由阻塞。

**练习 3 · 并发请求 ★ ★ ★ 较难**

用 `asyncio.gather` 并发调用 3 个异步函数，对比顺序执行的总耗时。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**并发总耗时 ≈ 单个任务耗时，而非三倍。

> [!TIP]
>
> **最佳实践**
>
> 先判断「这个 I/O 是异步库吗？」——是，用 `async def` + `await`；不是，用普通 `def`。不要在 `async def` 里混入 `time.sleep`、同步 `requests`、CPU 密集循环。这是把高性能 FastAPI 写慢的第一大原因。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**异步、性能测量、外部调用超时和部署层优化参考自“FastAPI 入门到实战”系列第 1、12 篇；本页聚焦最快能落地的性能主干。

> 原始页面：[03-advanced/07-async.html](./03-advanced/07-async.html)

---

### 第 8 章 · 数据库集成（SQLAlchemy）

*难度：高级 前置：第 3、4、7 章 预计：75 分钟 28 法则主干*

> [!TIP]
>
> **学习目标**
>
> - 理解 ORM 与「模型分层」：数据库模型 vs Pydantic Schema；
> - 掌握 SQLAlchemy 2.0 的 `Mapped` / `mapped_column` 建模；
> - 学会用 `get_db` 依赖实现「每请求一个会话」；
> - 理解事务边界、归属查询与 N+1 问题；
> - 了解 Alembic 数据库迁移和同步/异步方案的选择。

> [!NOTE]
>
> **前置知识**
>
> 第 3 章 Pydantic、第 4 章依赖注入、第 7 章异步。了解关系型数据库基本概念。

> [!TIP]
>
> **用 uv 安装数据库依赖**
>
> 同步方案运行 `uv add sqlalchemy alembic`；异步方案还需要 `uv add aiosqlite`（SQLite）或 `uv add asyncpg`（PostgreSQL）。直接依赖写入 `pyproject.toml`，完整版本解析由 `uv.lock` 锁定。

#### 8.1 三层模型分离（核心思想）

生产级项目必须区分三层模型，不要混用：

| 模型 | 作用 | 例子 |
|----|----|----|
| **ORM 模型**（SQLAlchemy） | 映射数据库表，负责持久化 | `UserDB`（含密码哈希） |
| **Pydantic 请求模型** | 校验客户端输入 | `UserCreate`（接收注册信息） |
| **Pydantic 响应模型** | 塑造返回给客户端的数据 | `UserOut`（不含密码） |

关键：**绝不要把 ORM 对象直接返回给客户端**，也不要让客户端直接写入 ORM 对象。通过 Schema 隔离，才能避免密码等敏感字段泄露。

#### 8.2 定义 ORM 模型与连接

**database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # 仅 SQLite 需要
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
```

**models.py**

```python
from datetime import datetime
from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class UserDB(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
```

`Mapped[str]` 对应非空列，`Mapped[str | None]` 对应可空列；主键类型可以从注解推断。`default` 是 Python 层默认值，`server_default` 是数据库层默认值，二者语义不同。

#### 8.3 用依赖注入管理会话

把第 4 章的 `yield` 依赖和第 8 章的会话管理结合起来——这是 FastAPI 数据库集成的标准范式：

**deps.py**

```python
from database import SessionLocal


def get_db():
    db = SessionLocal()
    try:
        yield db          # 注入会话
    except Exception:
        db.rollback()     # 业务异常时回滚
        raise
    finally:
        db.close()        # 无论如何都关闭
```

**main.py**

```python
from typing import Annotated
from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from deps import get_db
from database import engine

models.Base.metadata.create_all(bind=engine)  # 建表（开发用）

app = FastAPI()
DB = Annotated[Session, Depends(get_db)]


class UserCreate(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    model_config = {"from_attributes": True}  # 允许从 ORM 对象读取


@app.post("/users/", response_model=UserOut)
def create_user(user: UserCreate, db: DB):
    fake_hashed = "hashed_" + user.password
    db_user = models.UserDB(email=user.email, hashed_password=fake_hashed)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user   # 由 response_model 序列化，密码不会泄露
```

要点：

- `get_db` 依赖为**每个请求**创建独立会话，请求结束自动关闭；
- `response_model=UserOut` 保证即使 `db_user` 里有密码，也不会返回给客户端；
- `model_config = {"from_attributes": True}` 让 Pydantic 能从 ORM 对象（而非 dict）读取字段。
- `fake_hashed` 只是为了演示字段隔离，真实项目必须使用 Argon2/bcrypt 等密码哈希，绝不能拼接字符串。

> [!WARNING]
>
> **常见坑**
>
> 忘记 `db.close()` 会导致连接泄漏；`create_all` 只适合开发，生产要用 Alembic 迁移；`check_same_thread` 是 SQLite 在多线程下的必要配置，漏了会报错。

#### 8.4 事务边界与数据归属

数据库章节真正的主干不是“会写 INSERT”，而是知道**谁决定提交、一次失败回滚哪些操作、查询是否带权限条件**。

```python
def create_order(db: Session, *, user_id: int, payload: OrderCreate):
    try:
        order = Order(user_id=user_id, **payload.model_dump())
        db.add(order)
        db.flush()

        for item in payload.items:
            db.add(OrderItem(order_id=order.id, **item.model_dump()))

        db.commit()
        db.refresh(order)
        return order
    except Exception:
        db.rollback()
        raise
```

简单单表 CRUD 可以让路由或 service 直接提交；涉及多张表时必须把多个写操作放在同一个用例中。不要让每个 repository 函数都偷偷 `commit()`，否则一次业务操作被拆成多个不可回滚的独立事务。

> [!CAUTION]
>
> **IDOR：只做登录鉴权是不够的**
>
> 下面这种写法只要登录就能读任何人的数据：`select(Todo).where(Todo.id == todo_id)`。资源归属必须写进 WHERE：`where(Todo.id == todo_id, Todo.owner_id == current_user.id)`。查询不到返回 404，不泄露资源是否存在。

#### 8.5 N+1、关联加载与同步/异步选择

ORM 最常见的性能陷阱是循环访问关联对象：先查 100 个用户，再对每个用户访问 `user.todos`，可能产生 1 + 100 条 SQL。使用预加载可以解决：

```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload

stmt = select(User).options(selectinload(User.todos))
users = list(db.scalars(stmt).unique())
```

| 场景 | 建议 |
|----|----|
| 普通 CRUD、并发不高、现有生态是同步库 | 同步 SQLAlchemy + 普通 `def` 路由；FastAPI 会放到线程池 |
| 高并发 I/O、接口内并发调用多个外部服务、大量长连接 | `AsyncSession` + 异步驱动 + `async def`，全链路保持一致 |
| 在 async 路由里调用同步 ORM | 错误组合：会阻塞事件循环；改用同步 `def` 或完整异步栈 |

> [!TIP]
>
> **SQLAlchemy 2.0 查询优先用 select()**
>
> `select(Todo).where(...)` 比旧的 `db.query(Todo)` 更适合组合查询，也是异步版本的主要写法。查询条件应使用表达式参数绑定，不要手拼 SQL 字符串。

> [!NOTE]
>
> **概念关联**
>
> **概念关联：**本章是「依赖注入（第 4 章）+ Pydantic（第 3 章）+ 异步（第 7 章）」的集大成。实战项目阶段二会把这一整套落地成多模块结构；第 9 章认证会在此基础上给 `UserDB` 加密码哈希。

#### 8.6 动手练习

**练习 1 · 建表与写入 ★ ★ 中等**

搭建 SQLite + SQLAlchemy，定义 `ProductDB` 表，写一个 `POST /products/` 存入数据库。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**POST 后用 SQLite 工具查 `products` 表，能看到记录；重复 POST 相同内容应生成多条记录。

**练习 2 · 查询接口 ★ ★ 中等**

加一个 `GET /products/`，用 `select(ProductDB)` 返回所有商品，并用 `response_model` 过滤字段。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**返回的商品列表只包含 Schema 定义的字段，不含额外字段。

**练习 3 · 防止密码泄露 ★ ★ ★ 较难**

给 `UserDB` 加 `hashed_password` 字段，故意用不含密码的 `UserOut` 作为 `response_model`，验证响应里没有密码。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**响应 JSON 里**没有** `hashed_password` 字段，但数据库里确实存了。

> [!TIP]
>
> **最佳实践**
>
> 永远通过 `response_model` 控制输出；会话生命周期交给 `get_db` 依赖；生产环境用 Alembic 管理表结构变更。ORM 层只做数据，业务逻辑放服务层，路由保持薄。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**SQLAlchemy 2.0、事务边界、分页、预加载与同步/异步选型参考自“FastAPI 入门到实战”系列第 8 篇；示例按本教程的商品/用户模型做了简化。

> 原始页面：[03-advanced/08-database.html](./03-advanced/08-database.html)

---

### 第 9 章 · 身份认证与授权

*难度：高级 前置：第 4、8 章 预计：75 分钟 28 法则主干*

> [!TIP]
>
> **学习目标**
>
> - 区分「认证（Authentication）」与「授权（Authorization）」；
> - 掌握 OAuth2 密码流与 JWT 的基本原理与实现；
> - 学会用 `pwdlib` + Argon2 安全地哈希存储密码；
> - 用依赖注入实现 `get_current_user` 保护路由；
> - 理解 access/refresh token、401 与 403、资源归属隔离和 token 吊销。

> [!NOTE]
>
> **前置知识**
>
> 第 4 章依赖注入、第 8 章数据库。了解 HTTP 头、Base64 编码。

> [!TIP]
>
> **用 uv 安装认证依赖**
>
> 在项目目录运行 `uv add "pwdlib[argon2]" PyJWT python-multipart`：前两项分别处理密码哈希和 JWT，`python-multipart` 用于解析 OAuth2 登录表单。已有项目若使用 `passlib` / `python-jose` 可以继续维护，但不要和这套依赖混用。

#### 9.1 认证 vs 授权

- **认证（Authentication）**：确认「你是谁」——登录、验证密码、签发令牌；
- **授权（Authorization）**：确认「你能做什么」——某个用户能否访问某个资源。

两者常被混为一谈，但流程上通常是：先认证拿到身份，再基于身份做授权判断。

#### 9.2 密码哈希（绝不存明文）

**security.py**

```python
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()  # 当前默认 Argon2


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return password_hash.verify(plain, hashed)
```

数据库里永远只存 `hash_password()` 的结果，登录时用 `verify_password()` 比对。密码哈希必须使用专门设计的慢哈希（Argon2、scrypt、bcrypt、PBKDF2），不能使用 MD5、SHA1 或普通 SHA256。随机 salt 由密码库负责生成和保存，不要自己实现。

#### 9.3 JWT 令牌

JWT（JSON Web Token）是一种无状态令牌：服务器签发后，客户端携带它，服务器通过签名验证真伪，无需存 session。

**security.py**

```python
from datetime import UTC, datetime, timedelta
import jwt
from config import settings

SECRET_KEY = settings.secret_key  # 必须来自环境变量或密钥管理服务
ALGORITHM = "HS256"
EXPIRE_MINUTES = 30


def create_access_token(user_id: int) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        options={"require": ["sub", "iat", "exp", "type"]},
    )
```

- `sub` 放用户标识，JWT 规范要求它是字符串；
- `iat` / `exp` 用 UTC 时间，避免服务器时区导致过期时间偏差；
- `type` 区分 access 与 refresh，防止长有效期 refresh token 直接访问业务接口；
- 必须显式指定 `algorithms=[ALGORITHM]`，不要让 token 自己决定校验算法。

> [!CAUTION]
>
> **安全红线**
>
> `SECRET_KEY` 绝不能硬编码在代码里提交到仓库——要用环境变量或密钥管理服务。JWT 过期时间要设短，敏感操作要二次校验。**JWT 的 Payload 只是 Base64 编码，不是加密**，任何人都能读取，所以不要放密码、身份证号、银行卡等敏感信息。

#### 9.4 用依赖注入保护路由

**main.py**

```python
from typing import Annotated
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from deps import get_db
from models import UserDB

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
DB = Annotated[Session, Depends(get_db)]


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DB,
):
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
    except jwt.InvalidTokenError:
        raise unauthorized

    if payload.get("type") != "access":
        raise unauthorized

    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise unauthorized

    user = db.get(UserDB, user_id)
    if user is None:
        raise unauthorized
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用")
    return user


CurrentUser = Annotated[UserDB, Depends(get_current_user)]


@app.get("/users/me")
def read_me(current_user: CurrentUser):
    return current_user
```

现在任何带 `CurrentUser` 的路由，都会自动要求合法令牌。认证失败在依赖解析阶段就返回，业务函数不会执行。每次请求回查用户，可以让“禁用账号”和“删除账号”比 JWT 过期更早生效。

> [!NOTE]
>
> **登录接口必须是表单编码**
>
> `OAuth2PasswordRequestForm` 读取 `application/x-www-form-urlencoded`，不是 JSON。Swagger 的 Authorize 会自动处理；前端应使用 `URLSearchParams` 或等价表单编码，否则会收到 422。

> [!NOTE]
>
> **OAuth2 密码流**
>
> FastAPI 的 `OAuth2PasswordBearer` 实现了「密码流」（Resource Owner Password Credentials）。它让 `/docs` 里的「Authorize」按钮可用：填入用户名密码换取 token，再带着 token 调接口。这是入门理解 OAuth2 的最佳切入口。

#### 9.5 授权：角色、资源归属与字段可见性

```python
def require_superuser(current_user: CurrentUser):
    if not current_user.is_superuser:
        raise HTTPException(403, "需要管理员权限")
    return current_user


CurrentSuperuser = Annotated[UserDB, Depends(require_superuser)]


@app.delete(
    "/admin/users/{user_id}",
    dependencies=[Depends(require_superuser)],
)
def delete_user(user_id: int):
    # 认证失败 401；已登录但不是管理员 403
    return {"deleted": user_id}
```

接口级角色权限只能控制“能不能调用这个接口”，不能控制“能不能读取这一行数据”。资源归属必须进入查询条件：

```python
from sqlalchemy import select


@app.get("/todos/{todo_id}")
def get_todo(todo_id: int, db: DB, current_user: CurrentUser):
    stmt = select(Todo).where(
        Todo.id == todo_id,
        Todo.owner_id == current_user.id,  # 归属条件写进 WHERE
    )
    todo = db.scalars(stmt).first()
    if todo is None:
        raise HTTPException(404, "Todo not found")
    return todo
```

> [!CAUTION]
>
> **401 与 403 不要混用**
>
> 401 表示“未认证或凭据无效”，应带 `WWW-Authenticate: Bearer`；403 表示“身份已确认，但没有权限”。不要把普通用户访问管理员接口返回成 401，否则前端会误以为重新登录就能解决。

#### 9.6 Access Token、Refresh Token 与吊销

单一长有效期 token 很危险：泄露后攻击者可以长期使用。常见方案是短期 access token + 长期 refresh token：

| Token         | 有效期     | 用途                  | 校验重点            |
|---------------|------------|-----------------------|---------------------|
| access token  | 15–60 分钟 | 访问业务接口          | `type == "access"`  |
| refresh token | 7–30 天    | 换取新的 access token | `type == "refresh"` |

JWT 默认无法撤销。账号被禁用、用户改密码或退出登录后，旧 token 可能在过期前继续有效。实际项目通常组合使用：

- **短 access token**：把最大风险窗口缩到分钟级；
- **用户版本号**：用户表增加 `token_version`，改密码或强制下线时递增，校验 token 中的版本是否一致；
- **Redis 黑名单**：登出时把 token 哈希写入 Redis，TTL 只保留到 token 过期；代价是每个请求多一次 Redis 查询；
- **refresh token 轮换**：每次刷新换发新 token，并用 `jti` 保存/撤销状态，避免旧 refresh token 无限续期。

> [!TIP]
>
> **不要往 JWT 里塞满用户资料**
>
> 邮箱、用户名、管理员标记等会变化的数据不要长期冻结在 token 里。推荐只放 `sub`、`exp`、`type`、版本号等最小声明，每次请求从数据库或缓存读取最新用户状态。

#### 9.7 常见错误与安全边界

- **弱密钥/泄露密钥**：使用 `secrets.token_urlsafe(32)` 生成，泄露后立即轮换；
- **算法混淆**：显式固定 `algorithms=["HS256"]`；
- **敏感信息进日志**：密码、access token、refresh token 必须脱敏；
- **登录爆破**：对 IP + 账号做限流，连续失败锁定，错误信息统一为“用户名或密码错误”；
- **缓存认证响应**：带认证的响应应设置 `Cache-Control: no-store`，避免代理或浏览器缓存其他用户数据。

```python
# 旧项目可能仍在用：
from passlib.context import CryptContext
from jose import jwt

# 新项目更推荐：
from pwdlib import PasswordHash
import jwt

# 迁移时不要只替换 import：
# 1. 核对 JWT 异常类型（JWTError vs InvalidTokenError）
# 2. 核对 bcrypt 版本兼容性
# 3. 保留旧哈希可验证能力，再逐步重哈希
# 4. 补登录、过期、篡改、禁用账号的回归测试
```

> [!NOTE]
>
> **概念关联**
>
> **概念关联：**本章 = 依赖注入（第 4 章）+ 数据库（第 8 章）的合体。`get_current_user` 内部会查数据库拿用户，再用依赖注入保护路由。实战项目阶段三会完整落地「注册 → 登录 → 受保护接口」的闭环。

#### 9.8 动手练习

**练习 1 · 密码哈希 ★ 简单**

用 `hash_password` / `verify_password` 分别验证「正确密码通过、错误密码拒绝」。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**打印 `verify_password("123", hash_password("123"))` 为 `True`，错误密码为 `False`。

**练习 2 · 签发与验证 JWT ★ ★ 中等**

签发一个带 `sub` 和 `exp` 的 token，再解码验证；篡改一个字符后验证是否失败。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**合法 token 解码成功；篡改后的 token 抛异常（签名不匹配）。

**练习 3 · 保护路由 ★ ★ ★ 较难**

实现完整流程：`/token` 登录换取 token，`/users/me` 带 token 访问，不带则 401。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**不带 token 访问 `/users/me` 返回 401；带正确 token 返回用户信息。

> [!TIP]
>
> **最佳实践**
>
> 密码必哈希存储；`SECRET_KEY` 走环境变量；JWT 短过期 + 可选刷新令牌；用依赖注入统一鉴权而非在每个路由里写判断；敏感操作（改密码、删账号）单独二次验证。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**密码哈希、JWT 声明校验、refresh token、吊销方案、角色与数据级授权参考自“FastAPI 入门到实战”系列第 11 篇；本页已把旧版 `passlib`/`python-jose` 示例迁移为当前更推荐的 `pwdlib`/PyJWT 写法。

> 原始页面：[03-advanced/09-auth.html](./03-advanced/09-auth.html)

---

### 第 10 章 · WebSocket 与部署

*难度：高级 前置：第 7 章 预计：60 分钟 按需扩展*

> [!TIP]
>
> **学习目标**
>
> - 理解 WebSocket 与 HTTP 的区别及适用场景；
> - 掌握 FastAPI 的 `WebSocket` 端点和消息收发；
> - 了解用 `ConnectionManager` 管理多连接与广播；
> - 掌握生产部署：Uvicorn / Gunicorn / Docker / 反向代理。

> [!NOTE]
>
> **前置知识**
>
> 第 7 章异步编程。了解 HTTP 请求/响应模型。

#### 10.1 WebSocket 是什么

HTTP 是「一问一答」的无状态协议，客户端不请求、服务器就无法主动推送。WebSocket 则在客户端和服务器之间建立**持久、双向**的长连接，双方可随时互发消息，适合聊天、实时通知、协作编辑等场景。

#### 10.2 基本端点

**main.py**

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()                 # 接受连接
    try:
        while True:
            data = await websocket.receive_text()   # 接收消息
            await websocket.send_text(f"收到：{data}")  # 回显
    except WebSocketDisconnect:
        print("客户端断开连接")
```

- `@app.websocket`：声明 WebSocket 端点；
- `accept()`：必须先接受连接，否则无法通信；
- `receive_text()` / `send_text()`：收发文本消息；
- 客户端断开会抛 `WebSocketDisconnect`，需要捕获。

#### 10.3 多连接管理与广播

真实场景（如聊天室）需要跟踪所有连接并向它们广播：

**main.py**

```python
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, message: str):
        for ws in self.active:
            await ws.send_text(message)


manager = ConnectionManager()


@app.websocket("/ws/chat")
async def chat(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            await manager.broadcast(f"广播：{msg}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

注意：这里的 `ConnectionManager` 是**单进程内存**管理，多进程/多实例部署时需要引入 Redis Pub/Sub 等跨进程方案。

#### 10.4 生产部署

开发用 `uv run uvicorn --reload`，生产环境关闭热重载，并根据部署平台选择进程管理方式：

```bash
# 方案一：单进程 Uvicorn
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# 方案二：Gunicorn 管理多进程 + Uvicorn worker
uv add gunicorn
uv run gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

**Dockerfile**

```bash
FROM ghcr.io/astral-sh/uv:0.12.21 AS uv
FROM python:3.12-slim
COPY --from=uv /uv /uvx /bin/
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY . .
RUN uv sync --frozen --no-dev
CMD ["uv", "run", "--no-sync", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

使用 `COPY . .` 时，要在 `.dockerignore` 中排除 `.venv`、`.git` 和本地缓存；镜像里的环境由 `uv sync` 根据锁文件重新构建。

> [!WARNING]
>
> **部署要点**
>
> 生产环境通常还要在前面加**反向代理**（Nginx / Traefik）做 TLS 终止、负载均衡、静态文件。WebSocket 在反向代理下要正确配置 `Upgrade` 头转发，否则连接会失败。

#### 10.5 上线前的最小检查表

部署不是“把 Uvicorn 跑起来”这么简单。以下检查项直接决定主干服务是否稳定：

- 所有配置、密钥、数据库 URL 来自环境变量，不把生产密钥提交到仓库；
- 生产关闭 `--reload`，数据库结构通过 Alembic 迁移而不是启动时 `create_all()`；
- 公开环境按策略关闭或保护 `/docs`、`/redoc`、`/openapi.json`；
- worker 数量与数据库连接池相乘后不超过数据库最大连接数；
- 容器通常一个进程一个副本，由编排层扩缩容；不在容器里盲目开大量 worker；
- 在可信代理后使用 `--proxy-headers`，并限制 `--forwarded-allow-ips`，不要无条件信任客户端传入的转发头；
- 反向代理正确转发 WebSocket 的 `Upgrade` 和 `Connection` 头；
- 提供独立健康检查，日志输出到 stdout，由平台统一收集和轮转；
- 发布前运行测试与迁移检查，发布后验证认证、数据库、后台任务和静态资源。

> [!CAUTION]
>
> **多 worker 不共享内存**
>
> 全局字典、模块级列表、`ConnectionManager` 和 `lru_cache` 在每个 worker 中都是一份独立副本。WebSocket 广播、在线用户数、限流计数和临时验证码等状态，多实例部署时必须放 Redis、数据库或专门的消息系统。

#### 10.6 按需扩展：文件上传不要相信文件名

文件处理不是所有 API 项目的必修项，但一旦需要上传，就必须同时考虑路径穿越、文件类型伪造、大小限制、权限和存储位置。最危险的做法是直接拼接客户端文件名：

> [!CAUTION]
>
> **不要这样写**
>
> ``` python
> async def save_upload(file):
>     target = UPLOAD_DIR / file.filename
> # 文件名可能是 ../../etc/passwd
>     target.write_bytes(await file.read())
> ```

> [!TIP]
>
> **推荐写法**
>
> ``` python
> suffix = Path(file.filename).suffix.lower()
> storage_name = f"{uuid4().hex}{suffix}"
> target = (UPLOAD_DIR / storage_name).resolve()
> if not target.is_relative_to(UPLOAD_DIR.resolve()):
>     raise HTTPException(400, "非法文件路径")
> ```

- **不信任文件名和 Content-Type**：它们都由客户端提供；扩展名白名单、内容头检测、图片解码至少组合使用两种；
- **限制大小**：边读边累计字节数，超过上限立即删除临时文件；
- **存储隔离**：上传目录禁止执行脚本；生产优先使用 S3/OSS/COS 等对象存储；
- **下载也要授权**：查询元数据时同时带 `owner_id`，不要只凭随机的存储文件名放行；
- **大文件不要整块读入内存**：上传分块处理，下载使用 `FileResponse` 或 `StreamingResponse`。

> [!NOTE]
>
> **概念关联**
>
> **概念关联：**本章是整条学习链的「终点」——WebSocket 依赖第 7 章的异步，部署则是把前面所有章节的成果真正跑起来。实战项目阶段四会补齐限流、日志、健康检查、CI/CD 等企业级细节。

#### 10.7 动手练习

**练习 1 · 回显服务 ★ 简单**

实现 10.2 的回显 WebSocket，用浏览器控制台或 `websocat` 连接测试。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**发送 `hello`，收到 `收到：hello`。

**练习 2 · 简易聊天室 ★ ★ 中等**

实现 10.3 的 `ConnectionManager`，开两个客户端连接，验证广播。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**一个客户端发消息，两个客户端都能收到广播。

**练习 3 · 多 worker 部署 ★ ★ ★ 较难**

用 `--workers 2` 启动 Uvicorn，观察内存 `ConnectionManager` 广播在多进程下是否失效。

> [!TIP]
>
> **验证与预期**
>
> **验证方法：**两个连接若落到不同 worker，广播可能只送达其中一个——体会「单进程内存状态」的局限。

> [!TIP]
>
> **最佳实践**
>
> WebSocket 适合「低频长连接、实时推送」；高频消息或需要可靠投递的场景，考虑消息队列（Redis、RabbitMQ）。多实例部署时，连接状态要用 Redis 等共享存储，不能依赖进程内存。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**生产配置、连接池、worker、代理边界和文件安全参考自“FastAPI 入门到实战”系列第 12、15、18、19 篇。WebSocket 与文件处理都属于按需扩展能力，只有成为核心需求时才应优先投入。

> 原始页面：[03-advanced/10-websocket.html](./03-advanced/10-websocket.html)

## 7. 实战项目：四个阶段的完整实现

> [!NOTE]
> 四个阶段保留完整项目代码与验收步骤：单模块 CRUD、多模块数据库、认证后台任务、企业级完善。

---

### 实战项目 · 阶段一：单模块 CRUD

*难度：进阶 前置：第 1–3 章 目标：最小可用服务 阶段铺垫*

> [!TIP]
>
> **学习目标**
>
> - 用一个文件跑通「商品」资源的完整 CRUD（增删改查）；
> - 用 Pydantic 模型做请求校验，用内存字典做临时存储；
> - 用 uv 创建项目、安装依赖并运行服务；
> - 建立「最小可用」的 API 服务，为后续扩展打地基。

#### 项目概览

我们要做一个「商品管理 API」。整个项目分四个阶段演进，这是第一步：**单文件、内存存储、无数据库**，专注把 CRUD 逻辑跑通。

> [!NOTE]
>
> **概念关联**
>
> **演进路线：**阶段一（单文件内存 CRUD）→ 阶段二（多模块 + 数据库）→ 阶段三（认证 + 后台任务）→ 阶段四（企业级完善）。每个阶段都建立在前一阶段之上，你可以对比每个阶段的增量。

#### 初始化项目

新建一个独立的示例项目。uv 会生成 `pyproject.toml`、`uv.lock` 和项目环境；后续阶段都在这个目录中增量添加依赖。

```bash
uv init --app product-api
cd product-api
uv add "fastapi[standard]"
```

#### 完整代码

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="商品管理 API", version="0.1.0")

# 内存存储：id -> 商品
fake_db: dict[int, dict] = {}
next_id = 1


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    stock: int = Field(0, ge=0)


class Product(ProductCreate):
    id: int


@app.get("/products/", response_model=list[Product])
def list_products():
    return list(fake_db.values())


@app.post("/products/", response_model=Product, status_code=201)
def create_product(product: ProductCreate):
    global next_id
    new = {"id": next_id, **product.model_dump()}
    fake_db[next_id] = new
    next_id += 1
    return new


@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: int):
    if product_id not in fake_db:
        raise HTTPException(404, "商品不存在")
    return fake_db[product_id]


@app.put("/products/{product_id}", response_model=Product)
def update_product(product_id: int, product: ProductCreate):
    if product_id not in fake_db:
        raise HTTPException(404, "商品不存在")
    fake_db[product_id] = {"id": product_id, **product.model_dump()}
    return fake_db[product_id]


@app.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int):
    if product_id not in fake_db:
        raise HTTPException(404, "商品不存在")
    del fake_db[product_id]
    return None
```

#### 关键点解析

- **模型继承**：`Product` 继承 `ProductCreate` 并加 `id` 字段，避免重复定义；
- **响应模型**：每个接口都用 `response_model` 约束返回结构；
- **状态码**：创建返回 `201`，删除返回 `204`（无内容）；
- **错误处理**：不存在的资源返回 `404`。

> [!WARNING]
>
> **内存存储的局限**
>
> 数据存在字典里，**重启即丢失**，且无法多进程共享。这只是阶段一的临时方案，阶段二会换成 SQLite 持久化。

#### 验证清单

先运行 `uv run fastapi dev main.py` 启动服务，再逐项验证：

**验收测试**

1.  `POST /products/` 创建商品，返回 `201` 和带 `id` 的对象；
2.  `GET /products/` 能看到刚创建的商品；
3.  `GET /products/1` 返回商品；`GET /products/999` 返回 `404`；
4.  `PUT /products/1` 修改价格，`GET` 验证已更新；
5.  `DELETE /products/1` 返回 `204`，再 `GET` 返回 `404`。

> [!TIP]
>
> **增量说明**
>
> 阶段二会做三件事：① 把代码拆成 `models / schemas / routers / main` 多模块；② 用 SQLAlchemy + SQLite 替换内存字典；③ 用 `get_db` 依赖管理会话。届时你会看到「拆模块」带来的可维护性提升。

> [!NOTE]
>
> **来源说明**
>
> **28 法则定位：**本阶段只负责把 HTTP 契约、请求校验和 CRUD 语义跑通，是后续数据库、认证和测试的地基。不要在这里过早引入缓存、消息队列或复杂抽象。

> 原始页面：[04-project/01-stage1.html](./04-project/01-stage1.html)

---

### 实战项目 · 阶段二：多模块 + 数据库

*难度：高级 前置：阶段一 + 第 4、8 章 目标：持久化 + 分层 28 法则主干*

> [!TIP]
>
> **学习目标**
>
> - 把单文件拆分成清晰的多模块结构（models / schemas / routers）；
> - 用 SQLAlchemy + SQLite 替换内存字典，实现数据持久化；
> - 用 `get_db` 依赖管理会话，区分 ORM 模型与 Pydantic Schema；
> - 把查询、事务提交和 HTTP 错误映射放到正确层级。

> [!TIP]
>
> **依赖增量**
>
> 在阶段一的项目目录中运行 `uv add sqlalchemy alembic`。SQLAlchemy 负责 ORM 和数据库访问，Alembic 负责生产环境的表结构迁移；命令会同步更新 `pyproject.toml` 与 `uv.lock`。

#### 目录结构（增量变化）

```bash
pyproject.toml
uv.lock
app/
├── main.py          # 应用入口，挂载路由
├── database.py      # 引擎、会话、Base
├── models.py        # SQLAlchemy ORM 模型
├── schemas.py       # Pydantic 请求/响应模型
├── deps.py          # get_db 等依赖
└── routers/
    └── products.py  # 商品路由
```

对比阶段一的单文件，现在职责分离：**数据库层**（models）**、接口层**（schemas）**、路由层**（routers）各司其职。

#### 关键代码

**database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
```

**models.py**

```python
from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class ProductDB(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    price: Mapped[float] = mapped_column(Float)
    stock: Mapped[int] = mapped_column(default=0)
```

**schemas.py**

```python
from pydantic import BaseModel, Field, ConfigDict


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    stock: int = Field(0, ge=0)


class ProductOut(ProductCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)  # 从 ORM 对象读取
```

**deps.py**

```python
from database import SessionLocal


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
```

**routers/products.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
import models, schemas
from deps import get_db

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=list[schemas.ProductOut])
def list_products(db: Session = Depends(get_db)):
    return list(db.scalars(select(models.ProductDB)))


@router.post("/", response_model=schemas.ProductOut, status_code=201)
def create_product(p: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.ProductDB(**p.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(models.ProductDB, product_id)
    if not product:
        raise HTTPException(404, "商品不存在")
    return product
```

**main.py**

```python
from fastapi import FastAPI
import models
from database import engine
from routers import products

models.Base.metadata.create_all(bind=engine)  # 开发用建表

app = FastAPI(title="商品管理 API", version="0.2.0")
app.include_router(products.router)
```

#### 关键点解析

- **APIRouter**：用 `prefix` 和 `tags` 组织路由，`include_router` 挂载；
- **会话依赖**：每个请求通过 `get_db` 拿独立会话，结束自动关闭；
- **ORM vs Schema**：`ProductDB` 负责持久化，`ProductOut` 控制输出，二者分离；
- **事务边界**：创建商品在一个用例内 `add → commit → refresh`；失败时由依赖回滚；
- **持久化**：数据存入 `app.db`，重启不再丢失。

> [!WARNING]
>
> **坑点提醒**
>
> `create_all` 只在开发用，生产要用 Alembic 迁移；SQLite 必须配 `check_same_thread=False`；响应模型务必用 `from_attributes=True` 才能从 ORM 对象读字段。

> [!TIP]
>
> **分层的最小判断标准**
>
> 如果一段代码在描述 HTTP（状态码、查询参数、响应模型），放 router；如果在描述业务动作和事务（创建商品并检查库存），放下一步的 service；如果只在描述如何从数据库取数，放 repository/crud。阶段二先跑通，阶段三再引入更完整的业务模块结构。

**验收测试**

1.  创建商品后**重启服务**，`GET /products/` 数据仍在（持久化生效）；
2.  查看 `app.db` 文件已生成，可用 SQLite 工具查表；
3.  `/docs` 里能看到 `products` 标签分组。

> [!TIP]
>
> **增量说明**
>
> 阶段三会新增 `users` 模块：用户注册、密码哈希、JWT 登录，以及下单后异步发通知邮件。届时你会看到 `get_current_user` 依赖如何保护商品接口。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**本阶段的 SQLAlchemy 2.0 建模、`get_db` 生命周期和分层方式参考自“FastAPI 入门到实战”系列第 8、9 篇；代码按本教程商品模型精简。

> 原始页面：[04-project/02-stage2.html](./04-project/02-stage2.html)

---

### 实战项目 · 阶段三：认证 + 后台任务

*难度：高级 前置：阶段二 + 第 6、9 章 目标：用户体系 + 异步通知 28 法则主干*

> [!TIP]
>
> **学习目标**
>
> - 新增 `users` 模块：注册、密码哈希、JWT 登录；
> - 用 `get_current_user` 依赖保护商品接口（需登录才能增删改）；
> - 引入「订单」概念，下单后用后台任务异步发送通知邮件。

#### 新增目录结构

```bash
app/
├── security.py       # 密码哈希 + JWT 签发/解码
├── routers/
│   ├── products.py   # 加上 get_current_user 依赖
│   ├── users.py      # 注册 / 登录
│   └── orders.py     # 下单 + 后台任务
└── tasks.py          # 后台任务函数（发邮件等）
```

#### 安全模块

**security.py**

```python
from datetime import UTC, datetime, timedelta
import jwt
from pwdlib import PasswordHash
from config import settings

SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
EXPIRE_MINUTES = 30
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return password_hash.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
```

> [!TIP]
>
> **依赖增量**
>
> 在项目目录运行 `uv add "pwdlib[argon2]" PyJWT python-multipart`。旧项目中的 `passlib`/`python-jose` 仍可维护，但新代码建议按当前 FastAPI 安全教程的库和异常类型编写。

#### 认证依赖

```python
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import models
from security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exc = HTTPException(401, "无效或过期的令牌")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.InvalidTokenError:
        raise credentials_exc
    if payload.get("type") != "access":
        raise credentials_exc
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise credentials_exc
    user = db.get(models.UserDB, user_id)
    if user is None or not user.is_active:
        raise credentials_exc
    return user
```

#### 后台任务：下单发通知

**routers/orders.py**

```python
from fastapi import APIRouter, Depends, BackgroundTasks
import tasks
from deps import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/")
def create_order(
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    # 省略订单落库逻辑
    # 只传标量；不要传 db、user ORM 对象或 Request
    background_tasks.add_task(tasks.send_order_notification, user.email)
    return {"message": "订单已创建，通知邮件稍后发送"}
```

**tasks.py**

```python
def send_order_notification(email: str):
    # 实际中这里是 SMTP 发邮件；这里打印模拟
    print(f"[后台任务] 向 {email} 发送下单通知")
```

#### 关键点解析

- **受保护路由**：商品接口加 `Depends(get_current_user)`，未登录返回 `401`；
- **OAuth2 密码流**：`/docs` 里点 Authorize 填用户名密码即可测试；
- **后台任务**：下单响应先返回，发邮件在后台执行（第 6 章落地）；
- **生命周期隔离**：任务只接收邮箱等标量；若任务需要数据库，应在任务内部创建独立会话；
- **依赖链**：`get_current_user` 同时依赖 `oauth2_scheme` 和 `get_db`，展示了依赖嵌套。

> [!WARNING]
>
> **生产注意**
>
> `SECRET_KEY` 必须走环境变量，绝不能硬编码；`BackgroundTasks` 适合轻量通知，若邮件量大、需重试，应切换到 Celery + Redis。生产还应在 token 中校验 `type="access"`、设置短有效期，并考虑禁用账号后的 token 失效策略。

**验收测试**

1.  注册用户 → 登录换取 token；
2.  不带 token 调 `POST /products/` 返回 `401`；
3.  带 token 再调，成功 `201`；
4.  下单后，终端先看到响应、随后打印后台发送日志。

> [!TIP]
>
> **增量说明**
>
> 阶段四做最后的企业级收尾：限流、结构化日志、健康检查、配置管理、Docker 部署与 CI 流水线，让项目真正可上线。

> [!NOTE]
>
> **来源说明**
>
> **扩展阅读：**本阶段认证、JWT 校验和后台任务生命周期参考自“FastAPI 入门到实战”系列第 11、13 篇；同时保留教程原有阶段三的业务演进结构。

> 原始页面：[04-project/03-stage3.html](./04-project/03-stage3.html)

---

### 实战项目 · 阶段四：企业级完善

*难度：高级 前置：阶段三 + 第 5、10 章 目标：可上线、可观测、可运维 上线前加固*

> [!TIP]
>
> **学习目标**
>
> - 引入配置管理、结构化日志、限流与健康检查；
> - 用 Alembic 管理数据库迁移；
> - 用 Docker 容器化，并搭建 CI 流水线。

> [!TIP]
>
> **依赖增量**
>
> 运行 `uv add pydantic-settings slowapi alembic`，再运行 `uv add --dev pytest httpx`。开发依赖只进入开发环境，生产镜像使用 `uv sync --no-dev` 安装。

#### 1. 配置管理

用 `pydantic-settings` 从环境变量读取配置，避免硬编码：

**config.py**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./app.db"
    secret_key: str = "dev-secret"
    access_token_expire_minutes: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
```

生产环境不要给 `secret_key` 提供可用默认值。开发环境的默认值最多只能帮助本地启动，部署时应由环境变量或密钥管理服务强制注入。

#### 2. 限流中间件

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/products/")
@limiter.limit("10/minute")   # 每 IP 每分钟最多 10 次
def list_products(request: Request):
    ...
```

#### 3. 健康检查与结构化日志

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"status={response.status_code}")
    return response
```

#### 4. Docker 部署

**Dockerfile**

```bash
FROM ghcr.io/astral-sh/uv:0.12.21 AS uv
FROM python:3.12-slim
COPY --from=uv /uv /uvx /bin/
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY app ./app
RUN uv sync --frozen --no-dev
EXPOSE 8000
CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml**

```yaml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
    depends_on:
      - db
  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=pass
```

#### 5. CI 流水线（GitHub Actions）

**.github/workflows/ci.yml**

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
        with:
          python-version: "3.12"
          enable-cache: true
      - run: uv sync --frozen
      - run: uv run pytest
```

#### 6. 最小测试闭环

测试的目的不是追求覆盖率数字，而是在修改时快速发现“认证、事务和数据归属”被破坏。用 `uv run pytest` 执行测试，先用 `TestClient` 覆盖高价值路径：

**tests/test_auth_boundary.py**

```python
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user

client = TestClient(app)


def fake_user():
    return {"id": 1, "username": "tester", "is_active": True}


def test_requires_authentication():
    response = client.get("/api/v1/todos")
    assert response.status_code == 401


def test_authenticated_user_can_list_own_todos():
    app.dependency_overrides[get_current_user] = fake_user
    try:
        response = client.get("/api/v1/todos")
        assert response.status_code == 200, response.text
    finally:
        app.dependency_overrides.clear()
```

- 依赖覆盖让测试不必启动真实认证服务；
- 测试数据库使用独立事务，结束后回滚，避免用例互相污染；
- 必须覆盖：未认证 401、参数错误 422、访问他人资源 404、成功创建 201；
- SQLite 内存库适合日常快速测试，CI 再跑一轮 PostgreSQL 验证方言差异。

#### 最终目录结构

```bash
app/
├── main.py
├── config.py
├── database.py
├── models.py
├── schemas.py
├── security.py
├── deps.py
├── tasks.py
├── routers/
│   ├── products.py
│   ├── users.py
│   └── orders.py
├── migrations/          # Alembic
tests/
Dockerfile
docker-compose.yml
pyproject.toml
uv.lock
.gitlab-ci.yml / .github/workflows/
```

> [!TIP]
>
> **恭喜完成**
>
> 你已走完从「单文件 Hello World」到「企业级 API 服务」的完整旅程。回顾这条演进路径，你会发现每一阶段都是前一阶段能力的自然延伸——这正是学习 FastAPI 的正确姿势：**小步快跑，逐步扩展**。

> [!NOTE]
>
> **上线前用主干问题做验收**
>
> 认证失败是否返回 401、越权访问是否返回 404、写操作异常是否回滚、后台任务是否误用请求会话、数据库连接是否耗尽、文档与密钥是否暴露、迁移是否可重复执行。先逐项回答这些问题，再讨论缓存、消息队列和更复杂的可观测性。

#### 回顾：四个阶段演进总结

| 阶段                 | 核心增量                        | 对应章节    |
|----------------------|---------------------------------|-------------|
| 一 · 单模块 CRUD     | 路由 + Pydantic 校验 + 内存存储 | 第 1–3 章   |
| 二 · 多模块 + 数据库 | 分层 + SQLAlchemy + 会话依赖    | 第 4、8 章  |
| 三 · 认证 + 后台任务 | JWT + 权限 + BackgroundTasks    | 第 6、9 章  |
| 四 · 企业级完善      | 限流/日志/迁移/部署/CI          | 第 5、10 章 |

> 原始页面：[04-project/04-stage4.html](./04-project/04-stage4.html)

## 8. 核心纵切面：Todo 业务闭环的完整实现

> [!IMPORTANT]
> 核心纵切面保留从契约、模型、会话、JWT、归属过滤、路由、后台任务到测试的完整实现，是全文最重要的工程主线。

---

### 核心路线 · 20% 主干业务纵切面

*28 法则主线 前置：第 1–4、6、8、9 章 目标：打通一个真实业务闭环*

> [!TIP]
>
> **学习目标**
>
> - 一个请求从 URL、查询参数、JSON 请求体到响应模型，契约如何定义；
> - JWT 身份如何经依赖注入进入业务函数，为什么不能只做接口级权限；
> - 数据库会话、事务提交、回滚和资源关闭分别放在哪一层；
> - 为什么查询必须带 `owner_id`，以及如何避免 IDOR 越权；
> - 后台任务为什么不能复用请求里的 `Session` 或 ORM 对象；
> - 如何用少量测试覆盖认证、校验、归属隔离和核心成功路径。

20% 契约、依赖、会话、认证、异步边界。它们决定业务能否安全落地。

80% 绝大多数 CRUD、后台系统、小程序 API 和 AI 服务接口，都绕不开这五段能力。

> [!NOTE]
>
> **先抓主干，不是跳过基础**
>
> 28 法则强调的是**学习顺序和投入优先级**。先把一条业务链从头到尾跑通，再回头补 WebSocket、文件上传、Celery、压测、CI 等场景能力，知识之间才会有挂载点。

#### 1. 一条完整的业务链

本项目用 Todo 作为最小业务对象。它不是玩具代码，而是把真实项目最常见的五段主干压缩到一个闭环里：

**01 请求契约：路由、参数、状态码、响应模型**

**02 数据边界：Pydantic 输入与输出模型**

**03 身份与依赖：JWT、DB、当前用户**

**04 持久化事务：Repository、归属过滤、提交/回滚**

**05 异步边界：响应后再执行的安全后台任务**

**06 验收测试：401/422/404/201 与越权路径**

最终闭环是：**注册登录 → 获得 access token → 创建 Todo → 落库并提交 → 只查询自己的数据 → 响应返回后发送通知**。这条链路一旦真正掌握，换业务对象只是在重复同一套工程动作。

#### 2. 最小目录，保持单向依赖

```bash
pyproject.toml
uv.lock
app/
├── main.py                 # 只负责组装应用
├── core/
│   ├── config.py           # 配置与密钥
│   └── security.py         # 密码哈希、JWT
├── db/
│   ├── base.py             # DeclarativeBase
│   └── session.py          # engine、SessionLocal、get_db
├── modules/
│   ├── auth/
│   │   ├── router.py
│   │   └── schema.py
│   └── todo/
│       ├── model.py        # SQLAlchemy ORM
│       ├── schema.py       # Pydantic 契约
│       ├── repository.py   # 数据访问与归属过滤
│       ├── service.py      # 业务编排与事务
│       └── router.py       # HTTP 映射
└── tasks.py                # 独立后台任务
tests/
└── test_todos.py
```

依赖方向保持 `router → service → repository → model`。路由只处理 HTTP；service 决定一次用例的事务；repository 只构造查询，不控制响应；model 只描述表结构。

```bash
uv init --app todo-api
cd todo-api
uv add "fastapi[standard]" sqlalchemy alembic "pwdlib[argon2]" PyJWT python-multipart pydantic-settings
uv add --dev pytest httpx
uv run uvicorn app.main:app --reload
```

#### 3. 先定契约，再写 SQL

接口设计从 Pydantic 开始。输入、更新、输出必须拆开，尤其不要让客户端直接提交 ORM 对象：

**app/modules/todo/schema.py**

```python
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class TodoBase(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=100)]
    priority: Annotated[str, Field(pattern=r"^(low|medium|high)$")] = "medium"


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: Annotated[str | None, Field(default=None, min_length=1, max_length=100)]
    done: bool | None = None
    priority: Annotated[str | None, Field(
        default=None,
        pattern=r"^(low|medium|high)$",
    )]

    model_config = ConfigDict(extra="forbid")


class TodoPublic(TodoBase):
    id: int
    done: bool
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

**为什么这就够用：**`TodoCreate` 防止客户端提交 `id`、`owner_id`；`TodoUpdate` 全字段可选并禁止额外字段；`TodoPublic` 是响应白名单，永远不会把内部字段泄露出去。

> [!CAUTION]
>
> **不要这样写**
>
> `def update(payload: dict)` 或直接把 `Todo` ORM 模型作为请求体。这样会把字段白名单、类型转换和文档契约全部交给手写判断。

> [!TIP]
>
> **推荐写法**
>
> `payload.model_dump(exclude_unset=True)` 只取客户端显式提交的字段，未传字段保持原值，适合 PATCH 更新。

#### 4. 模型、会话与事务

ORM 模型用 SQLAlchemy 2.0 风格声明。会话依赖只负责创建、异常回滚和关闭；业务用例负责在合适的位置提交：

**app/db/session.py**

```python
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
```

**app/modules/todo/model.py**

```python
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(100), index=True)
    done: Mapped[bool] = mapped_column(default=False)
    priority: Mapped[str] = mapped_column(String(10), default="medium")
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
```

`Mapped[str]` 表示非空，`Mapped[str | None]` 表示可空。数据库约束、IDE 类型和迁移语义因此保持一致。生产环境不要用 `create_all()` 演进表结构，应交给 Alembic。

#### 5. 身份与依赖：先把“谁在操作”确定下来

认证不是一个可选过滤器，而是核心业务函数的入参。JWT 只放最小标识，当前用户每次从数据库读取，才能及时反映禁用、改密或权限变更。

**app/core/security.py**

```python
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return password_hash.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=[ALGORITHM],
        options={"require": ["sub", "iat", "exp", "type"]},
    )
```

**app/api/deps.py**

```python
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.modules.user.model import User

DB = Annotated[Session, Depends(get_db)]
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: DB,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
    except jwt.InvalidTokenError:
        raise unauthorized

    if payload.get("type") != "access":
        raise unauthorized

    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise unauthorized

    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
```

> [!WARNING]
>
> **登录接口的 Content-Type 很容易错**
>
> `OAuth2PasswordRequestForm` 读取的是 `application/x-www-form-urlencoded`，不是 JSON。Swagger 的 Authorize 会自动处理；自己写前端时请用 `URLSearchParams` 或表单编码，否则会得到 422。

#### 6. 数据级授权：把 owner_id 写进 WHERE

接口级认证只能证明“你登录了”，不能证明“这条数据属于你”。资源归属必须进入查询条件，而不是查出来后再判断：

**app/modules/todo/repository.py**

```python
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.todo.model import Todo
from app.modules.todo.schema import TodoCreate, TodoUpdate


def get_owned(db: Session, *, todo_id: int, owner_id: int) -> Todo | None:
    stmt = select(Todo).where(
        Todo.id == todo_id,
        Todo.owner_id == owner_id,
    )
    return db.scalars(stmt).first()


def list_owned(db: Session, *, owner_id: int, skip: int, limit: int) -> list[Todo]:
    stmt = (
        select(Todo)
        .where(Todo.owner_id == owner_id)
        .order_by(Todo.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt))


def add(db: Session, *, payload: TodoCreate, owner_id: int) -> Todo:
    todo = Todo(**payload.model_dump(), owner_id=owner_id)
    db.add(todo)
    db.flush()
    return todo


def apply_update(db: Session, *, todo: Todo, payload: TodoUpdate) -> Todo:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)
    db.flush()
    return todo
```

`get_owned()` 同时按 `id` 和 `owner_id` 查询。访问别人的 Todo 会直接表现为 404，而不是“存在但你没权限”，从而不泄露资源是否存在。这是防 IDOR 的核心写法。

**app/modules/todo/service.py**

```python
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.modules.todo import repository
from app.modules.todo.model import Todo
from app.modules.todo.schema import TodoCreate, TodoUpdate


def create_todo(
    db: Session,
    *,
    payload: TodoCreate,
    owner_id: int,
) -> Todo:
    todo = repository.add(db, payload=payload, owner_id=owner_id)
    db.commit()
    db.refresh(todo)
    return todo


def update_todo(
    db: Session,
    *,
    todo_id: int,
    owner_id: int,
    payload: TodoUpdate,
) -> Todo:
    todo = repository.get_owned(db, todo_id=todo_id, owner_id=owner_id)
    if todo is None:
        raise NotFoundError("Todo", todo_id)
    repository.apply_update(db, todo=todo, payload=payload)
    db.commit()
    db.refresh(todo)
    return todo
```

#### 7. 路由只做 HTTP 映射

路由应该短到可以快速扫完：接收参数、调用 service、安排后台任务、返回 ORM 对象交给 `response_model` 序列化。

**app/modules/todo/router.py**

```python
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.modules.todo import repository, service
from app.modules.todo.schema import TodoCreate, TodoPublic, TodoUpdate
from app.tasks import send_todo_created_notification

router = APIRouter(prefix="/api/v1/todos", tags=["todos"])
DB = Annotated[Session, Depends(get_db)]


@router.post("", response_model=TodoPublic, status_code=status.HTTP_201_CREATED)
def create_todo(
    payload: TodoCreate,
    background_tasks: BackgroundTasks,
    db: DB,
    current_user: CurrentUser,
):
    todo = service.create_todo(
        db,
        payload=payload,
        owner_id=current_user.id,
    )
    # 事务已经提交，后台任务只需要标量 ID 和收件地址
    background_tasks.add_task(
        send_todo_created_notification,
        todo.id,
        current_user.email,
    )
    return todo


@router.get("", response_model=list[TodoPublic])
def list_todos(
    db: DB,
    current_user: CurrentUser,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    return repository.list_owned(
        db,
        owner_id=current_user.id,
        skip=skip,
        limit=limit,
    )


@router.get("/{todo_id}", response_model=TodoPublic)
def get_todo(todo_id: int, db: DB, current_user: CurrentUser):
    todo = repository.get_owned(
        db,
        todo_id=todo_id,
        owner_id=current_user.id,
    )
    if todo is None:
        raise NotFoundError("Todo", todo_id)
    return todo
```

`response_model=TodoPublic` 同时承担文档、响应过滤和安全白名单。即使 ORM 对象未来新增了内部字段，也不会自动暴露。

#### 8. 异步边界：后台任务只收标量

`BackgroundTasks` 在响应发送后执行，仍然使用当前应用进程。它适合短小、可丢失的通知，不适合支付、审计或必须重试的任务。更重要的是：**不要传请求级 Session、Request、ORM 对象或 ContextVar**。

**app/tasks.py**

```python
import logging

from app.db.session import SessionLocal
from app.modules.todo.model import Todo

logger = logging.getLogger(__name__)


def send_todo_created_notification(todo_id: int, email: str) -> None:
    db = SessionLocal()
    try:
        todo = db.get(Todo, todo_id)
        if todo is None:
            return
        # 示例中只记录日志；生产环境在这里调用邮件或消息服务
        logger.info("通知 %s：Todo %s 已创建", email, todo.title)
    finally:
        db.close()
```

| 需求 | 选择 | 原因 |
|----|----|----|
| 欢迎邮件、轻量通知、失败可人工补 | `BackgroundTasks` | 零基础设施，响应后执行，但任务可能丢失 |
| 报表生成、支付回调、第三方同步、必须重试 | Celery / Dramatiq / arq | 持久消息、独立 worker、重试和状态查询 |
| 实时双向消息 | WebSocket + Redis Pub/Sub | 长连接和跨进程广播是另一类问题 |

> [!CAUTION]
>
> **最常见的后台任务事故**
>
> 把请求里的 `db` 直接传给后台任务**不是“能跑就算对”**。请求依赖结束时会话会关闭；任务会拉长连接占用；事务状态、ContextVar 和对象生命周期都不可控。任务内创建独立会话，并只传 `id`、`str` 等普通值。

#### 9. 验收测试：只测高价值路径

28 法则也适用于测试。先覆盖那些“坏了会导致真实事故”的路径，而不是一开始追求覆盖率数字：

**tests/test_todos.py**

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_todo_requires_login():
    response = client.post("/api/v1/todos", json={"title": "learn"})
    assert response.status_code == 401


def test_create_todo_validation():
    response = client.post(
        "/api/v1/todos",
        headers={"Authorization": "Bearer invalid"},
        json={"title": ""},
    )
    # 认证失败时先于 body 业务处理返回 401
    assert response.status_code == 401


def test_user_cannot_read_another_users_todo(auth_client):
    response = auth_client.get("/api/v1/todos/999")
    assert response.status_code == 404


def test_create_and_list_own_todo(auth_client):
    created = auth_client.post(
        "/api/v1/todos",
        json={"title": "完成主干路线", "priority": "high"},
    )
    assert created.status_code == 201
    todo_id = created.json()["id"]

    listed = auth_client.get("/api/v1/todos")
    assert listed.status_code == 200
    assert any(item["id"] == todo_id for item in listed.json())
```

真正需要单独测试的是：**未认证 401、无效输入 422、访问他人资源 404、创建成功 201、更新只改显式字段、后台任务不携带请求对象**。数据库事务和依赖覆盖用 `conftest.py` 做一次，不必每个用例重复。

#### 10. 这一页已经覆盖了什么

- 路径、查询参数、请求体、响应模型和状态码形成清晰契约；
- Pydantic 把外部输入转换成可信对象，并用响应白名单控制输出；
- 依赖注入统一提供数据库会话和当前用户，认证失败不会进入业务函数；
- SQLAlchemy 2.0 模型表达表结构，repository 负责归属过滤，service 管理事务；
- JWT 只放最小身份信息，当前用户从数据库读取，账号禁用可即时生效；
- 后台任务只接收标量，自己创建会话，避免请求生命周期污染；
- 测试优先覆盖认证、校验、越权和核心成功路径。

#### 11. 剩下的 80% 何时再学

并不是“不需要”，而是**不要在主流程还没跑通时平均用力**：

| 能力 | 触发条件 | 推荐章节 |
|----|----|----|
| Celery / 消息队列 | 任务必须重试、可查询、跨进程持久化 | 第 6 章扩展、生产实践 |
| Redis 缓存与限流 | 读多写少、热点数据或登录防爆破 | 第 7、10 章 |
| 文件上传与对象存储 | 真实业务需要附件、头像或导出 | 按需补充 |
| WebSocket | 实时聊天、通知、协作编辑是核心需求 | 第 10 章 |
| 多 worker 与容器编排 | 需要上线、扩容、故障恢复 | 第 10 章、阶段四 |
| 完整测试金字塔与 CI | 多人协作或发布频率提高 | 阶段四、生产实践 |

> [!TIP]
>
> **28 法则真正要求你做的三件事**
>
> 第一，先把一条真实业务链走通；第二，每加一个能力都问它解决了哪类线上问题；第三，用测试和验收清单守住主干，不让新功能悄悄破坏认证、事务和数据归属。

**综合验收 · 不接前端也要证明能工作**

1.  注册两个用户 A、B，分别登录获取 token；
2.  A 创建一条 Todo，B 用列表查询确认看不到；
3.  B 直接访问 A 的 `todo_id`，必须得到 404；
4.  A 用 PATCH 只传 `{"done": true}`，确认其他字段没有被重置；
5.  检查数据库和日志：记录已提交，后台任务使用独立会话并打印通知；
6.  运行测试，401、422、404、201 和成功列表路径全部有断言。

> [!TIP]
>
> **验证与预期**
>
> **通过标准：**即使删掉前端，仅凭 `/docs` 和测试也能完整验证业务闭环；任意一个归属过滤被去掉，测试都会失败。

> [!NOTE]
>
> **来源说明**
>
> **内容说明：**本页在现有 FastAPI 教程基础上，参考“FastAPI 入门到实战”系列中关于 Pydantic、依赖注入、SQLAlchemy、认证授权、异步与后台任务的组织方式，重新编排为一个核心业务纵切面。示例代码为本教程上下文中的独立实现。

> 原始页面：[04-project/05-core-slice.html](./04-project/05-core-slice.html)

## 9. 教程站点自身的实现

### 9.1 页面结构

每个知识页面都包含统一结构：

- 顶部学习进度条；
- 左侧完整章节导航；
- 面包屑；
- 难度、前置知识和预计时间标签；
- 学习目标与前置知识；
- 正文、代码块、表格和提示框；
- 常见误区、最佳实践、动手练习与预期输出；
- 上一页 / 下一页导航；
- “标记本章为已完成”按钮。

### 9.2 样式系统

`assets/css/style.css` 提供：

- CSS 变量与浅色主题；
- FastAPI 品牌绿 `#009688`；
- 侧边栏和主内容布局；
- 学习目标、提示框、代码块、表格和练习卡片；
- 28 法则学习地图和流程图；
- 响应式移动端布局；
- 基础打印样式。

`assets/css/highlight.css` 为自研高亮器提供浅色 token 配色；`assets/css/progress.css` 负责全局进度条、阶段卡片和完成状态。

> [!NOTE]
> 页面没有任何 CDN 依赖，下载仓库后可直接打开 `index.html` 离线学习。

### 9.3 JavaScript 行为

| 文件 | 作用 |
| --- | --- |
| `assets/js/nav.js` | 代码复制、当前目录高亮、移动端展开/收起目录 |
| `assets/js/progress.js` | 用 `localStorage` 保存完成状态，更新顶部和首页进度 |
| `assets/js/highlight.js` | 无依赖的 Python、bash、JSON 轻量语法高亮 |

学习进度使用：

```text
localStorage key: fastapi_tutorial_progress
页面 ID: 当前 HTML 文件名去掉扩展名
```

> [!IMPORTANT]
> 当前站点以 15 个学习页面为进度基准。若未来新增或删除页面，需要同步更新所有 HTML 的 `data-total-pages`、`data-page-ids`、侧边栏和首页章节卡片。

> [!WARNING]
> 自研高亮器只覆盖 Python、bash 和 JSON 的主要场景；YAML 目前按纯文本处理。如果需要更完整的语言支持，应扩展 `highlight.js` 或改用成熟的本地高亮库。

### 9.4 首页学习地图

`index.html` 承担四个职责：

1. 展示教程定位、技术基线和学习目标；
2. 解释 20% / 80% 的 28 法则；
3. 提供按入门、进阶、高级、实战划分的章节卡片；
4. 汇总整体学习进度，并从 `localStorage` 恢复完成状态。

> [!TIP]
> 首页不是营销页，而是学习控制台。打开项目时先看推荐路线和主干必修，再进入具体章节。

---

## 10. 高频坑位总表

| 领域 | 高频错误 | 正确处理 |
| --- | --- | --- |
| 环境 | 直接使用全局 `pip install` | 用 `uv add`，提交 `pyproject.toml` 和 `uv.lock` |
| 启动 | 模块名或变量名与 `main:app` 不匹配 | 根据实际文件名和应用变量修改命令 |
| 路由 | 动态路径写在固定路径前面 | 固定路径优先声明 |
| 参数 | 把 `str \| None` 当成可选参数 | 还要提供 `= None` 默认值 |
| 响应 | 直接返回 ORM 对象 | 用 `response_model` 定义公开白名单 |
| 更新 | 把未提交字段覆盖成默认值 | 使用 `model_dump(exclude_unset=True)` |
| 依赖 | 认为 `yield` 会自动提交事务 | 明确 service 的提交与回滚边界 |
| 中间件 | 在全局中间件里查数据库 | 把业务判断放依赖或 service |
| 后台任务 | 传 `Session`、ORM 对象或 `Request` | 只传标量，任务内创建独立会话 |
| 异步 | `async def` 中调用 `time.sleep` 或同步库 | 改异步库，或使用普通 `def` |
| 数据库 | 每个 repository 自己提交 | 同一业务用例统一管理事务 |
| 数据库 | 访问关联对象产生 N+1 | 使用 `selectinload` 或聚合查询 |
| 授权 | 只判断用户是否登录 | 查询必须同时带 `owner_id` |
| 认证 | 把 403 当成 401 | 无凭据 401，已认证无权限 403 |
| JWT | 把敏感资料放进 Payload | 只放 `sub`、`exp`、`type` 等最小声明 |
| JWT | 接受任意算法 | 服务端显式固定 `algorithms=["HS256"]` |
| 部署 | 生产开启 `--reload` | 生产关闭热重载 |
| 部署 | 多 worker 共享内存状态 | 用 Redis、数据库或消息系统 |
| 上传 | 直接使用客户端文件名拼路径 | 生成 UUID 文件名并校验解析后路径 |

> [!CAUTION]
> 一个看起来正常的接口，可能同时存在认证、越权、事务和任务生命周期问题。验收时必须从“未登录、错误输入、越权访问、异常回滚、重复请求、多 worker”这些角度主动攻击自己的服务。

---

## 11. 上线前验收清单

### 11.1 请求与数据

- [ ] 路径参数、查询参数和请求体来源清晰；
- [ ] 路径顺序没有固定路径被动态路径吞掉；
- [ ] 成功、失败和删除状态码符合语义；
- [ ] 创建、更新、内部和公开模型已分离；
- [ ] `response_model` 能过滤敏感字段；
- [ ] PATCH 使用 `exclude_unset=True`；
- [ ] 422 错误结构能被前端稳定解析。

### 11.2 认证、授权与数据隔离

- [ ] 密码使用 Argon2、scrypt、bcrypt 或 PBKDF2 哈希；
- [ ] `SECRET_KEY` 不在代码仓库中；
- [ ] JWT 算法显式固定；
- [ ] JWT 只含最小声明；
- [ ] 未认证返回 401，已认证无权限返回 403；
- [ ] 所有资源查询都带 `owner_id` 或等价归属条件；
- [ ] 越权读取返回 404，不泄露资源存在性；
- [ ] 账号禁用和登录失效策略明确。

### 11.3 数据库与事务

- [ ] 每请求一个独立 Session，并在结束后关闭；
- [ ] 多表写操作在同一事务中提交；
- [ ] 异常路径会回滚；
- [ ] 生产使用 Alembic 而不是 `create_all()`；
- [ ] 关联查询已检查 N+1；
- [ ] 同步和异步数据库栈没有混用错误；
- [ ] worker 数 × 连接池大小不超过数据库上限。

### 11.4 异步与后台任务

- [ ] `async def` 中没有同步阻塞调用；
- [ ] 外部 HTTP 客户端在 `lifespan` 中复用并关闭；
- [ ] 外部调用设置连接、读取和总超时；
- [ ] 只对幂等请求和可恢复错误有限重试；
- [ ] 后台任务只接收标量；
- [ ] 后台任务内部创建自己的数据库会话；
- [ ] 需要持久化、重试或跨进程的任务已进入消息队列。

### 11.5 部署与可观测性

- [ ] 生产关闭 `--reload`；
- [ ] 容器和锁文件可重复构建；
- [ ] `.dockerignore` 排除 `.venv`、`.git` 和缓存；
- [ ] 反向代理正确转发 WebSocket 升级头；
- [ ] 健康检查不依赖业务数据库也可以给出明确状态；
- [ ] 日志包含 request ID、方法、路径和状态码；
- [ ] 密码、token 和敏感响应没有进入日志；
- [ ] 生产文档端点按策略保护；
- [ ] 发布前运行测试、迁移和关键路径验收。

### 11.6 测试

- [ ] 未认证 401；
- [ ] 参数错误 422；
- [ ] 普通用户访问管理员接口 403；
- [ ] 访问他人资源 404；
- [ ] 成功创建 201；
- [ ] 列表只返回自己的数据；
- [ ] PATCH 不重置未提交字段；
- [ ] 测试结束清理 `dependency_overrides`；
- [ ] CI 使用 `uv sync --frozen` 与 `uv run pytest`。

> [!IMPORTANT]
> 上线前先把以上主干问题逐项回答，再讨论缓存、消息队列、复杂可观测性或更细的服务拆分。

---

## 12. 快速命令与常用模板

### 12.1 初始化项目

```bash
uv init --app fastapi-demo
cd fastapi-demo
uv add "fastapi[standard]"
uv run fastapi dev main.py
```

### 12.2 常用依赖

```bash
# 数据库
uv add sqlalchemy alembic

# SQLite 异步驱动
uv add aiosqlite

# PostgreSQL 异步驱动
uv add asyncpg

# 认证
uv add "pwdlib[argon2]" PyJWT python-multipart

# 配置
uv add pydantic-settings

# 限流
uv add slowapi

# 测试
uv add --dev pytest httpx
```

### 12.3 CI 最小模板

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
        with:
          python-version: "3.12"
          enable-cache: true
      - run: uv sync --frozen
      - run: uv run pytest
```

### 12.4 Dockerfile 模板

```dockerfile
FROM ghcr.io/astral-sh/uv:0.12.21 AS uv
FROM python:3.12-slim
COPY --from=uv /uv /uvx /bin/
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY . .
RUN uv sync --frozen --no-dev
CMD ["uv", "run", "--no-sync", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

> [!TIP]
> 使用多阶段构建和 `uv sync --frozen` 可以确保镜像依赖与锁文件一致。生产镜像不要包含开发依赖和本地虚拟环境。

---

## 13. 学习与实践建议

> [!TIP]
> 每章不要只看代码。按“先预测输出 → 手写一遍 → 用 `/docs` 调接口 → 故意制造错误 → 补一个测试”的方式学习，效果远好于顺序浏览。

建议练习顺序：

- [ ] 用 uv 创建项目并运行 Hello World；
- [ ] 写出路径参数、查询参数和 Pydantic 请求体；
- [ ] 实现一个带 201、404、422 的 Todo CRUD；
- [ ] 抽取 `get_db` 和 `get_current_user` 依赖；
- [ ] 用 SQLAlchemy 2.0 完成持久化；
- [ ] 实现密码哈希、JWT 登录和 `CurrentUser`；
- [ ] 查询必须带 `owner_id`，并编写越权测试；
- [ ] 用后台任务发送通知，任务只收标量；
- [ ] 对比同步路由和异步路由的性能差异；
- [ ] 用 Docker、健康检查、日志和 CI 完成上线验收。

> [!IMPORTANT]
> 当你能在删掉前端的情况下，仅凭 `/docs` 和自动化测试证明“认证、事务、数据隔离、后台任务、错误响应”都正确，这条 FastAPI 主干才算真正掌握。

---

## 14. 原始内容索引

> 以下文件均位于项目根目录 `D:\AAAJob\NoteJob\fastapi-tutorial`。`editable-version/` 已按要求排除。

### 14.1 说明与入口

- `README.md`：教程定位、28 法则、学习路线、依赖基线和参考内容；
- `HANDOFF.md`：交付清单、设计决策、目录约定、页面结构和后续增强事项；
- `index.html`：学习路径首页、主干预学习地图和全局进度。

### 14.2 知识章节

- `01-basics/01-intro.html`：FastAPI 简介与安装；
- `01-basics/02-path-request.html`：路径与请求处理；
- `01-basics/03-request-body.html`：请求体与 Pydantic；
- `02-intermediate/04-dependency.html`：依赖注入；
- `02-intermediate/05-middleware.html`：中间件；
- `02-intermediate/06-background.html`：后台任务；
- `03-advanced/07-async.html`：异步编程；
- `03-advanced/08-database.html`：数据库集成；
- `03-advanced/09-auth.html`：身份认证与授权；
- `03-advanced/10-websocket.html`：WebSocket 与部署。

### 14.3 实战与核心路线

- `04-project/01-stage1.html`：单模块 CRUD；
- `04-project/02-stage2.html`：多模块 + 数据库；
- `04-project/03-stage3.html`：认证 + 后台任务；
- `04-project/04-stage4.html`：企业级完善；
- `04-project/05-core-slice.html`：28 法则核心业务纵切面。

### 14.4 前端资源

- `assets/css/style.css`：全局布局、主题、组件和响应式样式；
- `assets/css/highlight.css`：代码高亮配色；
- `assets/css/progress.css`：进度、阶段和章节完成状态；
- `assets/js/highlight.js`：离线语法高亮；
- `assets/js/nav.js`：复制按钮、目录高亮和移动端导航；
- `assets/js/progress.js`：学习进度的 `localStorage` 持久化。

---

## 15. 最终结论

> **FastAPI 的学习重点不是记住更多装饰器，而是建立一套可靠的 API 工程边界。**

最值得反复练习的五句话：

1. **请求进入时，先用 Pydantic 把外部输入变成可信对象。**
2. **业务执行前，用依赖注入确定数据库会话、当前用户和权限。**
3. **访问资源时，把 `owner_id` 写进查询，而不是查出来再判断。**
4. **一次业务用例统一管理事务，后台任务只接收标量并自建会话。**
5. **只在确有异步 I/O 时使用 `async def`，并用测试守住认证、事务和数据隔离。**

> [!NOTE]
> 当主干闭环稳定后，WebSocket、文件上传、Celery、缓存、压测、CI/CD 和容器编排都只是按业务触发逐步扩展的能力，而不是一开始就必须全部引入的复杂度。
