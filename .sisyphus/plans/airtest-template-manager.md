# Airtest Template Manager

## TL;DR

> **Quick Summary**: 构建一个全栈Web应用，用于管理Airtest自动化测试的截图和UI元素标注，支持版本管理，自动生成Python格式的模版枚举文件。
>
> **Deliverables**:
> - React + TailwindCSS + TypeScript + Rspack 前端项目
> - REST API 后端服务
> - 截图上传和管理界面
> - UI元素矩形框标注工具
> - 版本历史管理
> - Python模版枚举文件生成器
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: 项目初始化 → Rspack配置 → 标注组件 → Python生成器

---

## Context

### Original Request
设计工具项目，用于管理airtest的识别模版：
1. 管理游戏截图和截图中的各个关键ui元素的位置信息及名字
2. 每次更新位置信息后，更新模版枚举文件，以在airtest主脚本中使用
使用web界面, 在项目目录中运行命令后启动webui。webui使用react tailwindcss typescript rspack, 通过 restapi 与webui交互

### Interview Summary
**Key Discussions**:
- 标注形状: 矩形框
- 存储方式: 外部文件（扁平结构）
- 版本管理: 嵌入在当前文件（当前+历史数组格式）
- 坐标系统: 同时存储相对和绝对坐标
- 预设分组: 登录相关、游戏主界面、游戏玩法、其他功能
- Python输出: airtest Template实例格式
- 启动命令: `npm start`
- 测试策略: 仅手动验证

**Research Findings**:
- 研究任务因系统限制未完成，基于行业最佳实践进行规划
- React + Rspack 是现代化的前端构建方案，提供快速构建体验
- 截图标注推荐使用 Konva.js 或类似 Canvas 库实现矩形选择
- REST API 使用标准 CRUD 模式，JSON 文件存储数据

### Metis Review
Metis consultation encountered system error. Proceeding with self-identified gap analysis.

---

## Work Objectives

### Core Objective
构建一个Airtest模板管理工具，提供Web界面进行截图上传、UI元素矩形框标注、版本管理，并自动生成Python格式的Airtest Template实例代码。

### Concrete Deliverables
- `package.json`: 项目配置文件，包含所有依赖和npm start命令
- `rspack.config.ts`: Rspack构建配置
- `server.ts`: Express REST API服务
- `src/`: React前端源码目录
  - `App.tsx`: 主应用组件
  - `components/`: React组件
    - `ScreenshotManager.tsx`: 截图管理组件
    - `AnnotationEditor.tsx`: UI元素标注编辑器
    - `VersionHistory.tsx`: 版本历史查看器
    - `PythonPreview.tsx`: Python代码预览
  - `lib/`: 工具库
    - `api.ts`: API调用封装
    - `storage.ts`: 本地存储管理
- `data/`: 数据存储目录
  - `screenshots/`: 截图文件目录
  - `annotations/`: 标注数据JSON文件目录
- `output/`: 输出目录
  - `templates.py`: 生成的Python模版枚举文件

### Definition of Done
- [ ] 运行 `npm start` 后，WebUI在自动分配的端口启动
- [ ] 可以上传游戏截图
- [ ] 可以在截图上绘制矩形框标注UI元素
- [ ] 标注数据保存到JSON文件，包含版本历史
- [ ] Python模版枚举文件自动生成并更新
- [ ] 可以查看版本历史和回滚

### Must Have
- 截图上传和存储
- 矩形框标注（拖拽绘制）
- UI元素命名（自由输入）
- 相对坐标和绝对坐标同时存储
- 版本管理（当前+历史数组）
- Python Template实例格式输出
- 按截图名称搜索
- 截图分组（4个预设分组）

### Must NOT Have (Guardrails)
- 数据库（使用JSON文件存储）
- 用户认证系统
- 截图自动识别（手动标注）
- 导出/导入功能
- 测试框架（手动验证）

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual only
- **Framework**: None
- **QA approach**: Manual verification

### Manual Verification (NO User Intervention)

> **CRITICAL PRINCIPLE: ZERO USER INTERVENTION**
>
> **NEVER** create acceptance criteria that require:
> - "User manually tests..." / "用户手动测试..."
> - "User visually confirms..." / "用户视觉确认..."
> - "User interacts with..." / "用户交互..."
> - "Ask user to verify..." / "请求用户验证..."
>
> **ALL verification MUST be automated and executable by the agent.**
> If a verification cannot be automated, find an automated alternative or explicitly note it as a known limitation.

**By Deliverable Type:**

| Type | Verification Tool | Automated Procedure |
|------|------------------|---------------------|
| **Frontend/UI** | Playwright via playwright skill | Agent navigates, interacts, screenshots |
| **API/Backend** | curl via Bash | Agent sends requests, validates JSON responses |
| **File Generation** | Bash + file operations | Agent runs commands, validates file content |

**Evidence Requirements:**
- Command output captured
- Screenshots saved to `.sisyphus/evidence/`
- JSON response fields validated

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: 项目初始化和依赖安装
├── Task 2: 目录结构创建
└── Task 3: TypeScript类型定义

Wave 2 (After Wave 1):
├── Task 4: Rspack配置
├── Task 5: Express REST API服务器
├── Task 6: API路由和数据存储层
└── Task 7: Python生成器

Wave 3 (After Wave 2):
├── Task 8: React基础组件（布局、导航）
├── Task 9: 截图上传和管理组件
└── Task 10: 标注编辑器组件

Wave 4 (After Wave 3):
├── Task 11: 版本历史和预览组件
├── Task 12: 集成测试和启动命令
└── Task 13: 文档和README

Critical Path: Task 1 → Task 4 → Task 10 → Task 12
Parallel Speedup: ~50% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2,3,4,5 | - |
| 2 | 1 | 8,9 | 3 |
| 3 | 1 | 8,9,10,11 | 2 |
| 4 | 1,3 | 8 | 2,3,5,6,7 |
| 5 | 1,3 | 6,12 | 2,3,4 |
| 6 | 5 | 12 | 4,7 |
| 7 | 3,6 | 11,12 | 4,6 |
| 8 | 2,3,4 | 9,10 | 9 |
| 9 | 8 | 10 | - |
| 10 | 3,7,9 | 11 | - |
| 11 | 7,10 | 12 | - |
| 12 | 6,10,11 | 13 | - |
| 13 | 12 | None | - |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | delegate_task(category="quick", load_skills=[], run_in_background=true) |
| 2 | 4, 5, 6, 7 | delegate_task(category="unspecified-low", load_skills=[], run_in_background=true) |
| 3 | 8, 9, 10 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"], run_in_background=true) |
| 4 | 11, 12, 13 | delegate_task(category="unspecified-low", load_skills=["frontend-ui-ux"], run_in_background=true) |

---

## TODOs

- [x] 1. 项目初始化和依赖安装

  **What to do**:
  - [ ] 安装前端依赖: `@rspack/cli @rspack/core @rspack/plugin-react react react-dom @types/react @types/react-dom typescript`
  - [ ] 安装UI依赖: `tailwindcss postcss autoprefixer @types/node`
  - [ ] 安装后端依赖: `express @types/express cors @types/cors multer @types/multer body-parser @types/body-parser`
  - [ ] 配置package.json添加scripts: `"start": "node server.ts"`

  **Must NOT do**:
  - 不要安装测试框架
  - 不要安装数据库（使用JSON文件）

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Simple dependency installation, standard npm commands
  - **Skills**: `[]`
    - `none`: No specialized skills needed for npm install
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not needed for dependency installation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3) | Sequential
  - **Blocks**: Tasks 2, 3, 4, 5
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **External References** (libraries and frameworks):
  - Rspack docs: `https://www.rspack.dev/guide/start.html` - Installation and setup
  - React docs: `https://react.dev/learn/installation` - React installation guide
  - TailwindCSS docs: `https://tailwindcss.com/docs/installation` - TailwindCSS setup with postcss

  **WHY Each Reference Matters** (explain the relevance):
  - Rspack docs: Essential for understanding Rspack CLI installation and basic configuration
  - React docs: Provides standard React installation commands and TypeScript integration
  - TailwindCSS docs: Required for postcss-autoprefixer setup with TailwindCSS

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For package.json changes** (using Bash):
  ```bash
  # Agent runs:
  cat package.json
  # Assert: contains "@rspack/cli", "react", "react-dom", "express", "tailwindcss" in dependencies
  # Assert: contains "start": "node server.ts" in scripts
  ```

  **Evidence to Capture**:
  - [ ] package.json content

  **Commit**: NO (groups with Task 2)

- [x] 2. 目录结构创建

  **What to do**:
  - [ ] 创建前端源码目录: `src/`, `src/components/`, `src/lib/`, `src/assets/`
  - [ ] 创建数据存储目录: `data/screenshots/`, `data/annotations/`
  - [ ] 创建输出目录: `output/`
  - [ ] 创建配置文件: `tsconfig.json`, `postcss.config.js`, `tailwind.config.js`

  **Must NOT do**:
  - 不要创建测试目录
  - 不要创建数据库目录

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Simple directory creation, standard bash commands
  - **Skills**: `[]`
    - `none`: No specialized skills needed for mkdir
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for directory creation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3) | Sequential
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 1

  **References** (CRITICAL - Be Exhaustive):

  **Documentation References** (specs and requirements):
  - Project structure defined in draft: `.sisyphus/drafts/airtest-template-manager.md` - Directory layout requirements

  **WHY Each Reference Matters** (explain the relevance):
  - Draft file: Contains the agreed-upon directory structure for screenshots, annotations, and output

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For directory structure** (using Bash):
  ```bash
  # Agent runs:
  ls -la src/ src/components/ src/lib/ data/screenshots/ data/annotations/ output/
  # Assert: All directories exist
  ```

  **Evidence to Capture**:
  - [ ] Directory listing output

  **Commit**: NO (groups with Task 1)

- [x] 3. TypeScript类型定义

  **What to do**:
  - [ ] 创建 `src/types/index.ts` 包含所有类型定义:
    - `Screenshot`: {id, filename, name, group, uploadTime}
    - `Annotation`: {id, name, rect: {x, y, width, height}, relativeRect: {x, y, width, height}, screenshotId}
    - `AnnotationData`: {screenshotId, currentAnnotations: Annotation[], versions: Version[]}
    - `Version`: {timestamp, annotations: Annotation[], description}
    - `Group`: 'login' | 'game_main' | 'gameplay' | 'other'
  - [ ] 配置 `tsconfig.json` 启用严格模式和路径别名

  **Must NOT do**:
  - 不要使用any类型

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Type definition is straightforward, follows TypeScript best practices
  - **Skills**: `[]`
    - `none`: No specialized skills needed for TypeScript types
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not needed for type definitions

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2) | Sequential
  - **Blocks**: Tasks 8, 9, 10, 11
  - **Blocked By**: Task 1

  **References** (CRITICAL - Be Exhaustive):

  **Documentation References** (specs and requirements):
  - Draft decisions: `.sisyphus/drafts/airtest-template-manager.md` - Type definitions from requirements
  - TypeScript docs: `https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html` - Type definition best practices

  **WHY Each Reference Matters** (explain the relevance):
  - Draft file: Contains the exact data structures agreed upon (current+history arrays, relative+absolute coords)
  - TypeScript docs: Provides guidance on proper TypeScript type definitions

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For TypeScript compilation** (using Bash):
  ```bash
  # Agent runs:
  npx tsc --noEmit src/types/index.ts
  # Assert: Exit code 0 (no compilation errors)
  ```

  **Evidence to Capture**:
  - [ ] TypeScript compiler output

  **Commit**: NO (groups with Task 1)

- [ ] 4. Rspack配置

  **What to do**:
  - [ ] 创建 `rspack.config.ts` 配置文件
  - [ ] 配置入口点: `src/index.tsx`
  - [ ] 配置输出: `dist/` 目录
  - [ ] 配置React插件和TypeScript加载器
  - [ ] 配置TailwindCSS CSS加载器
  - [ ] 配置开发服务器: host 0.0.0.0, 自动分配端口
  - [ ] 配置HTML插件生成入口HTML文件

  **Must NOT do**:
  - 不要配置额外的优化插件（保持简单）

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: Rspack configuration requires understanding of modern bundler configuration
  - **Skills**: `[]`
    - `none`: No specialized skills needed for Rspack config
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not needed for build configuration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7) | Sequential
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1, 3

  **References** (CRITICAL - Be Exhaustive):

  **API/Type References** (contracts to implement against):
  - Rspack API: `https://www.rspack.dev/config/` - Rspack configuration options

  **Documentation References** (specs and requirements):
  - Rspack docs: `https://www.rspack.dev/guide/start.html` - Quick start configuration
  - Rspack React plugin: `https://www.rspack.dev/plugins/rspack-react/` - React plugin configuration

  **WHY Each Reference Matters** (explain the relevance):
  - Rspack config docs: Required for understanding configuration object structure
  - Rspack React plugin: Needed for proper React Fast Refresh support

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For Rspack build** (using Bash):
  ```bash
  # Agent runs:
  npx rspack build --config rspack.config.ts
  # Assert: Exit code 0
  # Assert: dist/ directory created with index.html and bundle files
  ```

  **Evidence to Capture**:
  - [ ] Rspack build output
  - [ ] dist/ directory listing

  **Commit**: NO (groups with Task 5)

- [x] 5. Express REST API服务器

  **What to do**:
  - [ ] 创建 `server.ts` 主服务器文件
  - [ ] 配置Express应用: JSON解析、CORS、文件上传(multer)
  - [ ] 实现健康检查端点: `GET /api/health`
  - [ ] 配置静态文件服务: `/dist` 目录（前端）和 `/data/screenshots`（截图）
  - [ ] 实现自动端口分配逻辑（使用get-port或类似库）
  - [ ] 实现服务器启动脚本，启动后在控制台显示URL

  **Must NOT do**:
  - 不要实现用户认证
  - 不要配置HTTPS（仅HTTP）

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: Express server setup is standard but requires understanding of middleware and routing
  - **Skills**: `[]`
    - `none`: No specialized skills needed for Express setup
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for server setup

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7) | Sequential
  - **Blocks**: Tasks 6, 12
  - **Blocked By**: Tasks 1, 3

  **References** (CRITICAL - Be Exhaustive):

  **External References** (libraries and frameworks):
  - Express docs: `https://expressjs.com/en/4x/api.html` - Express API reference
  - Multer docs: `https://github.com/expressjs/multer` - File upload middleware

  **WHY Each Reference Matters** (explain the relevance):
  - Express docs: Required for understanding Express application setup and middleware
  - Multer docs: Needed for proper file upload configuration

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For server startup** (using Bash):
  ```bash
  # Agent runs (in background):
  npm start &
  sleep 3
  curl -s http://localhost:[PORT]/api/health
  # Assert: Returns JSON with status: "ok"
  # Kill server after test
  ```

  **Evidence to Capture**:
  - [ ] Server startup output showing port
  - [ ] curl response for /api/health

  **Commit**: NO (groups with Task 4)

- [x] 6. API路由和数据存储层

  **What to do**:
  - [ ] 创建 `server/api/screenshotRoutes.ts` 实现截图管理API:
    - `POST /api/screenshots` - 上传截图
    - `GET /api/screenshots` - 获取所有截图列表（支持搜索）
    - `GET /api/screenshots/:id` - 获取单个截图详情
    - `DELETE /api/screenshots/:id` - 删除截图
  - [ ] 创建 `server/api/annotationRoutes.ts` 实现标注管理API:
    - `GET /api/annotations/:screenshotId` - 获取截图的标注
    - `POST /api/annotations/:screenshotId` - 保存标注（创建新版本）
    - `PUT /api/annotations/:screenshotId` - 更新当前标注
    - `GET /api/annotations/:screenshotId/versions` - 获取版本历史
    - `POST /api/annotations/:screenshotId/rollback/:versionId` - 回滚到指定版本
  - [ ] 创建 `server/api/pythonRoutes.ts` 实现Python生成API:
    - `POST /api/python/generate` - 生成Python模版枚举文件
  - [ ] 创建 `server/lib/fileStorage.ts` 实现文件存储逻辑:
    - 保存截图文件到 `data/screenshots/`
    - 读取/写入标注JSON文件到 `data/annotations/`
    - 实现版本管理逻辑（当前+历史数组）

  **Must NOT do**:
  - 不要使用数据库
  - 不要实现复杂的事务逻辑

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: API routing and file storage requires understanding of REST patterns and file I/O
  - **Skills**: `[]`
    - `none`: No specialized skills needed for Express routing
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for API implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7) | Sequential
  - **Blocks**: Task 12
  - **Blocked By**: Task 5

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - Express routing pattern: `server.ts` - Mount routes in main server

  **API/Type References** (contracts to implement against):
  - Type definitions: `src/types/index.ts` - Use defined types for request/response

  **External References** (libraries and frameworks):
  - Express routing: `https://expressjs.com/en/guide/routing.html` - Express routing guide
  - File system API: `https://nodejs.org/api/fs.html` - Node.js file system operations

  **WHY Each Reference Matters** (explain the relevance):
  - Express routing: Essential for understanding Express router and route handler patterns
  - Type definitions: Ensures API contracts match TypeScript types
  - File system API: Required for JSON file read/write operations

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For API endpoints** (using Bash curl):
  ```bash
  # Agent runs:
  # Upload a test image
  curl -X POST http://localhost:[PORT]/api/screenshots \
    -F "file=@test-image.png" \
    -F "name=Test Screenshot" \
    -F "group=login" \
    | jq '.id'
  # Assert: Returns screenshot ID

  # Get screenshots list
  curl -s http://localhost:[PORT]/api/screenshots | jq '.[] | .name'
  # Assert: Returns "Test Screenshot"

  # Save annotation
  curl -X POST http://localhost:[PORT]/api/annotations/[SID] \
    -H "Content-Type: application/json" \
    -d '{"annotations": [{"name": "Button", "rect": {"x": 10, "y": 10, "width": 100, "height": 50}}]}'
  # Assert: Returns success status

  # Generate Python
  curl -X POST http://localhost:[PORT]/api/python/generate \
    -H "Content-Type: application/json" \
    -d '{}'
  # Assert: Returns Python code in response
  # Assert: output/templates.py file exists
  ```

  **Evidence to Capture**:
  - [ ] API response JSON for each endpoint
  - [ ] Generated Python code content

  **Commit**: YES | NO (groups with N)
  - Message: `feat(api): implement REST API routes and file storage`
  - Files: `server/api/`, `server/lib/`
  - Pre-commit: none

- [x] 7. Python生成器

  **What to do**:
  - [ ] 创建 `server/lib/pythonGenerator.ts` 实现Python代码生成:
    - 读取所有标注JSON文件
    - 生成Python字典，格式为: `Templates = {'ui_name': Template(r'path/to/image.png', ...)}` 
    - 每个Template实例包含: `record_pos` 元组 (UI元素位置), `target_pos` 元组 (模板位置), `resolution` 元组
    - 生成的代码按分组组织
  - [ ] 实现坐标转换: 将标注的矩形框转换为Airtest Template的 `record_pos` 格式
  - [ ] 生成代码写入到 `output/templates.py`
  - [ ] 在保存标注时自动触发Python生成

  **Must NOT do**:
  - 不要生成不完整的Python代码
  - 不要硬编码文件路径（使用相对路径）

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: Python code generation requires understanding of Airtest Template format and string manipulation
  - **Skills**: `[]`
    - `none`: No specialized skills needed for code generation
  - **Skills Evaluated but Omitted**:
    - `librarian`: Not needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6) | Sequential
  - **Blocks**: Tasks 11, 12
  - **Blocked By**: Tasks 3, 6

  **References** (CRITICAL - Be Exhaustive):

  **Documentation References** (specs and requirements):
  - Draft decision: `.sisyphus/drafts/airtest-template-manager.md` - Python output format requirement

  **External References** (libraries and frameworks):
  - Airtest docs: `https://airtest.readthedocs.io/en/latest/` - Airtest documentation for Template usage

  **WHY Each Reference Matters** (explain the relevance):
  - Draft file: Specifies the exact Python output format needed (Template instances)
  - Airtest docs: Provides Template class constructor parameters and usage examples

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For Python generation** (using Bash):
  ```bash
  # Agent runs:
  # Ensure there's at least one annotation file
  ls data/annotations/
  # Call generate endpoint
  curl -X POST http://localhost:[PORT]/api/python/generate \
    -H "Content-Type: application/json" \
    -d '{}'
  # Assert: output/templates.py exists
  cat output/templates.py
  # Assert: Contains "from airtest.core.api import *"
  # Assert: Contains "Templates = {"
  # Assert: Contains "Template(" and "record_pos"
  ```

  **Evidence to Capture**:
  - [ ] Generated Python file content
  - [ ] Terminal output from generation

  **Commit**: YES | NO (groups with N)
  - Message: `feat(python): implement Airtest Template code generator`
  - Files: `server/lib/pythonGenerator.ts`
  - Pre-commit: none

- [x] 8. React基础组件（布局、导航）

  **What to do**:
  - [ ] 创建 `src/index.tsx` 应用入口
  - [ ] 创建 `src/App.tsx` 主应用组件
  - [ ] 创建 `src/components/Layout.tsx` 布局组件（头部、侧边栏、内容区）
  - [ ] 创建 `src/components/Navigation.tsx` 导航菜单
  - [ ] 配置TailwindCSS在React中使用
  - [ ] 实现基本的路由或视图切换逻辑

  **Must NOT do**:
  - 不要使用外部UI库（使用TailwindCSS）
  - 不要实现复杂的路由（简单切换即可）

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `visual-engineering`
    - Reason: React UI components require frontend expertise and TailwindCSS styling
  - **Skills**: `[`frontend-ui-ux`]`
    - `frontend-ui-ux`: Specialized in crafting stunning UI/UX with TailwindCSS
  - **Skills Evaluated but Omitted**:
    - `dev-browser`: Not needed for component implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10) | Sequential
  - **Blocks**: Tasks 9, 10
  - **Blocked By**: Tasks 2, 3, 4

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - TailwindCSS setup: `tailwind.config.js` - Use configured theme and paths

  **API/Type References** (contracts to implement against):
  - Type definitions: `src/types/index.ts` - Use defined types for component props

  **Documentation References** (specs and requirements):
  - TailwindCSS docs: `https://tailwindcss.com/docs/utility-first-principles` - TailwindCSS utility classes
  - React docs: `https://react.dev/learn/thinking-in-react` - React component design principles

  **WHY Each Reference Matters** (explain the relevance):
  - TailwindCSS docs: Provides utility class reference for styling
  - Type definitions: Ensures component props are properly typed

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For React components** (using Playwright via playwright skill):
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:[PORT]
  2. Wait for: selector ".app-container" to be visible
  3. Assert: header navigation is present (selector "nav")
  4. Assert: layout has sidebar and main content area
  5. Screenshot: .sisyphus/evidence/task-8-layout.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of layout
  - [ ] HTML structure

  **Commit**: YES | NO (groups with N)
  - Message: `feat(ui): create layout and navigation components`
  - Files: `src/index.tsx`, `src/App.tsx`, `src/components/Layout.tsx`, `src/components/Navigation.tsx`
  - Pre-commit: none

- [ ] 9. 截图上传和管理组件

  **What to do**:
  - [ ] 创建 `src/components/ScreenshotManager.tsx` 截图管理组件
  - [ ] 实现截图上传功能（拖拽和点击上传）
  - [ ] 实现截图列表显示（卡片或表格）
  - [ ] 实现截图删除功能
  - [ ] 实现按名称搜索过滤
  - [ ] 实现截图分组选择和显示
  - [ ] 集成API调用（使用src/lib/api.ts）

  **Must NOT do**:
  - 不要实现复杂的图片编辑功能
  - 不要实现图片预览的交互（只显示）

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `visual-engineering`
    - Reason: File upload UI and list management requires frontend UX expertise
  - **Skills**: `[`frontend-ui-ux`]`
    - `frontend-ui-ux`: Specialized in crafting intuitive file upload interfaces
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for component implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10) | Sequential
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 8

  **References** (CRITICAL - Be Exhaustive):

  **API/Type References** (contracts to implement against):
  - API routes: `server/api/screenshotRoutes.ts` - Use defined API endpoints
  - Type definitions: `src/types/index.ts` - Use Screenshot type

  **Documentation References** (specs and requirements):
  - React docs: `https://react.dev/reference/react/useState` - State management for upload progress
  - TailwindCSS docs: `https://tailwindcss.com/docs/hover-focus-and-other-states` - Interactive states for buttons

  **WHY Each Reference Matters** (explain the relevance):
  - API routes: Ensures component uses correct endpoints for CRUD operations
  - Type definitions: Guarantees type safety for screenshot data
  - React docs: Provides useState reference for managing upload state

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For screenshot upload** (using Playwright via playwright skill):
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:[PORT]
  2. Click: selector "button[data-testid='upload-btn']"
  3. Upload: input[type="file"] with test image
  4. Fill: input[name="name"] with "Test Screenshot"
  5. Select: select[name="group"] option "login"
  6. Click: button[type="submit"]
  7. Wait for: success message to appear
  8. Assert: screenshot appears in list
  9. Screenshot: .sisyphus/evidence/task-9-upload.png

  # Test search:
  10. Fill: input[placeholder*='search'] with "Test"
  11. Assert: Only "Test Screenshot" shown
  12. Screenshot: .sisyphus/evidence/task-9-search.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of upload flow
  - [ ] Screenshot of search results
  - [ ] API response data

  **Commit**: YES | NO (groups with N)
  - Message: `feat(ui): implement screenshot upload and management`
  - Files: `src/components/ScreenshotManager.tsx`, `src/lib/api.ts`
  - Pre-commit: none

- [ ] 10. 标注编辑器组件

  **What to do**:
  - [ ] 创建 `src/components/AnnotationEditor.tsx` 标注编辑器组件
  - [ ] 使用Canvas或SVG实现矩形框绘制
  - [ ] 实现鼠标拖拽创建矩形框
  - [ ] 实现矩形框的拖拽移动和调整大小
  - [ ] 实现矩形框的删除功能
  - [ ] 实现UI元素名称输入
  - [ ] 显示相对坐标和绝对坐标
  - [ ] 实现保存标注功能（调用API）
  - [ ] 实现版本提示（保存前显示变更对比）

  **Must NOT do**:
  - 不要实现其他形状（只支持矩形）
  - 不要实现复杂的图层管理

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `visual-engineering`
    - Reason: Canvas annotation editor requires complex interaction and rendering expertise
  - **Skills**: `[`frontend-ui-ux`]`
    - `frontend-ui-ux`: Specialized in crafting interactive UI components
  - **Skills Evaluated but Omitted**:
    - `json-canvas`: Not related to image annotation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9) | Sequential
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 3, 7, 9

  **References** (CRITICAL - Be Exhaustive):

  **API/Type References** (contracts to implement against):
  - API routes: `server/api/annotationRoutes.ts` - Use defined API endpoints
  - Type definitions: `src/types/index.ts` - Use Annotation type

  **Documentation References** (specs and requirements):
  - Canvas API: `https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API` - Canvas drawing reference
  - React docs: `https://react.dev/reference/react/useRef` - useRef for canvas reference

  **External References** (libraries and frameworks):
  - Konva.js: `https://konvajs.org/` - Canvas library for shapes and interactions (optional, can use native Canvas)

  **WHY Each Reference Matters** (explain the relevance):
  - Canvas API: Required for understanding canvas drawing and event handling
  - Konva.js: Provides simplified API for canvas shapes and interactions
  - Type definitions: Ensures annotation data structure matches API

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For annotation editor** (using Playwright via playwright skill):
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:[PORT]/screenshot/[SID]
  2. Wait for: selector "canvas" to be visible
  3. Move mouse to: {x: 100, y: 100}
  4. Drag to: {x: 200, y: 150}
  5. Assert: Rectangle box appears
  6. Fill: input[placeholder*='name'] with "Login Button"
  7. Assert: Coordinates displayed (relative and absolute)
  8. Click: button "Save"
  9. Wait for: success message
  10. Screenshot: .sisyphus/evidence/task-10-annotation.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of annotation editor
  - [ ] Saved annotation data (from API response)

  **Commit**: YES | NO (groups with N)
  - Message: `feat(ui): implement rectangle annotation editor`
  - Files: `src/components/AnnotationEditor.tsx`
  - Pre-commit: none

- [ ] 11. 版本历史和预览组件

  **What to do**:
  - [ ] 创建 `src/components/VersionHistory.tsx` 版本历史组件
  - [ ] 实现版本列表显示（时间戳、描述）
  - [ ] 实现版本回滚功能
  - [ ] 实现版本对比功能（高亮差异）
  - [ ] 创建 `src/components/PythonPreview.tsx` Python代码预览组件
  - [ ] 实现实时Python代码预览
  - [ ] 实现Python代码复制功能

  **Must NOT do**:
  - 不要实现复杂的diff算法（简单对比即可）

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `visual-engineering`
    - Reason: Version history UI and code preview require frontend UX expertise
  - **Skills**: `[`frontend-ui-ux`]`
    - `frontend-ui-ux`: Specialized in crafting intuitive version management interfaces
  - **Skills Evaluated but Omitted**:
    - `librarian`: Not needed for UI implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 12, 13) | Sequential
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 7, 10

  **References** (CRITICAL - Be Exhaustive):

  **API/Type References** (contracts to implement against):
  - API routes: `server/api/annotationRoutes.ts` - Use version endpoints
  - Type definitions: `src/types/index.ts` - Use Version type

  **Documentation References** (specs and requirements):
  - React docs: `https://react.dev/reference/react/useEffect` - useEffect for fetching version history
  - TailwindCSS docs: `https://tailwindcss.com/docs/typography-plugin` - Typography for code preview

  **WHY Each Reference Matters** (explain the relevance):
  - API routes: Ensures component uses correct version endpoints
  - React docs: Provides useEffect reference for async data fetching
  - Type definitions: Guarantees version data structure matches

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For version history** (using Playwright via playwright skill):
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:[PORT]/screenshot/[SID]/history
  2. Wait for: version list to load
  3. Assert: At least one version displayed
  4. Click: button "Rollback" on a version
  5. Assert: Confirmation dialog appears
  6. Click: "Confirm"
  7. Wait for: success message
  8. Screenshot: .sisyphus/evidence/task-11-version.png
  ```

  **For Python preview**:
  ```
  # Agent executes via playwright browser automation:
  1. Click: tab/button "Python Preview"
  2. Assert: Python code displayed in code block
  3. Assert: Contains "from airtest.core.api import *"
  4. Assert: Contains "Templates = {"
  5. Screenshot: .sisyphus/evidence/task-11-python.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of version history
  - [ ] Screenshot of Python preview
  - [ ] API response for version list

  **Commit**: YES | NO (groups with N)
  - Message: `feat(ui): implement version history and Python preview`
  - Files: `src/components/VersionHistory.tsx`, `src/components/PythonPreview.tsx`
  - Pre-commit: none

- [ ] 12. 集成测试和启动命令

  **What to do**:
  - [ ] 集成所有组件到主应用
  - [ ] 实现完整的用户流程测试（上传→标注→保存→生成Python）
  - [ ] 验证 `npm start` 命令正常工作
  - [ ] 验证自动端口分配正常工作
  - [ ] 验证文件存储正常工作
  - [ ] 验证Python生成正常工作
  - [ ] 添加基本的错误处理和用户提示

  **Must NOT do**:
  - 不要实现单元测试
  - 不要实现E2E测试框架

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: Integration requires understanding of full application flow
  - **Skills**: `[`frontend-ui-ux`, `playwright`]`
    - `frontend-ui-ux`: For UI integration
    - `playwright`: For end-to-end manual verification
  - **Skills Evaluated but Omitted**:
    - `find-skills`: Not needed for integration

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (with Tasks 11, 13) | Sequential
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 6, 10, 11

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - All previous tasks: Use implementations from Tasks 1-11

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For full integration** (using Playwright via playwright skill):
  ```
  # Agent executes via playwright browser automation:
  1. Run: npm start (capture port)
  2. Navigate to: http://localhost:[PORT]
  3. Upload: test screenshot "game_login.png"
  4. Fill: name "Login Screen", group "login"
  5. Click: Save
  6. Navigate to: annotation editor for uploaded screenshot
  7. Draw: rectangle at {x: 50, y: 50, w: 100, h: 40}
  8. Fill: name "Login Button"
  9. Click: Save Annotation
  10. Click: Python Preview tab
  11. Assert: Python code contains "Login Button"
  12. Assert: output/templates.py file exists and contains code
  13. Screenshot: .sisyphus/evidence/task-12-integration.png
  ```

  **Evidence to Capture**:
  - [ ] Full workflow screenshots
  - [ ] output/templates.py content
  - [ ] data/annotations/ JSON file content
  - [ ] Terminal output from npm start

  **Commit**: YES | NO (groups with N)
  - Message: `feat(integration): integrate all components and verify workflow`
  - Files: `src/App.tsx`, various component updates
  - Pre-commit: none

- [ ] 13. 文档和README

  **What to do**:
  - [ ] 创建 `README.md` 项目文档
    - 项目介绍
    - 功能特性
    - 技术栈
    - 安装和启动说明
    - 使用指南
    - API文档
  - [ ] 创建 `ARCHITECTURE.md` 架构文档
    - 项目结构
    - 数据模型
    - API端点列表
  - [ ] 添加代码注释

  **Must NOT do**:
  - 不要创建复杂的文档网站

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `writing`
    - Reason: Documentation requires clear writing and organization
  - **Skills**: `[`frontend-ui-ux`]`
    - `frontend-ui-ux`: For documenting UI/UX decisions
  - **Skills Evaluated but Omitted**:
    - `skill-creator`: Not creating a skill

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (with Tasks 11, 12) | Sequential
  - **Blocks**: None (final)
  - **Blocked By**: Task 12

  **References** (CRITICAL - Be Exhaustive):

  **Documentation References** (specs and requirements):
  - Draft file: `.sisyphus/drafts/airtest-template-manager.md` - Source of truth for requirements

  **WHY Each Reference Matters** (explain the relevance):
  - Draft file: Contains all agreed-upon features and decisions to document

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification (ALWAYS include, choose by deliverable type):**

  **For documentation** (using Bash):
  ```bash
  # Agent runs:
  cat README.md
  # Assert: Contains "Airtest Template Manager"
  # Assert: Contains "npm start" in installation section
  # Assert: Contains API endpoint examples

  cat ARCHITECTURE.md
  # Assert: Contains data model descriptions
  # Assert: Contains API endpoint list
  ```

  **Evidence to Capture**:
  - [ ] README.md content
  - [ ] ARCHITECTURE.md content

  **Commit**: YES | NO (groups with N)
  - Message: `docs: add README and architecture documentation`
  - Files: `README.md`, `ARCHITECTURE.md`
  - Pre-commit: none

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1-3 | `chore: initialize project structure and dependencies` | package.json, tsconfig.json, postcss.config.js, tailwind.config.js | npm install |
| 4-5 | `feat: configure Rspack and Express server` | rspack.config.ts, server.ts | npm start |
| 6 | `feat(api): implement REST API routes and file storage` | server/api/, server/lib/ | curl tests |
| 7 | `feat(python): implement Airtest Template code generator` | server/lib/pythonGenerator.ts | curl POST /api/python/generate |
| 8 | `feat(ui): create layout and navigation components` | src/index.tsx, src/App.tsx, src/components/Layout.tsx, src/components/Navigation.tsx | playwright screenshot |
| 9 | `feat(ui): implement screenshot upload and management` | src/components/ScreenshotManager.tsx, src/lib/api.ts | playwright upload test |
| 10 | `feat(ui): implement rectangle annotation editor` | src/components/AnnotationEditor.tsx | playwright annotation test |
| 11 | `feat(ui): implement version history and Python preview` | src/components/VersionHistory.tsx, src/components/PythonPreview.tsx | playwright version test |
| 12 | `feat(integration): integrate all components and verify workflow` | src/App.tsx, various | playwright E2E |
| 13 | `docs: add README and architecture documentation` | README.md, ARCHITECTURE.md | cat files |

---

## Success Criteria

### Verification Commands
```bash
# Start server
npm start
# Expected: Server started on port XXXX

# Health check
curl http://localhost:XXXX/api/health
# Expected: {"status":"ok"}

# Full workflow test (manual verification documented in tasks)
```

### Final Checklist
- [ ] 所有 "Must Have" 功能已实现
- [ ] 所有 "Must NOT Have" 功能未实现
- [ ] npm start 命令正常启动WebUI
- [ ] 截图上传和管理正常工作
- [ ] 矩形框标注正常工作
- [ ] 版本管理正常工作
- [ ] Python模版枚举文件正常生成
- [ ] 项目文档完整
