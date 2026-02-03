## [2026-02-04] PixiJS 迁移问题记录

### 问题：delegate_task 返回 Unauthorized 错误

**症状**：
- 尝试使用 `delegate_task()` 委托任务时返回 "Failed to create session: Unauthorized"
- 尝试了多种方式：
  - `category="writing"` + `load_skills=[]`
  - `category="quick"` + `load_skills=[]`
  - `subagent_type="quick"`
- 所有尝试都返回相同的错误

**影响**：
- 无法按照 orchestrator 规范委托任务给 subagent
- 系统要求 "You are an ORCHESTRATOR, not an IMPLEMENTER" - 不应直接编辑代码
- 但委托功能不可用，导致无法继续工作

**可能的根本原因**：
1. OpenCode 系统配置问题
2. API 密钥或权限问题
3. 系统维护或限制

**需要的决策**：
1. 是否可以临时绕过 "不直接编辑代码" 的限制？
2. 是否有其他委托方法？
3. 是否需要系统管理员介入？

### 用户需求记录

用户要求：
1. 使用 PixiJS v8 实现标注器
2. 替换现有 AnnotationEditor.tsx 组件
3. 标注数据存储使用 gl2D 格式

### 已完成的工作

1. ✅ 安装了 PixiJS v8 依赖
2. ✅ 研究了 LabelMe JSON 格式规范
3. ✅ 研究了 PixiJS v8 的交互和图形 API

### 待完成的工作

1. 定义 gl2D 标注数据格式类型
2. 创建 PixiJSAnnotationEditor 组件
3. 实现矩形绘制功能
4. 实现标注选择和编辑
5. 实现 gl2D 格式的保存和加载
6. 更新 API 路由
7. 集成到现有应用
8. 测试和验证
