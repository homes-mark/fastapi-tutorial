# FastAPI 实战教程

> 这份教程只讲 FastAPI 本身。每一节都按「概念 → 可运行代码 → 逐行解释 → 怎么验证」组织。按章节顺序跟做时，每节的完整示例可以直接运行；标为「续」的片段要放在前文代码的基础上理解。

[TOC]

---

## 1. 开始之前

### 1.1 先补一课：HTTP 请求到底是什么

FastAPI 写的是「HTTP 接口」。不理解 HTTP，后面的路由、参数、状态码都会变成死记硬背。

一次 HTTP 请求由四部分组成：

```text
POST /todos?source=web HTTP/1.1        ← 方法 + 路径 + 查询字符串
Host: 127.0.0.1:8000                    ← 请求头（Header）
Content-Type: application/json

{"title": "写代码"}                     ← 请求体（Body）
```

服务器的响应也由三部分组成：

```text
HTTP/1.1 201 Created                    ← 状态码
Content-Type: application/json

{"id": 1, "title": "写代码", "done": false}   ← 响应体
```

#### 1.1.1 URL 里各部分的名字

以 `http://127.0.0.1:8000/todos/42?done=true` 为例：

| 部分 | 值 | 说明 |
| --- | --- | --- |
| 协议 + 主机 + 端口 | `http://127.0.0.1:8000` | 服务地址 |
| 路径（Path） | `/todos/42` | 标识资源，`42` 是路径参数 |
| 查询字符串（Query） | `?done=true` | 附加筛选条件，`done` 是查询参数 |

请求体不在 URL 里，它藏在请求报文最后，通常是 JSON。

#### 1.1.2 五种常用 HTTP 方法

| 方法 | 语义 | 例子 | 成功状态码 |
| --- | --- | --- | --- |
| GET | 读取资源 | `GET /todos` | 200 |
| POST | 创建资源 | `POST /todos` | 201 |
| PUT | 整体替换资源 | `PUT /todos/1` | 200 |
| PATCH | 局部修改资源 | `PATCH /todos/1` | 200 |
| DELETE | 删除资源 | `DELETE /todos/1` | 204 |

GET 和 DELETE 通常不带请求体；POST、PUT、PATCH 通常带 JSON 请求体。

#### 1.1.3 需要记住的状态码

| 状态码 | 含义 | 什么时候用 |
| --- | --- | --- |
| 200 | 成功 | 查询、更新成功 |
| 201 | 已创建 | POST 创建成功 |
| 204 | 成功但无内容 | DELETE 成功 |
| 400 | 请求本身有问题 | 业务规则不满足，如用户名已存在 |
| 401 | 未认证 | 没带 token、token 无效或过期 |
| 403 | 已认证但无权限 | 登录了，但不能操作别人的资源 |
| 404 | 资源不存在 | 按 id 查不到 |
| 422 | 参数校验失败 | 类型不对、缺必填字段、超出范围 |
| 500 | 服务器内部错误 | 代码抛了未处理的异常 |

> 401 和 403 的区别：401 是「我不知道你是谁」，403 是「我知道你是谁，但你不能做这件事」。

#### 1.1.4 JSON 是什么

JSON 就是键值对，值可以是字符串、数字、布尔、数组、对象或 `null`：

```json
{
  "title": "写代码",
  "done": false,
  "tags": ["后端", "Python"],
  "owner": {"id": 1, "name": "hu"}
}
```

FastAPI 的请求体和响应体默认都是 JSON。Python 的 `dict`、`list`、`str`、`int`、`bool`、`None` 可以直接返回，FastAPI 会自动转成 JSON。

---

### 1.2 先补一课：读 FastAPI 代码需要的 Python 语法

FastAPI 的代码看起来「不像普通 Python」，主要因为大量使用了类型注解、装饰器和类继承。这里各用一个小例子说明。

#### 1.2.1 类型注解

```python
name: str = "hu"
age: int = 18
tags: list[str] = ["后端"]
address: str | None = None   # 可能是字符串，也可能是 None
```

冒号后面的 `str`、`int`、`list[str]` 是类型注解。Python 运行时不会因为注解而报错，但 FastAPI 和 Pydantic 会读取这些注解，自动完成：

- 请求参数的类型转换（`"42"` → `42`）；
- 数据校验（`"abc"` 不能转成 `int`，返回 422）；
- 自动生成 API 文档。

#### 1.2.2 装饰器

```python
@app.get("/")
def read_root():
    return {"message": "hello"}
```

`@app.get("/")` 是装饰器，等价于：

```python
def read_root():
    return {"message": "hello"}

read_root = app.get("/")(read_root)
```

它的作用是「把这个函数登记到 `app` 上，并声明：当有人用 GET 访问 `/` 时，调用这个函数」。你不需要手动调用 `read_root()`，FastAPI 会在收到请求时调用它。

#### 1.2.3 类与继承

```python
class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str
```

`UserCreate` 继承 `UserBase`，因此自动拥有 `username` 和 `email` 两个字段，再额外加上 `password`。Pydantic 模型的分层就是靠继承复用的。

#### 1.2.4 `Annotated`

```python
from typing import Annotated
from fastapi import Query

q: Annotated[str | None, Query(min_length=3)] = None
```

`Annotated[类型, 额外信息]` 表示「类型是 `str | None`，同时附带 `Query(...)` 这份元数据」。FastAPI 会读取元数据来做校验，类型检查器仍然把变量当成 `str | None`。可以把它理解成「给类型贴了一张说明纸条」。

---

### 1.3 安装与创建项目

本教程统一使用 [uv](https://docs.astral.sh/uv/) 管理 Python 版本、虚拟环境和依赖。

```bash
# 安装 uv（Windows PowerShell）
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

创建项目并安装 FastAPI：

```bash
uv init --app fastapi-demo
cd fastapi-demo
uv add "fastapi[standard]"
```

`uv` 会自动创建 `.venv` 虚拟环境、`pyproject.toml` 和 `uv.lock`。之后所有命令都用 `uv run` 开头，不需要手动激活虚拟环境，也不要在项目里执行 `pip install`。

| 文件 | 作用 | 是否提交 Git |
| --- | --- | --- |
| `pyproject.toml` | 声明直接依赖和项目信息 | 是 |
| `uv.lock` | 锁定所有依赖的精确版本 | 是 |
| `.venv/` | 本地虚拟环境 | 否 |

---

### 1.4 第一个 FastAPI 应用

新建 `main.py`：

```python
from fastapi import FastAPI

app = FastAPI(title="我的第一个 API", version="0.1.0")


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}
```

逐行解释：

- `from fastapi import FastAPI`：导入 FastAPI 的核心类；
- `app = FastAPI(...)`：创建应用实例。后面所有路由、中间件、异常处理都挂在 `app` 上。`title` 和 `version` 只影响文档展示，可以不写；
- `@app.get("/")`：声明「GET 请求 `/` 路径」由下面的函数处理；
- `def read_root()`：路径操作函数。函数名随意，但不要和别的路由重名；
- `return {"message": ...}`：返回一个 `dict`，FastAPI 自动转成 JSON 响应，状态码默认 200。

启动开发服务器：

```bash
uv run fastapi dev main.py
```

看到 `Uvicorn running on http://127.0.0.1:8000` 就成功了。也可以使用更底层的 Uvicorn 命令：

```bash
uv run uvicorn main:app --reload
```

`main` 是文件名（不含 `.py`），`app` 是文件里的变量名。如果你的文件叫 `server.py`、变量叫 `api`，就要写成 `server:api`。这是初学者启动失败最常见的原因。

---

### 1.5 自动生成的接口文档

服务启动后，直接打开：

| 地址 | 内容 |
| --- | --- |
| `http://127.0.0.1:8000/docs` | Swagger UI，可以点「Try it out」直接发请求 |
| `http://127.0.0.1:8000/redoc` | ReDoc，更适合阅读 |
| `http://127.0.0.1:8000/openapi.json` | OpenAPI 规范，机器可读 |

这些文档不是手写的，而是 FastAPI 根据你的路径、参数类型和 Pydantic 模型自动生成的。你后面每加一个参数、每加一条 `Field(description=...)`，文档都会同步变化。

**验证**：浏览器访问 `http://127.0.0.1:8000/`，应看到 `{"message":"Hello, FastAPI!"}`；访问 `/docs`，应看到 `GET /` 这一条接口。

---

## 2. 路由、路径参数与查询参数

### 2.1 路由的基本写法

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/ping")
def ping():
    return {"status": "ok"}


@app.post("/echo")
def echo():
    return {"method": "POST"}
```

- `@app.get`、`@app.post`、`@app.put`、`@app.patch`、`@app.delete` 分别对应五种 HTTP 方法；
- 同一个路径可以用不同方法注册不同函数；
- 路径必须以 `/` 开头。

### 2.2 路径参数

```python
@app.get("/items/{item_id}")
def read_item(item_id: int):
    return {"item_id": item_id, "type": type(item_id).__name__}
```

访问 `/items/42`，返回：

```json
{"item_id": 42, "type": "int"}
```

解释：

- `{item_id}` 是路径参数的占位符；
- 函数参数 `item_id` 的名字必须和占位符一致；
- URL 里的 `42` 本来是字符串，FastAPI 根据注解 `int` 自动转成整数；
- 访问 `/items/abc` 会返回 **422**，因为 `abc` 不能转成 `int`。错误响应里会指出出错位置是 `path.item_id`。

路径参数也可以是 `str`、`float`、`bool`、`uuid.UUID` 等类型，FastAPI 都会尝试转换。

### 2.3 查询参数

没有出现在路径占位符里、又有默认值（或没有默认值）的普通参数，会被 FastAPI 当成查询参数：

```python
@app.get("/items")
def list_items(page: int = 1, size: int = 10, keyword: str | None = None):
    return {"page": page, "size": size, "keyword": keyword}
```

访问 `/items?page=2&size=5&keyword=手机` 返回：

```json
{"page": 2, "size": 5, "keyword": "手机"}
```

规则：

| 写法 | 含义 |
| --- | --- |
| `page: int` | 必填查询参数，不传返回 422 |
| `page: int = 1` | 可选查询参数，不传时用默认值 1 |
| `keyword: str \| None = None` | 可选，不传时是 `None` |
| `keyword: str \| None` | **仍然必填**，只是值允许为 `None`（几乎不用） |

> `str | None = None` 里，`| None` 表示类型允许空，`= None` 才表示这个参数可以不传。两个都要有，缺一不可。

Python 要求「有默认值的参数」放在「没有默认值的参数」后面，所以写多个参数时顺序要注意：

```python
# 正确：有默认值的参数放在后面
def list_items(page: int, size: int = 10): ...

# 语法错误：无默认值的参数不能放在有默认值的参数后面
# def list_items(page: int = 1, size: int): ...
```

### 2.4 用 `Query` 和 `Path` 做精细校验

只写类型注解，能校验「是不是整数」，但不能限制「必须大于等于 1」。这时用 `Query` / `Path`：

```python
from typing import Annotated
from fastapi import FastAPI, Path, Query

app = FastAPI()


@app.get("/items/{item_id}")
def read_item(
    item_id: Annotated[int, Path(ge=1, le=1000, description="商品 ID")],
    q: Annotated[str | None, Query(min_length=1, max_length=50)] = None,
):
    return {"item_id": item_id, "q": q}
```

常用约束：

| 参数 | 适用类型 | 含义 |
| --- | --- | --- |
| `ge=1` | 数字 | 大于等于 1 |
| `gt=0` | 数字 | 大于 0 |
| `le=100` | 数字 | 小于等于 100 |
| `lt=100` | 数字 | 小于 100 |
| `min_length=1` | 字符串 | 最少 1 个字符 |
| `max_length=50` | 字符串 | 最多 50 个字符 |
| `pattern=r"^[A-Z]{2}-\d{4}$"` | 字符串 | 正则匹配 |
| `description="..."` | 任意 | 显示在 `/docs` 里 |

这些约束会自动出现在文档里；不满足时返回 422，并在 `detail` 里说明原因。

### 2.5 路由匹配顺序（很重要）

FastAPI 按**声明顺序**从上到下匹配路由。固定路径必须写在动态路径前面：

```python
@app.get("/users/me")          # 先声明
def read_me():
    return {"id": "me"}


@app.get("/users/{user_id}")   # 后声明
def read_user(user_id: str):
    return {"id": user_id}
```

如果顺序反过来，访问 `/users/me` 会先匹配到 `/users/{user_id}`，`me` 被当成 `user_id`。更糟的是，如果 `user_id` 注解是 `int`，`me` 转不成整数，会直接返回 422。

同理，`/todos/summary` 要写在 `/todos/{todo_id}` 前面。

### 2.6 状态码

FastAPI 默认返回 200。创建资源应返回 201，删除成功应返回 204：

```python
from fastapi import FastAPI, status

app = FastAPI()


@app.post("/todos", status_code=status.HTTP_201_CREATED)
def create_todo():
    return {"id": 1}


@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int):
    return None
```

`status.HTTP_201_CREATED` 就是数字 `201`，用常量是为了可读性。204 响应不能带响应体，所以函数返回 `None`。

### 2.7 用 `APIRouter` 拆分项目

所有路由都写在 `main.py` 里，文件会越来越长。`APIRouter` 可以把一组相关接口拆到单独文件中。

**项目结构：**

```text
fastapi-demo/
├── main.py
└── routers/
    ├── __init__.py
    └── todos.py
```

`routers/__init__.py` 可以是空文件，它的作用是让 Python 把 `routers` 当成一个包。

**routers/todos.py：**

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

**main.py：**

```python
from fastapi import FastAPI

from routers import todos

app = FastAPI(title="Todo API")
app.include_router(todos.router)
```

逐行解释：

- `APIRouter(prefix="/todos")`：这个路由器下的所有路径都自动加上 `/todos` 前缀；
- `tags=["todos"]`：在 `/docs` 中把接口归到 `todos` 分组；
- `@router.get("")` 和 `prefix="/todos"` 组合成 `/todos`；
- 如果写成 `@router.get("/")`，组合结果是 `/todos/`，客户端访问 `/todos` 会收到 307 重定向；
- `app.include_router(todos.router)`：把路由器挂到应用上，不挂就不会生效；
- `raise HTTPException(status_code=404, detail="Todo not found")`：主动返回 404，`detail` 会成为响应体里的 `detail` 字段。

**导入为什么能成功：** 在项目根目录执行 `uv run fastapi dev main.py` 时，Python 会把当前目录加入模块搜索路径，所以 `from routers import todos` 能找到根目录下的 `routers/` 包。如果你的代码放在 `src/` 目录下，要么把启动命令的工作目录切到 `src`，要么使用 `from src.routers import todos`，并保证 `src` 下有 `__init__.py`。导入路径和实际目录对不上，是另一类高频报错。

### 2.8 用 curl 验证

服务启动后，另开一个终端：

```bash
# 列表
curl -s http://127.0.0.1:8000/todos

# 创建
curl -s -X POST http://127.0.0.1:8000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"学习 FastAPI"}'

# 详情
curl -s http://127.0.0.1:8000/todos/1

# 不存在的 id，应返回 404
curl -s -i http://127.0.0.1:8000/todos/999

# 标题为空，应返回 422
curl -s -i -X POST http://127.0.0.1:8000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":""}'
```

`-i` 会额外显示响应头，可以看到状态码。`-s` 只是去掉 curl 的进度信息。

---

## 3. 请求体与 Pydantic

### 3.1 请求体是什么

GET 请求的参数放在 URL 里，但创建、修改资源时数据往往比较多（标题、价格、库存、地址……），放在 URL 里既不安全也不方便。这些数据放在请求体里，通常是 JSON。

FastAPI 不会让你手动解析 JSON。你把请求体声明成一个 Pydantic 模型，FastAPI 会自动完成：

1. 读取请求体；
2. 解析 JSON；
3. 校验字段类型和约束；
4. 转换成模型对象；
5. 校验失败时返回 422。

### 3.2 第一个 Pydantic 模型

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = False


@app.post("/items")
def create_item(item: Item):
    return {
        "name": item.name,
        "price": item.price,
        "is_offer": item.is_offer,
    }
```

请求：

```bash
curl -X POST http://127.0.0.1:8000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"键盘","price":299.0}'
```

响应：

```json
{"name":"键盘","price":299.0,"is_offer":false}
```

逐行解释：

- `class Item(BaseModel)`：定义一个 Pydantic 模型，继承 `BaseModel`；
- `name: str`：必填字段，必须是字符串；
- `price: float`：必填字段，必须是数字；
- `is_offer: bool = False`：有默认值，因此可以不传；
- `item: Item`：FastAPI 看到参数类型是 Pydantic 模型，就知道它来自请求体，而不是查询参数；
- `item.name`：访问的是校验后的属性，不是原始 JSON。

Pydantic 做了三件事：

| 能力 | 例子 |
| --- | --- |
| 校验 | `{"price": "abc"}` → 422 |
| 转换 | `{"price": "299"}` → `299.0` |
| 序列化 | 模型对象 → `dict` / JSON |

### 3.3 校验失败时返回什么

把 `price` 传成 `"abc"`：

```bash
curl -i -X POST http://127.0.0.1:8000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"键盘","price":"abc"}'
```

返回 422，响应体类似：

```json
{
  "detail": [
    {
      "type": "float_parsing",
      "loc": ["body", "price"],
      "msg": "Input should be a valid number, unable to parse string as a number",
      "input": "abc"
    }
  ]
}
```

- `loc`：出错位置。`["body", "price"]` 表示请求体里的 `price` 字段；
- `msg`：人类可读的原因；
- `type`：机器可读的错误类型。

前端联调时，直接根据 `loc` 把错误显示到对应输入框即可。

### 3.4 用 `Field` 加约束

```python
from pydantic import BaseModel, Field


class Product(BaseModel):
    name: str = Field(min_length=1, max_length=100, description="商品名")
    price: float = Field(gt=0, description="价格，必须大于 0")
    stock: int = Field(default=0, ge=0, description="库存，不能为负")
    sku: str = Field(pattern=r"^[A-Z]{2}-\d{4}$", description="SKU 编码")
```

| 写法 | 含义 |
| --- | --- |
| `Field(gt=0)` | 必须大于 0 |
| `Field(ge=0)` | 必须大于等于 0 |
| `Field(default=0, ge=0)` | 默认 0，且不能为负 |
| `Field(min_length=1, max_length=100)` | 字符串长度范围 |
| `Field(pattern=r"...")` | 正则匹配 |
| `Field(description="...")` | 显示在文档里 |
| `Field(examples=["AB-1234"])` | 文档示例 |

> `Field(...)` 里的 `...`（Ellipsis）表示「必填」。现在更推荐直接不写默认值：`name: str = Field(min_length=1)` 同样是必填。

### 3.5 嵌套模型、可选模型和可变默认值

```python
from pydantic import BaseModel, Field


class Address(BaseModel):
    city: str
    street: str


class User(BaseModel):
    name: str
    age: int
    tags: list[str] = Field(default_factory=list)
    address: Address | None = None


@app.post("/users")
def create_user(user: User):
    city = user.address.city if user.address else None
    return {"user": user, "city": city}
```

请求：

```json
{
  "name": "hu",
  "age": 18,
  "tags": ["后端"],
  "address": {"city": "杭州", "street": "文一西路"}
}
```

解释：

- `Address` 是一个模型，`User.address` 的类型是 `Address | None`，表示可以传嵌套对象，也可以不传；
- 嵌套对象里的字段同样会被校验，`address.city` 缺失会返回 422；
- `tags: list[str] = Field(default_factory=list)`：每次创建模型实例时调用一次 `list()`，得到一个全新的空列表；
- **不要写 `tags: list[str] = []`**。Python 的可变默认值会在所有实例之间共享，一个实例 `append` 会影响另一个实例。`default_factory` 专门解决这个问题；
- `user.address.city if user.address else None`：因为 `address` 可能是 `None`，访问 `.city` 前要先判断，否则会抛 `AttributeError`。

### 3.6 同一个实体的四套模型

一个用户在不同场景下的字段是不一样的：

- 注册时：需要用户名、邮箱、密码；
- 更新时：所有字段都可选，且不允许客户端传额外字段；
- 数据库里：包含密码哈希、是否激活等内部字段；
- 返回给前端时：只暴露 id、用户名、邮箱、是否激活，绝不能带密码哈希。

因此不要用一个模型走天下，按边界拆开：

```python
from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    email: str


class UserCreate(UserBase):
    """注册请求：在基础字段上增加密码"""
    password: str = Field(min_length=8, max_length=64)


class UserUpdate(BaseModel):
    """局部更新：所有字段可选，禁止额外字段"""
    username: str | None = Field(default=None, min_length=3, max_length=20)
    email: str | None = None

    model_config = ConfigDict(extra="forbid")


class UserPublic(UserBase):
    """对外响应：只暴露允许前端看到的字段"""
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
```

逐个说明：

| 模型 | 用途 | 关键点 |
| --- | --- | --- |
| `UserBase` | 公共字段 | 被其他模型继承，避免重复写 `username` / `email` |
| `UserCreate` | POST 注册 | 有 `password`；没有 `id`，客户端不能自己指定 id |
| `UserUpdate` | PATCH 更新 | 字段全部可选；`extra="forbid"` 表示传了未声明字段就返回 422 |
| `UserPublic` | 响应 | 有 `id`、`is_active`；没有 `password`、`hashed_password` |

`ConfigDict` 常用配置：

| 配置 | 作用 |
| --- | --- |
| `extra="forbid"` | 请求里出现模型没声明的字段 → 422 |
| `extra="ignore"` | 忽略多余字段（默认行为） |
| `from_attributes=True` | 允许从对象属性读取数据，常用于 ORM 对象转响应 |
| `str_strip_whitespace=True` | 自动去掉字符串首尾空格 |

> `UserInDB` 这类「内部模型」不是必须定义的。很多项目直接用 SQLAlchemy 的 ORM 对象当内部数据，只在返回时用 `UserPublic` 过滤。关键是**响应模型里绝不能出现密码哈希字段**。

### 3.7 局部更新：`exclude_unset` 的用法

PATCH 的语义是「只修改客户端传了的字段」。如果直接 `payload.model_dump()`，没传的字段会得到 `None`，从而把原值覆盖掉。

```python
@app.patch("/users/{user_id}", response_model=UserPublic)
def update_user(user_id: int, payload: UserUpdate):
    user = get_user_or_404(user_id)

    # 只取客户端显式传了的字段
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    return user
```

> 这里的 `get_user_or_404` 是示意函数，作用是「按 id 查用户，查不到抛 404」。第 4 章会把它改写成依赖，第 7 章会换成真正的数据库查询。

假设原用户是 `{"username": "hu", "email": "a@b.com"}`，客户端只传 `{"email": "new@b.com"}`：

- `payload.model_dump()` → `{"username": None, "email": "new@b.com"}`，会把 `username` 清空；
- `payload.model_dump(exclude_unset=True)` → `{"email": "new@b.com"}`，只改邮箱。

`setattr(user, field, value)` 等价于 `user.email = value`，只是字段名来自变量。

### 3.8 `response_model` 是响应白名单

请求模型控制「客户端能传什么」，响应模型控制「服务端能返回什么」。即使内部对象里有敏感字段，只要 `response_model` 没声明，它就不会出现在响应里。

```python
@app.get("/users/{user_id}", response_model=UserPublic)
def get_user(user_id: int):
    # 假设这个对象里有 hashed_password 等内部字段
    return load_user_from_db(user_id)
```

FastAPI 会按 `UserPublic` 的字段重新构造响应，`hashed_password` 被丢弃。

列表接口也可以指定：

```python
@app.get("/users", response_model=list[UserPublic])
def list_users():
    return load_all_users()
```

`from_attributes=True` 让 Pydantic 能从对象的属性读取字段，而不要求对象是 `dict`。从数据库查出来的 ORM 对象通常需要这个配置。

> 注意：`response_model` 的字段如果在返回对象里不存在，启动时不一定报错，只有真实请求序列化时才可能返回 500。改完响应模型后要实际调用一次接口验证。

### 3.9 一次请求里同时有路径、查询和请求体

```python
@app.put("/users/{user_id}")
def update_user(
    user_id: int,                  # 路径参数
    payload: UserUpdate,           # 请求体（Pydantic 模型）
    notify: bool = False,          # 查询参数
):
    return {"user_id": user_id, "payload": payload, "notify": notify}
```

FastAPI 的推断规则：

- 名字出现在路径 `{}` 里 → 路径参数；
- 类型是 Pydantic 模型 → 请求体；
- 其他普通参数 → 查询参数。

### 3.10 验证清单

1. POST 时少传 `name`，应返回 422，`loc` 指向 `body.name`；
2. 把 `price` 传成字符串 `"299"`，应成功并转成数字；
3. 把 `price` 传成 `"abc"`，应返回 422；
4. PATCH 只传 `email`，确认 `username` 没被清空；
5. 用 `response_model=UserPublic` 时，响应里不应出现密码字段。

---

## 4. 依赖注入（Depends）

### 4.1 为什么需要依赖注入

假设多个接口都要做同一件事：从请求头里取 API Key 并校验。

```python
SECRET = "my-secret-key"


@app.get("/a")
def endpoint_a(api_key: str = Header(default="")):
    if api_key != SECRET:
        raise HTTPException(401, "Invalid API Key")
    return {"endpoint": "a"}


@app.get("/b")
def endpoint_b(api_key: str = Header(default="")):
    if api_key != SECRET:                 # 重复
        raise HTTPException(401, "Invalid API Key")
    return {"endpoint": "b"}
```

同样的校验代码复制了两遍，改规则要改 N 处，还容易漏。依赖注入把这段公共逻辑抽成一个函数，让 FastAPI 在调用路由前自动执行，并把返回值传进来。

### 4.2 第一个依赖

```python
from typing import Annotated
from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()
SECRET = "my-secret-key"


def verify_api_key(api_key: Annotated[str | None, Header()] = None):
    if api_key != SECRET:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return {"client": "trusted"}


@app.get("/a")
def endpoint_a(auth: Annotated[dict, Depends(verify_api_key)]):
    return {"endpoint": "a", "auth": auth}


@app.get("/b")
def endpoint_b(auth: Annotated[dict, Depends(verify_api_key)]):
    return {"endpoint": "b", "auth": auth}
```

解释：

- `Depends(verify_api_key)` 告诉 FastAPI：「执行这个路由前，先调用 `verify_api_key`，把返回值作为 `auth` 传进来」；
- `verify_api_key` 自己也可以声明参数，比如 `Header()` 会把请求头 `api-key` 传给它；
- 依赖里 `raise HTTPException` 时，路由函数**根本不会执行**，请求直接返回 401；
- 依赖可以返回值、`dict`、数据库会话、当前用户对象等。

`Header()` 会把参数名 `api_key` 自动转成请求头 `api-key`（下划线转连字符）。

### 4.3 `yield` 依赖：请求结束后做清理

有时候依赖需要「打开资源 → 交给路由使用 → 请求结束后关闭」。用 `yield` 代替 `return`：

```python
from typing import Annotated
from fastapi import Depends, FastAPI

app = FastAPI()


def get_db():
    db = {"connection": "active"}
    print("打开资源")
    try:
        yield db                 # 把 db 交给路由
    except Exception:
        print("业务异常，回滚")
        raise
    finally:
        print("关闭资源")         # 无论成功还是异常都会执行


@app.get("/data")
def read_data(db: Annotated[dict, Depends(get_db)]):
    return {"db": db}
```

执行顺序：

1. 请求进入 → 执行 `yield` 之前的代码，得到 `db`；
2. 调用路由函数，把 `db` 传进去；
3. 路由返回响应后 → 回到依赖，执行 `yield` 之后的代码。

`try/except/finally` 的价值：

- 业务抛异常时，`except` 里可以回滚事务，再把异常重新抛出；
- `finally` 无论如何都会执行，用来关闭连接，避免资源泄漏。

> `yield` 依赖结束后只保证资源被清理，**不保证事务已提交**。提交要由业务代码显式 `commit()`。

### 4.4 依赖缓存

同一次请求中，如果多个依赖都依赖同一个函数，FastAPI 默认只调用一次，复用结果：

```python
def get_db():
    print("只打印一次")
    yield {}


@app.get("/a")
def a(
    db1: Annotated[dict, Depends(get_db)],
    db2: Annotated[dict, Depends(get_db)],
):
    return {"same": db1 is db2}   # True
```

这避免了一个请求里重复创建数据库连接。如果确实需要每次重新执行，可以写 `Depends(get_db, use_cache=False)`。

### 4.5 类依赖

依赖也可以是一个类，FastAPI 会实例化它：

```python
class Pagination:
    def __init__(self, skip: int = 0, limit: int = 20):
        self.skip = skip
        self.limit = limit


@app.get("/items")
def list_items(pagination: Annotated[Pagination, Depends()]):
    return {"skip": pagination.skip, "limit": pagination.limit}
```

`Depends()` 不传参数时，FastAPI 会实例化类型注解里的类，并把 `skip`、`limit` 当成查询参数解析。适合把一组相关参数打包成一个对象。

### 4.6 路由级依赖：整组接口统一认证

如果一组接口都需要登录，逐个函数加 `Depends` 容易漏。可以把依赖挂到路由器上：

```python
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


@router.get("/stats")
def stats():
    # 能进入这里，说明 require_admin 已经通过
    return {"users": 100}
```

`dependencies=[...]` 只负责执行依赖，不把返回值传给路由函数。需要用到返回值（比如当前用户）时，仍然要在函数参数里写 `Depends`。

### 4.7 在测试中替换依赖

依赖注入的另一个价值是测试时可以替换真实依赖：

```python
from fastapi.testclient import TestClient

from main import app
from deps import get_current_user


def fake_current_user():
    return {"id": 1, "username": "tester"}


app.dependency_overrides[get_current_user] = fake_current_user
client = TestClient(app)


def test_todos():
    response = client.get("/todos")
    assert response.status_code == 200
    app.dependency_overrides.clear()
```

`dependency_overrides` 的 key 是原始依赖函数，value 是替代函数。测试结束要清理，避免影响其他用例。

### 4.8 一个常用的 404 依赖

把「查资源，查不到就 404」也做成依赖，路由会更薄：

```python
from typing import Annotated
from fastapi import Depends, HTTPException, Path

TODO_DB = {1: {"id": 1, "title": "学习"}}


def get_todo_or_404(todo_id: Annotated[int, Path(ge=1)]) -> dict:
    todo = TODO_DB.get(todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@app.get("/todos/{todo_id}")
def read_todo(todo: Annotated[dict, Depends(get_todo_or_404)]):
    return todo
```

依赖里声明的 `todo_id` 会由 FastAPI 从路径中解析；`get_todo_or_404` 的返回值被注入到 `todo` 参数。

---

## 5. 错误处理

### 5.1 `HTTPException`

在路由里主动返回错误，用 `HTTPException`：

```python
from fastapi import FastAPI, HTTPException, status

app = FastAPI()


@app.get("/todos/{todo_id}")
def get_todo(todo_id: int):
    if todo_id != 1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    return {"id": 1, "title": "学习"}
```

响应：

```json
{"detail": "Todo not found"}
```

`HTTPException` 的三个常用参数：

| 参数 | 作用 |
| --- | --- |
| `status_code` | HTTP 状态码 |
| `detail` | 返回给客户端的说明，可以是字符串、列表或字典 |
| `headers` | 额外响应头，例如 401 时常带 `{"WWW-Authenticate": "Bearer"}` |

### 5.2 业务异常统一转换

项目变大后，业务层不应直接依赖 FastAPI 的 `HTTPException`。可以定义自己的异常，再统一转换成 HTTP 响应：

```python
from fastapi.responses import JSONResponse


class NotFoundError(Exception):
    def __init__(self, resource: str, resource_id: int):
        self.resource = resource
        self.resource_id = resource_id


@app.exception_handler(NotFoundError)
async def not_found_handler(request, exc: NotFoundError):
    return JSONResponse(
        status_code=404,
        content={"detail": f"{exc.resource} {exc.resource_id} 不存在"},
    )
```

这样 service 层只 `raise NotFoundError("Todo", todo_id)`，不需要知道 HTTP 状态码。

### 5.3 自定义 422 错误结构

FastAPI 默认的 422 结构 `detail` 是数组，前端解析起来比较麻烦。可以统一成固定格式：

```python
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        location = error["loc"]
        errors.append({
            "field": ".".join(str(part) for part in location[1:]),
            "reason": error["msg"],
        })
    return JSONResponse(
        status_code=422,
        content={"code": "VALIDATION_ERROR", "errors": errors},
    )
```

`location[0]` 通常是 `body`、`query` 或 `path`，表示参数来源；从 `[1:]` 开始才是字段路径。

### 5.4 状态码怎么选

| 场景 | 状态码 |
| --- | --- |
| 创建成功 | 201 |
| 删除成功且无内容 | 204 |
| 请求格式、字段校验失败 | 422（FastAPI 自动） |
| 业务规则不满足（用户名已存在） | 400 |
| 没登录、token 无效 | 401 |
| 登录了但无权限 | 403 |
| 资源不存在 | 404 |
| 代码异常 | 500（不要手动抛，让它自然发生并记录日志） |

> 不要把所有错误都返回 400。前端需要根据状态码决定是「重新登录」「提示无权限」还是「显示表单错误」。

---

## 6. 中间件

### 6.1 中间件在什么位置

```text
请求 → 中间件1 → 中间件2 → 路由函数 → 中间件2 → 中间件1 → 响应
```

中间件包裹所有请求，适合做全局性的横切逻辑：日志、耗时统计、CORS、请求 ID。它和依赖注入的区别：

| | 中间件 | 依赖注入 |
| --- | --- | --- |
| 作用范围 | 所有请求 | 只有声明了 `Depends` 的路由 |
| 能否拿到路由参数 | 不能 | 能 |
| 适合 | 日志、计时、CORS、请求 ID | 认证、数据库会话、业务校验 |

### 6.2 计时中间件

```python
import time

from fastapi import FastAPI, Request

app = FastAPI()


@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.4f}"
    return response


@app.get("/")
def read_root():
    return {"message": "hello"}
```

解释：

- 中间件函数必须是 `async def`；
- `call_next(request)` 把请求交给后面的中间件或路由，返回响应对象；
- `call_next` 之前的代码在请求进入时执行，之后的代码在响应返回时执行；
- 必须 `return response`，否则客户端收不到响应；
- 这里给响应加了一个自定义头 `X-Process-Time`。

用 `curl -i` 可以看到响应头里的耗时。

### 6.3 CORS 跨域

前端在 `http://localhost:3000`，后端在 `http://localhost:8000`，浏览器会拦截跨域请求。用内置的 CORS 中间件放行：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- `allow_origins`：允许的前端来源，生产环境要写具体域名，不要图省事写 `["*"]`；
- `allow_credentials=True` 时，`allow_origins` 不能是 `["*"]`，否则浏览器会拒绝；
- `allow_methods` / `allow_headers`：允许的方法和请求头。

### 6.4 请求 ID 与日志

线上排查问题时，需要把一次请求的日志串起来：

```python
import logging
import uuid

from fastapi import FastAPI, Request

logging.basicConfig(level=logging.INFO)
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

- `request.state` 是挂在单次请求上的命名空间，异常处理器里也能读到 `request.state.request_id`；
- 不要用模块级全局变量保存请求 ID，多线程/异步下会串；
- 响应头返回 `X-Request-ID`，用户报错时可以把这串 ID 一起提供。

### 6.5 中间件的顺序

`add_middleware()` 后注册的中间件在更外层，先收到请求、后收到响应。用 `@app.middleware("http")` 注册多个时，也是按注册顺序形成洋葱结构。

不要死记顺序，按需求判断：

- 需要尽早拦截请求的（认证、限流）放外层；
- CORS 要考虑错误响应是否也需要跨域头；
- 代理层已经做了压缩，就不要再加 GZip。

### 6.6 中间件的坑

- 中间件里不要做数据库查询、复杂业务判断，它会影响所有请求，包括健康检查和静态资源；
- 中间件里不要放阻塞调用，否则会拖慢整个事件循环；
- 读取请求体要谨慎：ASGI 的请求体是一次性的，中间件读完后路由可能读不到。

---

## 7. 数据库（SQLAlchemy 2.0）

### 7.1 先补一课：SQL 最小知识

关系型数据库把数据存在「表」里，表由「行」和「列」组成。

```sql
-- 建表
CREATE TABLE todos (
    id INTEGER PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0,
    owner_id INTEGER NOT NULL
);

-- 增
INSERT INTO todos (title, done, owner_id) VALUES ('学习 FastAPI', 0, 1);

-- 查
SELECT * FROM todos WHERE owner_id = 1;

-- 改
UPDATE todos SET done = 1 WHERE id = 1;

-- 删
DELETE FROM todos WHERE id = 1;
```

几个概念：

| 概念 | 含义 |
| --- | --- |
| 主键（Primary Key） | 唯一标识一行，通常是 `id` |
| 外键（Foreign Key） | 指向另一张表的主键，例如 `owner_id` 指向 `users.id` |
| 索引（Index） | 加速按某列查询，常用在 `id`、`owner_id`、`email` 上 |
| 事务（Transaction） | 一组要么全部成功、要么全部回滚的操作 |

### 7.2 为什么用 ORM

直接写 SQL 也能用，但 Python 代码里到处拼 SQL 字符串容易出错，也不方便类型检查。ORM（对象关系映射）把「表」映射成「类」，把「行」映射成「对象」：

```python
todo = Todo(title="学习", owner_id=1)   # 对应 INSERT
db.add(todo)
db.commit()

todos = db.scalars(select(Todo).where(Todo.owner_id == 1)).all()  # 对应 SELECT
```

FastAPI 项目通常有三层模型：

| 层 | 例子 | 职责 |
| --- | --- | --- |
| ORM 模型 | `Todo` | 映射数据库表 |
| Pydantic 请求模型 | `TodoCreate`、`TodoUpdate` | 校验客户端输入 |
| Pydantic 响应模型 | `TodoPublic` | 控制返回字段 |

不要让客户端直接写 ORM 对象，也不要把 ORM 对象原样返回。前者会绕过校验，后者可能泄露内部字段。

### 7.3 安装依赖

```bash
uv add sqlalchemy alembic
```

- `sqlalchemy`：ORM；
- `alembic`：数据库迁移工具，生产环境用它修改表结构。

### 7.4 创建引擎、会话和 Base

**database.py：**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # 仅 SQLite 需要
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass
```

逐个解释：

- `DATABASE_URL`：数据库地址。SQLite 是文件数据库，`sqlite:///./app.db` 表示项目根目录下的 `app.db`；
- `create_engine`：创建数据库引擎，内部维护连接池；
- `connect_args={"check_same_thread": False}`：SQLite 默认禁止跨线程使用同一连接，FastAPI 的同步路由会在线程池中执行，所以需要关掉这个检查；
- `SessionLocal`：会话工厂。每次调用 `SessionLocal()` 得到一个 `Session`；
- `autoflush=False`：查询前不自动把待提交的改动刷到数据库；
- `expire_on_commit=False`：提交后对象仍可读取属性，不会因为会话过期而重新查库；
- `Base`：所有 ORM 模型的基类，`Base.metadata` 记录所有表结构。

### 7.5 定义 ORM 模型

**models.py：**

```python
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100), index=True)
    done: Mapped[bool] = mapped_column(default=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
```

解释：

- `__tablename__`：对应的表名；
- `Mapped[int]`：列的类型，同时告诉类型检查器属性是 `int`；
- `Mapped[str]` 对应 `NOT NULL`，`Mapped[str | None]` 对应可空列；
- `primary_key=True`：主键；
- `index=True`：给这一列建索引；
- `unique=True`：唯一约束，重复插入会报错；
- `ForeignKey("users.id")`：外键，`todos.owner_id` 引用 `users.id`；
- `default=True` / `default=False`：Python 层默认值，插入时由 SQLAlchemy 填；
- `server_default=func.now()`：数据库层默认值，由数据库生成当前时间。

> `default` 和 `server_default` 不一样：前者在 Python 里生成，后者写进建表语句由数据库生成。时间戳通常用 `server_default`，避免应用服务器时区不一致。

### 7.6 每请求一个会话：`get_db` 依赖

**deps.py：**

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

- 每个请求创建独立会话；
- 业务异常时回滚；
- 请求结束一定关闭，避免连接泄漏；
- 路由里通过 `Annotated[Session, Depends(get_db)]` 拿到会话。

### 7.7 用 SQLAlchemy 完成 CRUD

**schemas.py：**

```python
from pydantic import BaseModel, ConfigDict, Field


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    done: bool | None = None

    model_config = ConfigDict(extra="forbid")


class TodoPublic(BaseModel):
    id: int
    title: str
    done: bool
    owner_id: int

    model_config = ConfigDict(from_attributes=True)
```

**routers/todos.py：**

```python
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

import models
import schemas
from deps import get_db

router = APIRouter(prefix="/todos", tags=["todos"])

DB = Annotated[Session, Depends(get_db)]


@router.post("", response_model=schemas.TodoPublic, status_code=status.HTTP_201_CREATED)
def create_todo(payload: schemas.TodoCreate, db: DB):
    todo = models.Todo(title=payload.title)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.get("", response_model=list[schemas.TodoPublic])
def list_todos(
    db: DB,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    stmt = (
        select(models.Todo)
        .order_by(models.Todo.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt))


@router.get("/{todo_id}", response_model=schemas.TodoPublic)
def get_todo(todo_id: int, db: DB):
    todo = db.get(models.Todo, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.patch("/{todo_id}", response_model=schemas.TodoPublic)
def update_todo(todo_id: int, payload: schemas.TodoUpdate, db: DB):
    todo = db.get(models.Todo, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)

    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: DB):
    todo = db.get(models.Todo, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
    return None
```

**main.py：**

```python
from fastapi import FastAPI

import models
from database import Base, engine
from routers import todos

Base.metadata.create_all(bind=engine)  # 仅开发环境使用

app = FastAPI(title="Todo API")
app.include_router(todos.router)
```

逐段解释：

- `db.add(todo)`：把对象加入会话的待插入队列；
- `db.commit()`：提交事务，真正写入数据库；
- `db.refresh(todo)`：从数据库重新读取，拿到自增 `id`、默认值和数据库生成的时间；
- `db.get(Model, id)`：按主键查询，比手写 `select` 简洁；
- `db.scalars(stmt)`：执行 `select` 语句，返回标量（对象）而不是 Row；
- `.offset(skip).limit(limit)`：分页；
- `db.delete(todo)` + `commit()`：删除；
- `Base.metadata.create_all(bind=engine)`：根据模型建表。表已存在时不会修改结构，所以只适合开发阶段。

### 7.8 事务边界

一个业务操作涉及多张表时，所有写入要在同一个事务里提交（下面是示意代码，`Order`、`OrderItem` 等模型省略）：

```python
def create_order(db: Session, *, user_id: int, payload: OrderCreate):
    try:
        order = Order(user_id=user_id)
        db.add(order)
        db.flush()                     # 先拿到 order.id，但还没提交

        for item in payload.items:
            db.add(OrderItem(order_id=order.id, **item.model_dump()))

        db.commit()                    # 所有写入一起提交
        db.refresh(order)
        return order
    except Exception:
        db.rollback()                  # 任何一步失败，全部回滚
        raise
```

- `flush()`：把 SQL 发给数据库，但事务还没提交，可以拿到自增 id；
- 一个 service 函数负责一次业务的提交或回滚；
- 不要让每个 repository 函数都偷偷 `commit()`，否则一次业务会被拆成多个不可回滚的独立事务。

### 7.9 关联查询与 N+1

给 `Todo` 加个关系：

```python
from sqlalchemy.orm import relationship


class User(Base):
    # ...
    todos: Mapped[list["Todo"]] = relationship(back_populates="owner")


class Todo(Base):
    # ...
    owner: Mapped["User"] = relationship(back_populates="todos")
```

查询 100 个用户，再循环访问每个 `user.todos`，ORM 可能执行 1 次用户查询 + 100 次待办查询，这就是 N+1。

解决方式是预加载：

```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload

stmt = select(User).options(selectinload(User.todos))
users = list(db.scalars(stmt).unique())
```

`selectinload` 会额外执行一条 `WHERE user_id IN (...)` 的查询，把关联数据一次取回，总共 2 条 SQL。

### 7.10 数据库迁移（Alembic）

开发阶段可以用 `create_all()` 建表，但生产环境表结构会不断变化，需要迁移工具：

```bash
uv run alembic init migrations
```

然后修改 `alembic.ini` 或 `migrations/env.py` 里的数据库地址，让它从配置读取。常用命令：

```bash
# 根据模型变化自动生成迁移脚本
uv run alembic revision --autogenerate -m "add todos table"

# 应用迁移
uv run alembic upgrade head

# 回退一个版本
uv run alembic downgrade -1
```

迁移脚本要提交到 Git，部署时执行 `alembic upgrade head`。不要在生产环境启动时调用 `create_all()`。

### 7.11 同步还是异步数据库

| 场景 | 建议 |
| --- | --- |
| 普通 CRUD、并发不高 | 同步 SQLAlchemy + `def` 路由，FastAPI 会放到线程池 |
| 高并发、需要在一个请求里并发查多个库 | `AsyncSession` + `aiosqlite` / `asyncpg` + `async def` |
| 异步路由里调用同步 ORM | 错误组合，会阻塞事件循环 |

本教程先用同步方案，简单、稳定，足够大多数项目。切换到异步时，整条链路（驱动、会话、路由）都要一起改，不要只改一半。

**验证**：POST 创建一条 Todo，重启服务，再 GET 列表，数据仍在；`app.db` 文件已生成。

---

## 8. 认证与授权

### 8.1 认证和授权不是一回事

- **认证（Authentication）**：确认「你是谁」。登录、验证密码、签发 token 属于认证。
- **授权（Authorization）**：确认「你能做什么」。普通用户不能删除别人创建的 Todo，属于授权。

一个接口通常先认证，再授权。认证失败返回 401，授权失败返回 403。

### 8.2 安全地保存密码

数据库里绝不能存明文密码，也不能用 MD5、SHA1 或普通 SHA256。要用专门为密码设计的慢哈希算法，例如 Argon2、bcrypt。

安装依赖：

```bash
uv add "pwdlib[argon2]" PyJWT python-multipart pydantic-settings
```

- `pwdlib[argon2]`：密码哈希；
- `PyJWT`：签发和校验 JWT；
- `python-multipart`：解析登录表单（OAuth2 密码流要求表单编码）；
- `pydantic-settings`：从环境变量和 `.env` 读取配置。

**security.py：**

```python
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()   # 默认使用 Argon2


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return password_hash.verify(plain, hashed)
```

用法：

```python
hashed = hash_password("12345678")
assert verify_password("12345678", hashed) is True
assert verify_password("wrong-password", hashed) is False
```

哈希函数每次都会生成随机 salt，所以同一个密码两次哈希的结果不同，但 `verify` 都能验证通过。salt 已经包含在哈希串里，不需要自己保存。

### 8.3 JWT 是什么

JWT（JSON Web Token）是一串用点分隔的字符串：

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzAwMDAwMDAwfQ.签名
```

它由三部分组成：

| 部分 | 内容 | 是否加密 |
| --- | --- | --- |
| Header | 算法、类型 | 否，Base64 编码 |
| Payload | 用户 id、过期时间等 | 否，Base64 编码 |
| Signature | 用密钥对前两部分签名 | 用于防篡改 |

**Payload 只是 Base64 编码，不是加密。** 任何拿到 token 的人都能解码看到里面的内容，所以不要放密码、身份证号、银行卡号等敏感信息。只放 `sub`（用户 id）、`exp`（过期时间）、`type`（token 类型）这类最小声明。

服务器不保存 token。客户端每次请求带上 `Authorization: Bearer <token>`，服务器用密钥验证签名，就能确认 token 是自己签发的、没有被篡改、没有过期。

### 8.4 签发和校验 JWT

**security.py（续）：**

```python
from datetime import UTC, datetime, timedelta

import jwt

from config import settings

ALGORITHM = "HS256"


def create_access_token(user_id: int) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),        # JWT 规范要求 sub 是字符串
        "iat": now,                 # 签发时间
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
        "type": "access",           # 区分 access / refresh
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=[ALGORITHM],     # 必须显式指定，不能让 token 自己决定算法
        options={"require": ["sub", "exp", "type"]},
    )
```

- `datetime.now(UTC)`：使用 UTC 时间，避免服务器时区导致过期时间偏差；
- `exp`：过期时间，PyJWT 校验时会自动检查，过期抛 `ExpiredSignatureError`（`InvalidTokenError` 的子类）；
- `sub`：用户标识，规范要求字符串；
- `type`：区分访问令牌和刷新令牌，防止 refresh token 直接访问业务接口；
- `algorithms=[ALGORITHM]`：固定算法，防止算法混淆攻击；
- `options={"require": [...]}`：缺少这些声明时直接报错。

**config.py：**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    secret_key: str = "dev-only-change-me-0123456789abcdef"
    database_url: str = "sqlite:///./app.db"
    access_token_expire_minutes: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
```

在项目根目录创建 `.env`：

```dotenv
SECRET_KEY=请换成随机生成的字符串
DATABASE_URL=sqlite:///./app.db
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

生成一个随机密钥：

```bash
uv run python -c "import secrets; print(secrets.token_urlsafe(32))"
```

生产环境不要给 `secret_key` 提供可用默认值，必须由环境变量注入。

### 8.5 登录接口

OAuth2 密码流要求客户端用 `application/x-www-form-urlencoded` 提交用户名和密码，不是 JSON。FastAPI 提供了 `OAuth2PasswordRequestForm` 来解析：

**routers/auth.py：**

```python
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

import models
from deps import DB
from security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DB,
):
    user = db.scalar(
        select(models.User).where(models.User.username == form.username)
    )
    if user is None or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}
```

解释：

- `OAuth2PasswordRequestForm` 是一个类依赖，`Depends()` 会自动读取表单里的 `username` 和 `password`；
- 用户名不存在和密码错误返回**同一个**错误信息，避免攻击者枚举用户名；
- 401 响应带 `WWW-Authenticate: Bearer`，这是 HTTP 规范的要求；
- 返回结构必须是 `{"access_token": ..., "token_type": "bearer"}`，Swagger 的 Authorize 按钮才能识别。

用 curl 登录：

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=hu&password=12345678"
```

如果写成 `-H "Content-Type: application/json"`，会得到 422。

### 8.6 从 token 中取出当前用户

**deps.py：**

```python
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User
from security import decode_token


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

# tokenUrl 要和真实的登录接口路径一致
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    db: DB,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效或过期的令牌",
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

逐段解释：

- `OAuth2PasswordBearer(tokenUrl="/auth/login")`：告诉 FastAPI「token 从 `Authorization: Bearer ...` 头里取；文档里的 Authorize 按钮去 `/auth/login` 换 token」；
- `db: DB`：当前用户依赖也依赖数据库会话，形成依赖链 `get_current_user → get_db`；
- `decode_token` 失败（签名不对、过期、格式错误）都抛 `InvalidTokenError`，统一返回 401；
- 校验 `type`：refresh token 不能访问业务接口；
- `sub` 转成 `int` 失败也返回 401；
- 每次请求都查一次数据库，这样账号被禁用、删除后，旧的 token 会立即失效；
- `CurrentUser` 是一个类型别名，路由里写 `current_user: CurrentUser` 即可。

### 8.7 保护路由

**routers/todos.py：**

```python
from fastapi import APIRouter, Depends

from deps import CurrentUser, get_current_user

router = APIRouter(
    prefix="/todos",
    tags=["todos"],
    dependencies=[Depends(get_current_user)],   # 整组接口都要求登录
)


@router.get("")
def list_todos(current_user: CurrentUser):
    return {"user_id": current_user.id, "todos": []}
```

两种写法的区别：

- `dependencies=[Depends(get_current_user)]`：只执行认证，不把用户对象传给函数。适合「只要登录就行」的接口；
- 函数参数写 `current_user: CurrentUser`：既执行认证，又能拿到用户对象。需要按用户过滤数据时必须用这种。

两者可以同时存在，FastAPI 的依赖缓存会保证 `get_current_user` 只执行一次。

### 8.8 数据级授权：把 `owner_id` 写进查询

只判断「登录了」是不够的。下面这种写法，任何登录用户都能读别人的 Todo：

```python
# 错误：只按 id 查
todo = db.get(models.Todo, todo_id)
```

正确做法是把归属条件写进 WHERE：

```python
from sqlalchemy import select


@router.get("/{todo_id}", response_model=schemas.TodoPublic)
def get_todo(todo_id: int, db: DB, current_user: CurrentUser):
    stmt = select(models.Todo).where(
        models.Todo.id == todo_id,
        models.Todo.owner_id == current_user.id,
    )
    todo = db.scalar(stmt)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo
```

- 查不到时返回 404，而不是 403。这样不会泄露「这个 id 确实存在，只是不属于你」；
- 列表查询同样要带 `owner_id`；
- 更新、删除也要先按 `id + owner_id` 查，再操作。

这种「只改 URL 里的 id 就访问别人数据」的漏洞叫 **IDOR（Insecure Direct Object Reference，越权访问）**，是 API 最常见的安全问题之一。

### 8.9 401 与 403

```python
# 没登录、token 无效、token 过期 → 401
raise HTTPException(
    status_code=401,
    detail="无效或过期的令牌",
    headers={"WWW-Authenticate": "Bearer"},
)

# 登录了，但账号被禁用 / 不是管理员 → 403
raise HTTPException(status_code=403, detail="没有权限")
```

不要混用。返回 401 会让前端尝试重新登录，403 则应该提示「无权限」。

### 8.10 完整验证流程

```bash
# 1. 注册
curl -s -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"hu","email":"hu@example.com","password":"12345678"}'

# 2. 登录，复制返回的 access_token
curl -s -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=hu&password=12345678"

# 3. 不带 token 访问受保护接口，应返回 401
curl -s -i http://127.0.0.1:8000/todos

# 4. 带 token 访问
curl -s http://127.0.0.1:8000/todos \
  -H "Authorization: Bearer 把token粘贴到这里"

# 5. 用另一个账号登录，访问第一个账号的 todo_id，应返回 404
```

也可以在 `/docs` 右上角点 **Authorize**，填入用户名密码，Swagger 会自动换 token 并在后续请求里带上。

---

## 9. 异步与后台任务

### 9.1 事件循环

Web 服务的瓶颈通常不是 CPU，而是 I/O 等待：查数据库、调第三方接口、读写文件。同步模式下，程序在等待时什么也做不了；异步模式下，等待期间可以切换去处理别的请求。

事件循环（Event Loop）是异步的核心：它在**单线程**里维护一批任务，遇到 `await` 就把当前任务挂起，去执行别的任务，等 I/O 完成后再回来继续。

```python
import asyncio


async def fetch_data():
    await asyncio.sleep(1)   # 模拟 I/O 等待，期间可以处理别的任务
    return "数据"


@app.get("/data")
async def read_data():
    result = await fetch_data()
    return {"result": result}
```

- `async def`：声明一个协程函数；
- `await`：等待一个异步操作完成，同时让出控制权；
- `await` 只能用在 `async def` 里；
- 只有真正异步的库（`httpx.AsyncClient`、`asyncpg`、`aiosqlite`）才能从 `await` 中获益。

### 9.2 `def` 还是 `async def`

这是 FastAPI 最容易踩的坑。看下面两段代码：

```python
# 错误：async 路由里调用同步阻塞函数
import time


@app.get("/slow")
async def slow():
    time.sleep(5)      # 整个事件循环被卡住 5 秒
    return {"done": True}
```

`time.sleep` 是同步阻塞的。即使函数是 `async def`，它也会卡住事件循环，期间**所有请求**都无法处理。

```python
# 正确：普通 def，FastAPI 会放到线程池
import time


@app.get("/slow")
def slow():
    time.sleep(5)
    return {"done": True}
```

FastAPI 会把普通 `def` 路由放到线程池执行，一个请求阻塞不会卡住事件循环。

选择规则：

| 路由里的代码 | 写法 |
| --- | --- |
| 全部是异步库（`httpx.AsyncClient`、`asyncpg`、`aiosqlite`） | `async def` + `await` |
| 全部是同步库（`requests`、同步 SQLAlchemy、`time.sleep`） | 普通 `def` |
| CPU 密集计算（图像处理、加密、复杂计算） | 普通 `def`，或交给进程池 / 任务队列 |
| `async def` 里必须调用少量同步函数 | 用 `run_in_threadpool` 包一层 |

```python
from starlette.concurrency import run_in_threadpool


@app.get("/mixed")
async def mixed():
    result = await run_in_threadpool(some_blocking_function)
    return {"result": result}
```

> 判断口诀：这个 I/O 有异步版本吗？有，就用 `async def` + `await`；没有，就用 `def`。不要在 `async def` 里混入 `time.sleep`、`requests`、同步数据库驱动。

### 9.3 异步 HTTP 客户端与超时

调用第三方接口时，不要在每个请求里新建客户端，也不要不设超时：

```python
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(
        timeout=httpx.Timeout(connect=2.0, read=5.0, write=5.0, pool=1.0),
        limits=httpx.Limits(max_connections=100),
    )
    yield
    await app.state.http.aclose()


app = FastAPI(lifespan=lifespan)


@app.get("/proxy")
async def proxy(request: Request):
    client = request.app.state.http
    response = await client.get("https://api.example.com/data")
    return response.json()
```

- `lifespan`：应用启动时创建客户端，关闭时释放连接池；
- 复用客户端才能复用 TCP 连接；
- 必须设置超时。没有超时的外部调用是生产事故的常见来源；
- 只对幂等请求和可恢复错误（5xx、429、连接错误）做有限重试，并设置总预算。

### 9.4 后台任务

有些操作不需要用户等待，例如注册后发欢迎邮件、下单后发通知。`BackgroundTasks` 会让响应先返回，任务在响应发送后执行：

```python
from fastapi import BackgroundTasks, FastAPI

app = FastAPI()


def send_welcome_email(email: str) -> None:
    print(f"给 {email} 发送欢迎邮件")


@app.post("/users")
def create_user(email: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_welcome_email, email)
    return {"message": "用户已创建，邮件稍后发送"}
```

执行顺序：

1. 路由把 `send_welcome_email` 和参数加入队列；
2. 返回响应；
3. 响应发送后，执行任务。

`add_task(函数, 参数1, 参数2, ...)` 的第一个参数是函数本身，不是调用结果。不要写成 `add_task(send_welcome_email(email))`。

### 9.5 后台任务最重要的坑：不要传请求级资源

后台任务在响应之后执行，而数据库会话、`Request`、ORM 对象都属于请求期间。请求结束后，会话已经关闭，ORM 对象可能已经 detached。

```python
# 错误：把请求里的 db 和 ORM 对象传给后台任务
background_tasks.add_task(send_email_and_log, db, user)
```

正确做法是只传标量（id、字符串），任务内部自己创建会话：

```python
# tasks.py
import logging

from database import SessionLocal
import models

logger = logging.getLogger(__name__)


def send_email_and_log(user_id: int) -> None:
    db = SessionLocal()
    try:
        user = db.get(models.User, user_id)
        if user is None:
            return
        logger.info("给 %s 发送邮件", user.email)
    finally:
        db.close()
```

```python
background_tasks.add_task(send_email_and_log, user.id)
```

### 9.6 什么时候不该用 BackgroundTasks

| 场景 | 选择 |
| --- | --- |
| 欢迎邮件、轻量通知、失败可人工补 | `BackgroundTasks` |
| 支付回调、审计日志、必须重试、需要查询进度 | Celery / Dramatiq / arq + Redis 等消息队列 |
| 定时任务 | 独立的调度器或队列 |

`BackgroundTasks` 的局限：

- 任务在**当前进程**执行，服务器崩溃任务就丢了；
- 不保证重试；
- 无法查询任务状态；
- 同步任务仍会占用工作线程。

**验证**：POST 后立即收到响应，终端随后才打印邮件日志；把 `db` 传进去的写法会在请求结束后报会话已关闭的错误。

---

## 10. WebSocket

### 10.1 WebSocket 和 HTTP 的区别

HTTP 是「客户端问、服务器答」，服务器不能主动推送。WebSocket 建立一条持久的双向连接，双方可以随时发消息，适合聊天、实时通知、协作编辑。

### 10.2 回显端点

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()          # 必须先接受连接
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"收到：{data}")
    except WebSocketDisconnect:
        print("客户端断开连接")
```

- `@app.websocket`：声明 WebSocket 端点；
- `accept()`：接受连接，之后才能收发消息；
- `receive_text()` / `send_text()`：收发文本；
- 客户端断开会抛 `WebSocketDisconnect`，需要捕获并清理。

浏览器控制台测试：

```javascript
const ws = new WebSocket("ws://127.0.0.1:8000/ws");
ws.onmessage = (event) => console.log(event.data);
ws.onopen = () => ws.send("hello");
```

### 10.3 多连接与广播

```python
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active:
            self.active.remove(websocket)

    async def broadcast(self, message: str):
        for websocket in list(self.active):
            await websocket.send_text(message)


manager = ConnectionManager()


@app.websocket("/ws/chat")
async def chat(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            message = await websocket.receive_text()
            await manager.broadcast(f"广播：{message}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

> `ConnectionManager` 把连接存在进程内存里。多 worker 或多实例部署时，每个进程各有一份列表，广播只对同进程的连接生效。需要跨进程广播时，用 Redis Pub/Sub 等共享消息系统。

---

## 11. 测试

### 11.1 安装测试依赖

```bash
uv add --dev pytest httpx
```

`TestClient` 基于 `httpx`，不需要真的启动服务器。

### 11.2 最简单的测试

```python
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, FastAPI!"}
```

运行：

```bash
uv run pytest -q
```

### 11.3 测试受保护接口

真实认证很麻烦，用 `dependency_overrides` 替换掉：

```python
from fastapi.testclient import TestClient

from deps import get_current_user
from main import app

client = TestClient(app)


def fake_current_user():
    return {"id": 1, "username": "tester"}


def test_requires_login():
    response = client.get("/todos")
    assert response.status_code == 401


def test_list_todos_when_logged_in():
    app.dependency_overrides[get_current_user] = fake_current_user
    try:
        response = client.get("/todos")
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()
```

### 11.4 应该优先测试的路径

不要一开始追求覆盖率，先覆盖会出事故的路径：

| 用例 | 期望 |
| --- | --- |
| 不带 token 访问受保护接口 | 401 |
| 参数缺失、类型错误 | 422 |
| 访问别人的资源 | 404 |
| 正常创建 | 201 |
| 正常列表 | 200，且只包含自己的数据 |
| PATCH 只传一个字段 | 其他字段不被重置 |
| 被禁用账号 | 403 或 401 |

数据库测试建议用独立的 SQLite 文件或内存库，每个用例结束后回滚或删表，避免用例互相污染。

---

## 12. 部署

### 12.1 启动命令

开发环境：

```bash
uv run fastapi dev main.py
```

生产环境关闭热重载：

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

或者用 Gunicorn 管理多进程：

```bash
uv add gunicorn
uv run gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

`--workers` 的数量不要盲目开大：worker 数 × 每个进程的连接池大小，不能超过数据库允许的最大连接数。

### 12.2 Dockerfile

```dockerfile
FROM ghcr.io/astral-sh/uv:latest AS uv
FROM python:3.12-slim

COPY --from=uv /uv /uvx /bin/
WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
RUN uv sync --frozen --no-dev

EXPOSE 8000
CMD ["uv", "run", "--no-sync", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`.dockerignore`：

```text
.venv
.git
__pycache__
*.pyc
app.db
.env
```

### 12.3 上线前检查

- `SECRET_KEY`、数据库密码来自环境变量，不在代码和仓库里；
- 生产环境关闭 `--reload`；
- 数据库结构用 Alembic 迁移，不用 `create_all()`；
- `/docs`、`/redoc`、`/openapi.json` 按需求关闭或加保护；
- 反向代理（Nginx / Traefik）处理 TLS、静态文件和负载均衡；
- WebSocket 要确保代理转发 `Upgrade` 和 `Connection` 头；
- 日志输出到 stdout，由平台统一收集，日志里不要出现密码和 token；
- 发布前跑测试和迁移检查。

---

## 13. 完整项目：从零跑通 Todo API

这一节把前面所有内容组装成一个可运行的项目。代码按文件给出，照着建目录即可。

### 13.1 目录结构

```text
todo-api/
├── main.py
├── config.py
├── database.py
├── models.py
├── schemas.py
├── security.py
├── deps.py
├── tasks.py
├── .env
└── routers/
    ├── __init__.py
    ├── auth.py
    └── todos.py
```

### 13.2 初始化

```bash
uv init --app todo-api
cd todo-api
uv add "fastapi[standard]" sqlalchemy alembic "pwdlib[argon2]" PyJWT python-multipart pydantic-settings
uv add --dev pytest httpx
```

### 13.3 config.py

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    secret_key: str = "dev-only-change-me-0123456789abcdef"
    database_url: str = "sqlite:///./app.db"
    access_token_expire_minutes: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
```

### 13.4 database.py

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass
```

### 13.5 models.py

```python
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100), index=True)
    done: Mapped[bool] = mapped_column(default=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
```

### 13.6 schemas.py

```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    email: str


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=64)


class UserPublic(UserBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TodoBase(BaseModel):
    title: str = Field(min_length=1, max_length=100)


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    done: bool | None = None

    model_config = ConfigDict(extra="forbid")


class TodoPublic(TodoBase):
    id: int
    done: bool
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### 13.7 security.py

```python
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from config import settings

ALGORITHM = "HS256"
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
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=[ALGORITHM],
        options={"require": ["sub", "exp", "type"]},
    )
```

### 13.8 deps.py

```python
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User
from security import decode_token


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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    db: DB,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效或过期的令牌",
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

### 13.9 routers/auth.py

```python
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, select

import models
import schemas
from deps import DB
from security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserPublic, status_code=201)
def register(payload: schemas.UserCreate, db: DB):
    exists = db.scalar(
        select(models.User).where(
            or_(
                models.User.username == payload.username,
                models.User.email == payload.email,
            )
        )
    )
    if exists is not None:
        raise HTTPException(status_code=400, detail="用户名或邮箱已存在")

    user = models.User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DB,
):
    user = db.scalar(
        select(models.User).where(models.User.username == form.username)
    )
    if user is None or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }
```

### 13.10 routers/todos.py

```python
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select

import models
import schemas
import tasks
from deps import DB, CurrentUser

router = APIRouter(prefix="/todos", tags=["todos"])


@router.post("", response_model=schemas.TodoPublic, status_code=status.HTTP_201_CREATED)
def create_todo(
    payload: schemas.TodoCreate,
    background_tasks: BackgroundTasks,
    db: DB,
    current_user: CurrentUser,
):
    todo = models.Todo(**payload.model_dump(), owner_id=current_user.id)
    db.add(todo)
    db.commit()
    db.refresh(todo)

    # 事务已提交，后台任务只接收标量
    background_tasks.add_task(
        tasks.notify_todo_created,
        todo.id,
        current_user.email,
    )
    return todo


@router.get("", response_model=list[schemas.TodoPublic])
def list_todos(
    db: DB,
    current_user: CurrentUser,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    stmt = (
        select(models.Todo)
        .where(models.Todo.owner_id == current_user.id)
        .order_by(models.Todo.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt))


@router.get("/{todo_id}", response_model=schemas.TodoPublic)
def get_todo(todo_id: int, db: DB, current_user: CurrentUser):
    todo = db.scalar(
        select(models.Todo).where(
            models.Todo.id == todo_id,
            models.Todo.owner_id == current_user.id,
        )
    )
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.patch("/{todo_id}", response_model=schemas.TodoPublic)
def update_todo(
    todo_id: int,
    payload: schemas.TodoUpdate,
    db: DB,
    current_user: CurrentUser,
):
    todo = db.scalar(
        select(models.Todo).where(
            models.Todo.id == todo_id,
            models.Todo.owner_id == current_user.id,
        )
    )
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)

    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: DB, current_user: CurrentUser):
    todo = db.scalar(
        select(models.Todo).where(
            models.Todo.id == todo_id,
            models.Todo.owner_id == current_user.id,
        )
    )
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    db.delete(todo)
    db.commit()
    return None
```

### 13.11 tasks.py

```python
import logging

import models
from database import SessionLocal

logger = logging.getLogger(__name__)


def notify_todo_created(todo_id: int, email: str) -> None:
    db = SessionLocal()
    try:
        todo = db.get(models.Todo, todo_id)
        if todo is None:
            return
        logger.info("通知 %s：Todo %s 已创建", email, todo.title)
    finally:
        db.close()
```

### 13.12 main.py

```python
from fastapi import FastAPI

import models
from database import Base, engine
from routers import auth, todos

Base.metadata.create_all(bind=engine)   # 仅开发环境

app = FastAPI(title="Todo API", version="1.0.0")
app.include_router(auth.router)
app.include_router(todos.router)
```

`import models` 不能删。`create_all` 需要模型已经被导入，否则 `Base.metadata` 里没有表。

### 13.13 运行和验收

```bash
uv run fastapi dev main.py
```

按顺序验证：

1. 打开 `/docs`，应看到 `auth` 和 `todos` 两组接口；
2. 注册用户 A，返回 201 和 `id`，**不应包含 `hashed_password`**；
3. 用 A 登录，拿到 `access_token`；
4. 不带 token 请求 `GET /todos`，返回 401；
5. 带 token 创建 Todo，返回 201；
6. 带 token 列表查询，只能看到自己的 Todo；
7. 注册用户 B，用 B 的 token 访问 A 的 `todo_id`，返回 404；
8. PATCH A 的 Todo 只传 `{"done": true}`，标题保持不变；
9. 看终端日志，后台任务在响应之后打印通知；
10. 重启服务，数据仍在。

---

## 14. 常见报错与坑

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| `Could not import module "main"` | 启动命令的模块名和文件名不一致 | `main:app` 对应 `main.py` 里的 `app` |
| 修改代码不生效 | 没有加 `--reload`，或启动的不是开发模式 | 开发用 `fastapi dev main.py` |
| 访问 `/todos` 收到 307 | 路由写成了 `/todos/` | 用 `@router.get("")`，或统一带尾斜杠 |
| `/users/me` 被当成 `user_id` | 固定路径写在动态路径后面 | 固定路径先声明 |
| 422 且 `loc` 指向 `query` | 参数被当成了查询参数 | 检查是否漏了 Pydantic 模型或路径占位符 |
| 422 且提示 `field required` | 请求体缺字段，或 `str \| None` 没写 `= None` | 补字段或补默认值 |
| 响应里没有想要的数据 | `response_model` 没声明该字段 | 在响应模型里加字段 |
| 响应里出现了密码 | 直接返回 ORM 对象且没设 `response_model` | 用 `UserPublic` 等响应模型过滤 |
| PATCH 把没传的字段清空 | 用了 `model_dump()` | 改用 `model_dump(exclude_unset=True)` |
| 登录返回 422 | 登录接口用了 JSON | 用 `application/x-www-form-urlencoded` |
| 401 但 token 看起来没问题 | `tokenUrl` 和登录路径不一致，或算法不匹配 | 对齐 `OAuth2PasswordBearer(tokenUrl=...)` 和 `ALGORITHM` |
| 403 而不是 401 | 账号被禁用或权限不足 | 这是正确的，按语义区分 |
| 数据库报 `check_same_thread` | SQLite 跨线程使用连接 | `connect_args={"check_same_thread": False}` |
| 重启后数据没了 | 还在用内存字典 | 接入数据库 |
| 表结构改了但没生效 | `create_all` 不会修改已有表 | 用 Alembic 迁移，或开发时删库重建 |
| `async def` 接口很慢，其他接口也卡 | 里面调用了 `time.sleep`、`requests`、同步 ORM | 改用异步库，或改成普通 `def` |
| 后台任务报会话已关闭 | 把请求的 `db` 或 ORM 对象传给了任务 | 只传 id 等标量，任务内自建会话 |
| 多 worker 广播只到一部分连接 | `ConnectionManager` 存在进程内存 | 用 Redis Pub/Sub 等共享状态 |
| `from routers import todos` 失败 | 工作目录不对，或缺少 `__init__.py` | 在项目根目录启动，补空 `__init__.py` |

---

## 15. 一页速查

### 15.1 最小应用

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "hello"}
```

```bash
uv run fastapi dev main.py
```

### 15.2 参数来源

| 来源 | 写法 |
| --- | --- |
| 路径 | `/items/{item_id}` + `item_id: int` |
| 查询 | `page: int = 1` |
| 请求体 | `payload: ItemCreate`（Pydantic 模型） |
| 请求头 | `api_key: Annotated[str \| None, Header()] = None` |
| 表单 | `form: Annotated[OAuth2PasswordRequestForm, Depends()]` |

### 15.3 模型分层

```python
class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    model_config = ConfigDict(extra="forbid")


class UserPublic(UserBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)
```

### 15.4 依赖注入

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


DB = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
```

### 15.5 路由保护

```python
router = APIRouter(
    prefix="/todos",
    tags=["todos"],
    dependencies=[Depends(get_current_user)],
)
```

### 15.6 归属过滤

```python
stmt = select(Todo).where(
    Todo.id == todo_id,
    Todo.owner_id == current_user.id,
)
```

### 15.7 后台任务

```python
background_tasks.add_task(send_email, user.id)   # 只传标量
```

### 15.8 记住这五条

1. 外部输入先过 Pydantic，再进业务代码；
2. 需要登录的接口用依赖注入统一认证，不要在函数里手写判断；
3. 查询资源时把 `owner_id` 写进 WHERE，而不是查出来再判断；
4. 一次业务用例统一提交或回滚，后台任务只收标量并自建会话；
5. 只有真正异步的 I/O 才用 `async def`，同步代码用普通 `def`。

