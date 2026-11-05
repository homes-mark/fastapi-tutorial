# FastAPI 由浅入深完整学习教程 · 全项目汇总

> 本文汇总当前项目中除 `editable-version/` 之外的内容，包括教程说明、首页学习地图、15 个学习页面、4 个实战阶段、核心业务纵切面，以及 HTML/CSS/JavaScript 站点实现。

> [!IMPORTANT]
> 这份文档是“可复习、可检索、可继续扩展”的工程化汇总，不是对原 HTML 的逐字复制。章节链接仍指向项目中的原始页面，方便回到完整示例和练习。

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

## 4. 基础篇：先写出可靠的 API

### 4.1 第 1 章：FastAPI 简介与安装

> **FastAPI 的本质：** 以 Starlette 提供 ASGI 网络能力，以 Pydantic 提供数据校验与序列化，再用 Python 类型注解把接口契约、校验、文档和编辑器补全连在一起。

FastAPI 的“快”有两层：

1. **开发快**：类型注解直接生成校验与 OpenAPI 文档；
2. **运行快**：基于 ASGI 与异步事件循环，在 I/O 密集场景下并发表现更好。

框架选型不应只看“谁更高级”：

| 项目特征 | 更合适的选择 |
| --- | --- |
| 完整后台、Admin、内容管理、现成权限体系 | Django |
| JSON API、AI 服务、小程序或 App 后端 | FastAPI |
| 很小的内部工具、短期 Demo、快速验证 | Flask |

#### 最小可运行应用

```python
from fastapi import FastAPI

app = FastAPI(title="我的第一个 FastAPI 应用", version="0.1.0")


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}
```

```bash
uv init --app fastapi-hello
cd fastapi-hello
uv add "fastapi[standard]"

# 开发模式，自带热重载
uv run fastapi dev main.py

# 或直接运行 ASGI 应用
uv run uvicorn main:app --reload
```

自动文档入口：

| 地址 | 用途 |
| --- | --- |
| `/docs` | Swagger UI，可交互调试 |
| `/redoc` | ReDoc，更适合阅读 |
| `/openapi.json` | 机器可读的 OpenAPI 规范 |

> [!IMPORTANT]
> `pyproject.toml` 记录直接依赖，`uv.lock` 记录完整解析结果，两者都应提交到 Git。`.venv` 不提交；团队协作和 CI 使用 `uv sync --frozen` 还原环境。

> [!WARNING]
> `uvicorn main:app` 中，`main` 是模块名，`app` 是变量名。文件名或应用变量名变化后，启动命令也必须同步修改。

### 4.2 第 2 章：路径与请求处理

HTTP 参数通常来自三个位置：

| 参数来源 | URL 示例 | FastAPI 声明方式 |
| --- | --- | --- |
| 路径参数 | `/items/42` | 路径字符串中写 `{item_id}`，函数参数声明对应类型 |
| 查询参数 | `/items?page=1&size=10` | 普通函数参数；有默认值则可选 |
| 请求体 | POST 的 JSON | Pydantic 模型参数 |

```python
from typing import Annotated
from fastapi import FastAPI, Path, Query

app = FastAPI()


@app.get("/items/{item_id}")
def read_item(
    item_id: Annotated[int, Path(ge=1)],
    q: Annotated[str | None, Query(min_length=3, max_length=50)] = None,
):
    return {"item_id": item_id, "q": q}
```

> [!CAUTION]
> 路由按声明顺序匹配。固定路径必须写在动态路径前面：
>
> ```python
> @app.get("/users/me")
> def read_me(): ...
>
> @app.get("/users/{user_id}")
> def read_user(user_id: str): ...
> ```
>
> 如果顺序反过来，`/users/me` 会被 `{user_id}` 捕获。

REST 资源语义应尽量稳定：

| 操作 | 方法 + 路径 | 成功状态码 |
| --- | --- | --- |
| 列表 | `GET /todos` | 200 |
| 创建 | `POST /todos` | 201 |
| 详情 | `GET /todos/{id}` | 200 |
| 全量更新 | `PUT /todos/{id}` | 200 |
| 删除 | `DELETE /todos/{id}` | 204 |

> [!TIP]
> 用 `APIRouter(prefix="/todos", tags=["todos"])` 组织资源。注意 `@router.get("")` 生成 `/todos`，而 `@router.get("/")` 生成 `/todos/`；两者在客户端访问时可能触发 307 尾斜杠重定向。

### 4.3 第 3 章：请求体与 Pydantic

Pydantic 模型同时承担三类职责：

- **校验**：字段类型、必填性、长度、数值范围和正则；
- **转换**：例如把可解析的字符串转为 `int` 或 `float`；
- **序列化**：把模型转换为字典或 JSON。

```python
from pydantic import BaseModel, Field


class Product(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    stock: int = Field(0, ge=0)
    sku: str = Field(..., pattern=r"^[A-Z]{2}-\d{4}$")
```

校验失败时，FastAPI 默认返回 `422 Unprocessable Entity`。`detail[].loc` 会指出具体错误位置，例如 `["body", "price"]`。

#### 同一实体的四套模型

| 模型 | 用途 | 关键原则 |
| --- | --- | --- |
| `UserCreate` | 创建请求 | 接收客户端允许提交的字段 |
| `UserUpdate` | 局部更新 | 字段可选，通常用 `extra="forbid"` |
| `UserInDB` | 内部持久化视图 | 可包含密码哈希等敏感字段 |
| `UserPublic` | 对外响应 | 只暴露允许公开的字段，可开启 `from_attributes` |

```python
class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    model_config = ConfigDict(extra="forbid")


for field, value in payload.model_dump(exclude_unset=True).items():
    setattr(user, field, value)
```

> [!IMPORTANT]
> 请求模型负责“允许客户端传什么”，响应模型负责“允许服务端返还什么”。`response_model` 是响应白名单，不应与 ORM 模型或数据库内部模型混用。

> [!WARNING]
> `ResponseValidationError` 往往只在真实请求触发序列化时出现。修改响应模型后必须实际调用接口，不能只看服务是否启动成功。

---

## 5. 进阶篇：把公共机制组织起来

### 5.1 第 4 章：依赖注入

依赖注入的核心价值是把路由前置条件与共享资源变成可复用、可测试的函数：

- 校验 API Key、JWT 或权限；
- 提供数据库会话、配置对象和当前用户；
- 在请求结束时清理资源；
- 在测试中通过 `dependency_overrides` 替换真实依赖。

```python
from typing import Annotated
from fastapi import Depends


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


DB = Annotated[Session, Depends(get_db)]
```

> [!NOTE]
> 在同一次请求中，FastAPI 默认会缓存同一个依赖的结果。多个子依赖都依赖 `get_db` 时，通常只会创建一次会话。

> [!CAUTION]
> `yield` 之后的 `finally: db.close()` 只保证资源释放，不等于自动提交事务。谁提交、谁回滚、一次业务用例包含哪些写操作，必须明确设计。

路由级依赖适合统一保护一组接口：

```python
router = APIRouter(
    prefix="/todos",
    tags=["todos"],
    dependencies=[Depends(get_current_user)],
)
```

> [!TIP]
> 典型的认证依赖树是 `oauth2_scheme → get_current_user → require_admin`；典型的数据库链路是 `get_db → repository → service`。先把依赖树想清楚，再写路由。

### 5.2 第 5 章：中间件

中间件包裹在路由外层，适合全局横切逻辑：

- 请求计时；
- 访问日志与 `request_id`；
- CORS；
- GZip；
- 可信 Host；
- 全局异常兜底。

```python
@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(time.perf_counter() - start)
    return response
```

> **与依赖注入的区别：** 依赖注入作用于显式声明它的路由，粒度更细；中间件作用于所有请求，适合全局能力。复杂业务授权应放依赖或 service，而不是全局中间件。

> [!CAUTION]
> 全局中间件里不要做数据库查询、复杂权限判断或重量级业务逻辑。它会影响静态资源、健康检查和错误请求，并显著扩大故障面。

> [!WARNING]
> 中间件顺序类似洋葱：后注册的中间件可能先进入、最后退出。不要死记固定顺序，应结合实际请求验证 CORS、限流、异常处理和代理行为。

用一个 `request_id` 串联日志与错误：

```python
request.state.request_id = uuid.uuid4().hex[:12]
response.headers["X-Request-ID"] = request.state.request_id
```

校验错误可由异常处理器统一映射，避免前端分别解析数组型 `detail` 和字符串型 `detail`。

### 5.3 第 6 章：后台任务

> **后台任务不等于异步。** 异步解决“等待 I/O 时让出事件循环”，后台任务解决“响应发送后再执行某个动作”。

```python
@app.post("/users/")
def create_user(email: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_welcome_email, email)
    return {"message": "用户已创建，欢迎邮件稍后发送"}
```

`BackgroundTasks` 的特点：

| 特点 | 含义 |
| --- | --- |
| 响应后执行 | 客户端先收到响应 |
| 同进程执行 | 仍占用当前应用进程 |
| 不保证持久化 | 进程崩溃时任务可能丢失 |
| 无法返回结果 | 调用方已经收到响应 |
| 不适合重任务 | 大量重任务应进入独立 worker |

> [!CAUTION]
> 不要把请求级 `Session`、`Request`、ORM 对象或 `ContextVar` 直接传给后台任务。请求结束后，这些对象的生命周期和事务状态都不可控。
>
> 正确方式是只传 `id`、字符串等标量，任务内部重新创建会话。

```python
def send_email_and_log(user_id: int) -> None:
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        if user is not None:
            send_welcome_email(user.email)
    finally:
        db.close()
```

以下问题可以帮助判断是否应升级到任务队列：

1. 任务丢失会造成多大损失？
2. 失败后是否必须自动重试？
3. 是否需要查询进度、定时执行或在 API 重启后继续运行？

> [!IMPORTANT]
> 欢迎邮件、缓存刷新、轻量通知适合 `BackgroundTasks`；支付回调、审计日志、第三方同步和必须重试的任务应使用 Celery、Dramatiq、RQ 或 arq。

---

## 6. 高级篇：性能、数据与安全

### 6.1 第 7 章：异步编程

事件循环在单线程中调度协程：遇到 `await` 时挂起当前任务，去执行其他任务，I/O 完成后再回来继续。

```python
async def fetch_data():
    await asyncio.sleep(1)
    return "数据"


@app.get("/data/")
async def read_data():
    result = await fetch_data()
    return {"result": result}
```

> [!CAUTION]
> 最危险的反模式是“`async def` + 同步阻塞调用”：
>
> ```python
> @app.get("/slow/")
> async def slow_endpoint():
>     time.sleep(5)  # 阻塞整个事件循环
> ```
>
> 应改为 `await asyncio.sleep(5)`，或者把同步路由写成普通 `def`，让 FastAPI 放到线程池执行。

路由写法选择：

| 场景 | 推荐写法 |
| --- | --- |
| 纯 CPU 计算、同步数据库、`requests` | 普通 `def` |
| `httpx.AsyncClient`、`asyncpg`、`aiosqlite` | `async def` + `await` |
| async 路由中偶尔混入阻塞代码 | `run_in_threadpool` 包裹 |
| CPU 密集型批量任务 | 进程池、任务队列或独立服务 |

复用异步 HTTP 客户端：

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(
        timeout=httpx.Timeout(connect=2.0, read=5.0, write=5.0, pool=1.0),
        limits=httpx.Limits(max_connections=100),
    )
    yield
    await app.state.http.aclose()
```

> [!WARNING]
> 不要在每次请求里新建 `AsyncClient`。同时必须设置连接超时、读取超时和总预算。只设置重试而没有超时，会把最坏等待时间成倍放大。

优化必须建立在测量之上。重点观察：

- P95 / P99 延迟；
- 错误率；
- 数据库连接数；
- 慢查询与 N+1；
- 外部服务超时；
- worker 数量与连接池是否匹配。

> [!TIP]
> `async def` 不是性能开关。如果接口 QPS 很低，先检查事件循环里是否混入了同步阻塞、N+1 查询或连接池耗尽。

### 6.2 第 8 章：数据库集成

生产项目应区分三层模型：

| 模型 | 作用 | 示例 |
| --- | --- | --- |
| SQLAlchemy ORM | 映射数据库表，负责持久化 | `UserDB`，可含密码哈希 |
| Pydantic 请求模型 | 校验客户端输入 | `UserCreate` |
| Pydantic 响应模型 | 控制对外字段 | `UserPublic`，不含密码 |

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

```python
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

会话生命周期与事务边界要分开理解：

- `get_db` 负责创建、异常回滚和关闭；
- service 或明确业务用例负责 `commit()`；
- 多个写操作属于同一业务动作时，必须放在同一个事务中；
- repository 不应偷偷对每个函数单独提交。

> [!CAUTION]
> 只做登录鉴权不够。资源查询必须把归属写进 `WHERE`：
>
> ```python
> stmt = select(Todo).where(
>     Todo.id == todo_id,
>     Todo.owner_id == current_user.id,
> )
> ```
>
> 查不到返回 404，而不是透露“资源存在但属于别人”。

ORM 最常见的性能陷阱是 N+1：

```python
stmt = select(User).options(selectinload(User.todos))
users = list(db.scalars(stmt).unique())
```

同步与异步数据库的选择：

| 场景 | 建议 |
| --- | --- |
| 普通 CRUD、现有生态是同步库 | 同步 SQLAlchemy + 普通 `def` 路由 |
| 高并发 I/O、全链路异步库 | `AsyncSession` + `async def` |
| async 路由里调用同步 ORM | 避免，会阻塞事件循环 |

> [!WARNING]
> `create_all()` 只适合开发或临时演示，生产表结构变更应交给 Alembic。SQLite 的多线程场景还需要 `check_same_thread=False`。

### 6.3 第 9 章：身份认证与授权

两个概念必须分开：

- **认证 Authentication**：确认“你是谁”；
- **授权 Authorization**：确认“你能做什么”。

密码永远只存哈希：

```python
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return password_hash.verify(plain, hashed)
```

JWT 只放最小声明：

```python
payload = {
    "sub": str(user_id),
    "iat": now,
    "exp": now + timedelta(minutes=30),
    "type": "access",
}
```

当前用户通过依赖注入进入业务函数：

```python
CurrentUser = Annotated[UserDB, Depends(get_current_user)]


@app.get("/users/me")
def read_me(current_user: CurrentUser):
    return current_user
```

> [!IMPORTANT]
> 每次请求从数据库读取当前用户，可以让账号禁用、删除或权限变化比 JWT 过期更早生效。JWT 中不要长期冻结邮箱、用户名、管理员标记等可变资料。

> [!CAUTION]
> JWT Payload 只是 Base64 编码，不是加密。任何人都能读取其中的内容，不能放密码、身份证号、银行卡等敏感信息。`SECRET_KEY` 必须来自环境变量或密钥管理服务。

> [!WARNING]
> 401 表示“未认证或凭据无效”，应带 `WWW-Authenticate: Bearer`；403 表示“已认证，但没有权限”。混用会让前端误判是否需要重新登录。

认证和授权要覆盖三个层次：

| 层次 | 问题 | 示例 |
| --- | --- | --- |
| 接口认证 | 是否登录 | 无 token 返回 401 |
| 角色授权 | 是否有功能权限 | 普通用户访问管理员接口返回 403 |
| 数据授权 | 是否有资源归属 | 查询带上 `owner_id`，否则返回 404 |

JWT 吊销的常见策略：

- 使用短有效期 access token；
- 用户表增加 `token_version`，改密码或强制下线时递增；
- Redis 黑名单保存 token 哈希，TTL 到 token 过期为止；
- refresh token 轮换，并用 `jti` 管理撤销状态。

### 6.4 第 10 章：WebSocket 与部署

HTTP 是一问一答；WebSocket 建立持久、双向长连接，适合聊天、实时通知和协作编辑。

```python
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"收到：{data}")
    except WebSocketDisconnect:
        print("客户端断开连接")
```

多连接广播通常由 `ConnectionManager` 管理，但必须理解它的边界：

> [!CAUTION]
> `ConnectionManager`、全局字典、模块级列表和 `lru_cache` 在多 worker 中各自拥有一份内存。WebSocket 广播、在线人数、限流计数和临时验证码不能只保存在进程内存里，多实例部署应使用 Redis、数据库或消息系统。

生产启动：

```bash
# 单进程 Uvicorn 示例
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Gunicorn + Uvicorn worker
uv add gunicorn
uv run gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

> [!WARNING]
> 生产环境关闭 `--reload`；反向代理必须正确转发 WebSocket 的 `Upgrade` 和 `Connection` 头；worker 数量乘上数据库连接池大小后不能超过数据库最大连接数。

上线前最小检查表：

- [ ] 密钥、数据库 URL 和其他配置全部来自环境变量或密钥服务；
- [ ] 生产关闭 `--reload`；
- [ ] 表结构通过 Alembic 迁移；
- [ ] 按安全策略关闭或保护 `/docs`、`/redoc`、`/openapi.json`；
- [ ] worker 数、连接池和数据库上限匹配；
- [ ] 可信代理后正确使用 `--proxy-headers`；
- [ ] 健康检查独立实现；
- [ ] 日志输出到 stdout，由平台统一收集和轮转；
- [ ] 发布前执行测试、迁移检查和关键路径验收。

文件上传属于按需扩展能力，但一旦实现，必须考虑：

- 不信任客户端文件名和 `Content-Type`；
- 使用 UUID 生成存储名，拒绝路径穿越；
- 限制文件大小，边读边累计；
- 上传目录禁止执行脚本；
- 生产优先使用 S3、OSS、COS 等对象存储；
- 下载同样要校验资源归属；
- 大文件使用分块上传和流式响应。

---

## 7. 实战项目的四次演进

> **演进原则：** 每个阶段只增加当前最需要的工程能力。先用最小代码证明业务可运行，再引入持久化、认证、后台任务和运维能力。

| 阶段 | 核心增量 | 对应知识 |
| --- | --- | --- |
| 阶段一 | 单文件、内存字典、Pydantic、完整 CRUD | 第 1–3 章 |
| 阶段二 | 多模块、SQLAlchemy、SQLite、Session 依赖 | 第 4、8 章 |
| 阶段三 | 用户注册登录、JWT、受保护路由、后台通知 | 第 6、9 章 |
| 阶段四 | 配置、限流、日志、健康检查、Docker、CI、测试 | 第 5、10 章 |

### 7.1 阶段一：单模块 CRUD

目标是让“商品管理 API”在单个文件中跑通：

- `POST /products/` 创建商品，返回 201；
- `GET /products/` 查询列表；
- `GET /products/{id}` 查询详情，不存在返回 404；
- `PUT /products/{id}` 全量更新；
- `DELETE /products/{id}` 删除，返回 204。

```python
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    stock: int = Field(0, ge=0)


class Product(ProductCreate):
    id: int
```

> [!WARNING]
> 内存字典重启即丢失，且无法在多进程间共享。它只适合阶段一的接口与状态码练习，不能用于真实持久化。

### 7.2 阶段二：多模块 + 数据库

从单文件拆为：

```text
app/
├── main.py          # 应用组装与路由挂载
├── database.py      # engine、SessionLocal、Base
├── models.py        # SQLAlchemy ORM
├── schemas.py       # Pydantic 请求/响应模型
├── deps.py          # get_db
└── routers/
    └── products.py  # HTTP 路由
```

阶段二的关键增量：

- 用 SQLite 持久化商品；
- 用 `get_db` 为每个请求提供独立 Session；
- 把 ORM 模型和 Pydantic Schema 分开；
- 用 `from_attributes=True` 从 ORM 对象构造响应；
- 用 `APIRouter` 和 `include_router` 拆分资源。

> [!CAUTION]
> `create_all()` 只适合开发建表。真实项目一旦有结构演进，必须使用 Alembic 迁移，避免生产数据库状态不可追踪。

### 7.3 阶段三：认证 + 后台任务

新增用户体系：

- 注册用户并哈希密码；
- 登录后签发 access token；
- 用 `get_current_user` 保护商品写接口；
- 下单后通过后台任务发送通知；
- 后台任务只接收邮箱、用户 ID 等标量。

```python
@router.post("/")
def create_order(
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    background_tasks.add_task(tasks.send_order_notification, user.email)
    return {"message": "订单已创建，通知邮件稍后发送"}
```

> [!IMPORTANT]
> 阶段三同时演示了依赖嵌套：`get_current_user` 依赖 `oauth2_scheme` 和 `get_db`。认证失败会在业务函数执行前中断请求。

> [!WARNING]
> `BackgroundTasks` 适合轻量通知。邮件量大、需要重试、审计或进度查询时，应升级为 Celery + Redis 等任务队列。

### 7.4 阶段四：企业级完善

阶段四补上上线前常见能力：

| 能力 | 示例 |
| --- | --- |
| 配置管理 | `pydantic-settings` 从 `.env` 和环境变量读取配置 |
| 限流 | `slowapi` 按 IP 限制请求频率 |
| 健康检查 | `/health` 返回服务状态 |
| 结构化日志 | 记录方法、路径、状态码和 request ID |
| 容器化 | 多阶段 `Dockerfile` + `uv sync --frozen` |
| CI | `setup-uv`、`uv sync --frozen`、`uv run pytest` |
| 测试 | 覆盖 401、422、404、201 和高价值成功路径 |

测试的重点不是覆盖率数字，而是守住主干：

- 未认证返回 401；
- 无效输入返回 422；
- 已登录但无权限返回 403；
- 访问他人资源返回 404；
- 成功创建返回 201；
- PATCH 只更新显式提交的字段；
- 后台任务不携带请求对象。

> [!TIP]
> 依赖覆盖可以让测试直接返回固定用户，不必在每次测试中执行完整认证流程。测试结束后必须清理 `app.dependency_overrides`，避免污染其他用例。

---

## 8. 核心纵切面：把主干串成一个 Todo 业务闭环

> **最重要的页面：** 核心纵切面不是第五个阶段，而是对前四阶段的“主干压缩复习”。它用 Todo 业务展示真实 API 最容易出问题的六个边界。

### 8.1 完整业务链

```text
注册登录
  → 获得 access token
  → 创建 Todo
  → 事务提交
  → 只查询自己的数据
  → 响应返回
  → 后台任务发送通知
  → 测试覆盖 401 / 422 / 404 / 201
```

六个关节：

| 环节 | 目标 |
| --- | --- |
| 请求契约 | 路由、参数、状态码和响应模型清晰 |
| 数据边界 | 输入/更新/输出模型分离 |
| 身份与依赖 | JWT、DB Session、当前用户注入 |
| 持久化事务 | repository 过滤归属，service 控制提交 |
| 异步边界 | 后台任务只收标量，自己创建会话 |
| 验收测试 | 覆盖认证、校验、越权和核心成功路径 |

### 8.2 推荐目录与依赖方向

```text
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

> [!IMPORTANT]
> 依赖方向保持 `router → service → repository → model`。路由只处理 HTTP；service 决定一次用例的事务；repository 只构造查询，不控制响应；model 只描述表结构。

### 8.3 先定契约，再写 SQL

```python
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

> [!TIP]
> `TodoCreate` 防止客户端提交 `id` 或 `owner_id`；`TodoUpdate` 全字段可选并禁止额外字段；`TodoPublic` 是响应白名单。

### 8.4 会话、事务与 ORM

```python
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

```python
def create_todo(db: Session, *, payload: TodoCreate, owner_id: int) -> Todo:
    todo = Todo(**payload.model_dump(), owner_id=owner_id)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo
```

> [!CAUTION]
> `get_db` 负责会话生命周期，不负责业务提交。一次业务用例涉及多张表时，应由同一个 service 统一 `commit()` 或 `rollback()`。

### 8.5 身份必须进入业务入参

```python
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
```

> [!WARNING]
> `OAuth2PasswordRequestForm` 读取的是 `application/x-www-form-urlencoded`，不是 JSON。自己实现登录页面时，应使用 `URLSearchParams` 或等价表单编码，否则会收到 422。

### 8.6 数据级授权：把 `owner_id` 写进 WHERE

```python
def get_owned(db: Session, *, todo_id: int, owner_id: int) -> Todo | None:
    stmt = select(Todo).where(
        Todo.id == todo_id,
        Todo.owner_id == owner_id,
    )
    return db.scalars(stmt).first()
```

> **防 IDOR 的关键：** 并不存在“先按 `id` 查出来，再判断 `owner_id`”的必要。归属条件直接进入查询，查不到统一返回 404，避免泄露资源是否存在。

列表查询同样必须限制归属：

```python
stmt = (
    select(Todo)
    .where(Todo.owner_id == owner_id)
    .order_by(Todo.created_at.desc())
    .offset(skip)
    .limit(limit)
)
```

### 8.7 路由保持薄

```python
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
    background_tasks.add_task(
        send_todo_created_notification,
        todo.id,
        current_user.email,
    )
    return todo
```

> [!IMPORTANT]
> `response_model=TodoPublic` 同时承担 OpenAPI 文档、响应过滤和字段白名单。即使 ORM 对象未来新增内部字段，也不会自动暴露。

### 8.8 后台任务只收标量

```python
def send_todo_created_notification(todo_id: int, email: str) -> None:
    db = SessionLocal()
    try:
        todo = db.get(Todo, todo_id)
        if todo is None:
            return
        logger.info("通知 %s：Todo %s 已创建", email, todo.title)
    finally:
        db.close()
```

> [!CAUTION]
> 把请求里的 `db`、`Request` 或 ORM 对象传给后台任务，不是“能跑就算对”。请求依赖结束时会话会关闭，连接可能被拖住，事务状态和对象生命周期都不可控。

### 8.9 高价值测试

至少覆盖：

```python
def test_create_todo_requires_login():
    response = client.post("/api/v1/todos", json={"title": "learn"})
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
    assert any(
        item["id"] == todo_id
        for item in auth_client.get("/api/v1/todos").json()
    )
```

> [!TIP]
> 真正需要单独测试的是未认证 401、无效输入 422、越权访问 404、创建成功 201、PATCH 只更新显式字段，以及后台任务不携带请求对象。不要一开始就追求覆盖率数字。

---

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
