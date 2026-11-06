# FastAPI 实战教程

> 一份只讲 FastAPI 的中文教程。每一节按「概念 → 可运行代码 → 逐行解释 → 怎么验证」组织，不包含教程站点、学习方法论或框架对比等无关内容。

## 内容

| 章节 | 主题 |
| --- | --- |
| 1 | 开始之前：HTTP 基础、Python 语法补充、uv、第一个应用、自动文档 |
| 2 | 路由、路径参数、查询参数、`Query` / `Path`、路由顺序、`APIRouter` |
| 3 | 请求体与 Pydantic：模型、字段约束、嵌套、模型分层、`response_model` |
| 4 | 依赖注入：`Depends`、`yield` 清理、依赖缓存、类依赖、路由级依赖 |
| 5 | 错误处理：`HTTPException`、自定义异常、422 结构、状态码选择 |
| 6 | 中间件：计时、CORS、请求 ID、执行顺序 |
| 7 | 数据库：SQL 基础、SQLAlchemy 2.0、会话依赖、CRUD、事务、N+1、Alembic |
| 8 | 认证与授权：密码哈希、JWT、登录接口、`get_current_user`、防越权 |
| 9 | 异步与后台任务：事件循环、`def` / `async def` 选择、`BackgroundTasks` |
| 10 | WebSocket：回显、多连接广播、多进程限制 |
| 11 | 测试：`TestClient`、依赖替换、高价值测试路径 |
| 12 | 部署：Uvicorn / Gunicorn、Docker、上线检查 |
| 13 | 完整项目：从零跑通带认证和数据隔离的 Todo API |
| 14 | 常见报错与坑 |
| 15 | 一页速查 |

完整内容见 [FastAPI教程汇总.md](./FastAPI教程汇总.md)。

## 前置要求

- 会写基础 Python：函数、类、`if` / `for`；
- Python 3.11+；
- 使用 [uv](https://docs.astral.sh/uv/) 管理环境和依赖。

教程第 1 章会补充 HTTP、类型注解、装饰器、类继承和 `Annotated` 这些读 FastAPI 代码需要的基础；第 7 章会补充 SQL 的最小知识。不需要事先学过 Web 框架。

## 快速开始

```bash
uv init --app fastapi-demo
cd fastapi-demo
uv add "fastapi[standard]"
uv run fastapi dev main.py
```

服务启动后打开：

- `http://127.0.0.1:8000/docs`：Swagger UI，可直接调试接口；
- `http://127.0.0.1:8000/redoc`：ReDoc 文档；
- `http://127.0.0.1:8000/openapi.json`：OpenAPI 规范。

## 怎么读

1. 按章节顺序读，每章的代码都建立在前一章的基础上；
2. 每段代码先自己敲一遍，再看后面的逐行解释；
3. 用 `/docs` 或文中给出的 curl 命令实际调用接口；
4. 遇到 422 时读 `detail` 里的 `loc`，定位到具体字段；
5. 第 13 章把前面所有内容组装成一个可运行项目，建议完整跑一遍。

## 目录说明

```text
fastapi-tutorial/
├── README.md                  # 本文件
├── FastAPI教程汇总.md          # 当前教程正文
├── HANDOFF.md                 # 维护说明
├── 01-basics/ ... 04-project/ # 旧版多页面 HTML 教程（未同步）
├── index.html                 # 旧版教程首页
└── assets/                    # 旧版页面资源
```

当前以 `FastAPI教程汇总.md` 为准。`01-basics/`、`02-intermediate/`、`03-advanced/`、`04-project/`、`index.html` 和 `assets/` 是旧版多页面教程，仍保留但不再更新。

## 代码约定

- 依赖管理统一使用 uv：`pyproject.toml` 声明直接依赖，`uv.lock` 锁定完整版本；
- 示例基于 FastAPI 最新版、Pydantic 2、SQLAlchemy 2.0、`pwdlib` + PyJWT；
- 第 13 章的完整项目使用同步 SQLAlchemy + SQLite，便于本地直接运行；异步方案和 PostgreSQL 的取舍见第 7、12 章；
- 示例中的密钥、密码和数据库地址仅用于教学，实际部署必须通过环境变量或密钥管理服务注入。
