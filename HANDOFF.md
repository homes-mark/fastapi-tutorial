# FastAPI 教程维护说明

> 供会话中断后接手使用。最后更新：2026-11-06。

## 1. 当前状态

- 当前教程正文：`FastAPI教程汇总.md`，约 3100 行，15 章，只讲 FastAPI。
- 已删除旧汇总中的项目速览、28 法则、章节地图、教程站点实现、学习建议、原始内容索引、来源说明和 HTML 页面链接。
- 每章按「概念 → 可运行代码 → 逐行解释 → 验证方法」组织。
- 第 13 章是一个完整可运行的 Todo API，包含注册、登录、JWT、数据库、归属过滤和后台任务；测试方法见第 11 章。
- `README.md` 已同步为新教程说明。
- 旧版多页面 HTML（`01-basics/`、`02-intermediate/`、`03-advanced/`、`04-project/`、`index.html`、`assets/`）仍保留，但未同步到新内容，不再作为当前教程入口。

## 2. 文档结构

| 章节 | 内容 |
| --- | --- |
| 1 | HTTP 基础、Python 语法补充、uv、第一个应用、自动文档 |
| 2 | 路由、路径/查询参数、`Query` / `Path`、路由顺序、`APIRouter` |
| 3 | 请求体与 Pydantic、字段约束、嵌套、模型分层、`response_model` |
| 4 | 依赖注入、`yield`、依赖缓存、类依赖、路由级依赖、测试替换 |
| 5 | `HTTPException`、自定义异常、422 结构、状态码 |
| 6 | 中间件、CORS、请求 ID |
| 7 | SQL 基础、SQLAlchemy 2.0、`get_db`、CRUD、事务、N+1、Alembic |
| 8 | 密码哈希、JWT、登录、`get_current_user`、`owner_id` 防越权 |
| 9 | 事件循环、`def` / `async def`、异步 HTTP 客户端、后台任务 |
| 10 | WebSocket 回显与广播 |
| 11 | 测试 |
| 12 | 部署 |
| 13 | 完整 Todo API |
| 14 | 常见报错 |
| 15 | 一页速查 |

## 3. 内容约定

1. **只保留 FastAPI 相关内容。** 不写教程站点实现、学习方法论、框架对比、来源说明和外部文章索引。
2. **概念必须可落地。** 每个新概念先解释它解决什么问题，再给代码；代码后必须有逐行解释。
3. **片段要标明前提。** 不能独立运行的代码片段，要说明它建立在前面哪段代码上；完整示例要能直接运行。
4. **版本基线：** Python 3.11+、FastAPI 最新版、Pydantic 2、SQLAlchemy 2.0、uv。
5. **安全示例：** 密码只存哈希；JWT 只放 `sub`、`exp`、`type` 等最小声明；响应模型必须过滤密码字段；资源查询必须带 `owner_id`。
6. **异步写法：** 只有真正异步的 I/O 才用 `async def`；同步库用普通 `def`，由 FastAPI 放入线程池。

## 4. 修改后怎么验证

### 4.1 检查 Python 代码块语法

~~~bash
python - <<'EOF'
import re, pathlib
text = pathlib.Path("FastAPI教程汇总.md").read_text(encoding="utf-8")
blocks = re.findall(r"```python\n(.*?)```", text, re.S)
bad = 0
for i, b in enumerate(blocks, 1):
    try:
        compile(b, f"block{i}", "exec")
    except SyntaxError as e:
        bad += 1
        print("SYNTAX ERROR block", i, e)
print("blocks:", len(blocks), "bad:", bad)
EOF
~~~

### 4.2 跑通第 13 章完整项目

把第 13 章各文件按目录结构写到临时目录，然后：

```bash
uv venv
uv pip install "fastapi[standard]" sqlalchemy "pwdlib[argon2]" PyJWT python-multipart pydantic-settings
```

用 `TestClient` 验证以下流程：

1. 注册返回 201，响应中不含 `hashed_password`；
2. 登录返回 200，拿到 `access_token`；
3. 不带 token 访问 `/todos` 返回 401；
4. 创建 Todo 返回 201；
5. 列表只返回当前用户的数据；
6. 另一个用户访问该 `todo_id` 返回 404；
7. PATCH 只传 `{"done": true}`，标题保持不变；
8. 空标题返回 422；
9. 删除返回 204；
10. `/openapi.json` 能正常生成。

### 4.3 检查 Markdown 结构

- 代码围栏数量为偶数；
- 标题层级连续；
- 不残留 `28 法则`、`来源说明`、`原始页面`、`学习目标` 等旧模板文字。

## 5. 已知限制

- 第 13 章使用同步 SQLAlchemy + SQLite，方便本地运行；高并发或异步数据库方案见第 7 章。
- 旧版 HTML 页面未同步。若以后要恢复多页面站点，需要从当前 Markdown 重新生成，而不是继续修改旧 HTML。
- 部署章节只给出最小可用配置，未覆盖 Kubernetes、CI/CD、监控和日志平台等完整运维体系。

## 6. 后续可做

- [ ] 为第 13 章补一份可直接运行的 `tests/` 目录。
- [ ] 增加 Alembic 的完整初始化示例（当前只有命令和说明）。
- [ ] 补充异步 SQLAlchemy 的完整 CRUD 示例。
- [ ] 如果确定放弃旧版 HTML，删除 `01-basics/`、`02-intermediate/`、`03-advanced/`、`04-project/`、`index.html` 和 `assets/`，避免两个版本并存。
