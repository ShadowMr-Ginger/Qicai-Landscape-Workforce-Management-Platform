# 交接文档：绿化工人管理系统

> 生成时间：2026-07-08
> 本文件用于新对话快速接手项目，不需要回顾全部历史。

---

## 一、项目概况

| 项目 | 路径 | 技术栈 |
|---|---|---|
| 管理后台 Web | `landscape-admin-web/` | Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| 后端服务 | `green-worker-management-system/` | Spring Boot 3.2.5 + MyBatis-Plus + Java 17 + MySQL 8 |
| 司机/管理员小程序 | `green-driver-weapp/miniprogram/` | 微信原生 + TypeScript |

运行端口（远程服务器）：
- 后端：8081
- Web 管理后台：3001

远程服务器：
- IP：`47.109.68.155`
- SSH 指令：
  ```bash
  ssh -i /c/Users/Ginger-Hsu/Desktop/GingerHsu.pem root@47.109.68.155
  ```
- 项目部署目录：`/home/deploy/qicai`

---

## 二、部署/推送说明（重要）

1. **所有代码修改都在本地仓库完成**，提交并推送到 GitHub 后，由 **GitHub Actions CI/CD** 自动更新远程服务器上的软件。
2. 本地网络直连 GitHub 经常超时，当前可用的推送方式是 **经服务器做 SOCKS 隧道**（最近一次成功推送使用端口 `1082`，端口可自定义）：
   ```bash
   # 1. 建立隧道（后台运行，端口可换为未占用端口）
   ssh -i /c/Users/Ginger-Hsu/Desktop/GingerHsu.pem -N -D 127.0.0.1:1082 root@47.109.68.155

   # 2. 配置 git 走 socks5h 代理（让服务器远程解析 DNS）
   git config http.proxy socks5h://127.0.0.1:1082
   git config https.proxy socks5h://127.0.0.1:1082

   # 3. 推送
   git push origin main

   # 4. 清理代理配置（可选，建议清理）
   git config --unset http.proxy
   git config --unset https.proxy
   ```
3. 最近一次推送：`bb5d214..70f732f main -> main` 已成功，对应 GitHub Actions 运行 `28900675793` 结论为 **success**，服务器已自动部署。
4. 远程服务器仓库 `/home/deploy/qicai` 目前存在本地未提交的部署产物；如需要可登录服务器后手动处理。

---

## 三、当前已完成（无需重复做）

### 1. 项目内常用服务
- 新增表 `project_common_services`，按项目隔离常用服务。
- 后端：`ProjectCommonServiceEntity`、`Mapper`、`Service`、`Controller` 已完成；保存台账/营业记录时会自动把新服务名称写入项目常用服务。
- 前端：项目详情弹窗内左侧显示项目常用服务面板；新增/编辑使用右侧 Sheet；可基于全局常用服务作为模板。

### 2. 营业记录导出
- 后端支持 Word / Excel 导出（POI），包含标题、分页小计、合计、行高、边距等。
- 前端导出对话框，文件名在客户端生成：`yyyy.mm.dd~yyyy.mm.dd - 项目名称 - 绿化用工`。

### 3. 全局常用服务基础单价
- 表 `common_service_names` 增加 `base_price`。
- 管理页面支持新增/编辑基础单价。

### 4. 工人类型支持"未选择/空"
- 数据库 `worker_type` 改为可空；前端下拉增加空白选项，保存为 `null`。

### 5. 营业记录更新/删除稳定性
- 前端路径修正为 `/admin/projects/revenue-records/{id}`。
- 旧营业记录表已废弃，相关写操作已迁移到「记录台账」。

### 6. 记录台账模块（已上线）
- 数据库：新增 `ledgers` 主表和 `ledger_items` 明细表；废弃并删除旧表 `project_revenue_records` / `project_revenue_record_items`。
- 后端：新增 `LedgerEntity`、`LedgerItemEntity`、`Mapper`、`Service`、`Controller`（`/api/admin/ledgers`）。
  - 台账保存/更新/删除均为事务方法。
  - 删除为逻辑删除，同时级联删除 `ledger_items`。
  - 保存用工记录时自动写入/更新 `project_common_services`。
- 前端：新增 `/ledgers` 页面与 `LedgerDialog` 对话框。
  - 列表默认筛选近一个月，支持项目与日期范围筛选、分页。
  - 对话框内选择日期/项目后锁定，再录入用工记录；支持拖拽排序、项目常用服务模板填充。
  - 用工记录 Sheet 用于选择项目内常用服务，自动填充单价与工人类型。
- 项目详情中的营业记录：已移除新增/编辑/删除/复制入口，仅保留查看与导出；数据来自 `ledgers`/`ledger_items` 只读投影。

### 7. 菜单位置调整
- 「记录台账」已从「考勤管理」子菜单提升为左侧一级菜单。
- 当前菜单顺序：首页概览 → 工人管理 → 司机管理 → 考勤管理 → **记录台账** → 工资结算 → ...
- 图标使用 `BookOpen`。

---

## 四、当前阶段：Bug 修复

**当前所有代码均已推送并部署成功，下一阶段开始集中修复 Bug。**

请在继续前补充/确认待修复 Bug 清单：

| 序号 | 问题描述 | 影响范围 | 优先级 | 备注 |
|---|---|---|---|---|
| 1 | 列表筛选后分页未重置：例如工人/司机/考勤记录总表共有 91 条数据分 10 页，筛选后仅剩 10 条，但前端仍按原 10 页分页展示，导致 10 条记录分散在多页中，甚至出现空页。筛选后应当重新请求列表并把页码重置为第 1 页。 | 前端：工人列表、司机列表、考勤记录总表页面 | 高 | 后端接口可能已正确返回筛选后的总数/分页；问题大概率在前端没有重置 `pageNum` 并重新拉取数据 |
| 2 | 微信小程序管理员端，「今日司机考勤」和「今日工人考勤」入口点击进入后，应自动按中国时间当天日期筛选司机/工人考勤记录，而不是直接展示未筛选的总表。 | 微信小程序：管理员端首页入口 → 司机考勤记录总表 / 工人考勤记录总表 | 高 | 需要在页面跳转时携带当天日期参数，目标页面初始化时读取参数并应用日期筛选 |
| 3 | （待填写） |  |  |  |

**建议修复流程**：
1. 在本地复现并定位问题。
2. 修改后尽量补充相关测试/回归验证。
3. 提交并按「二、部署/推送说明」推送到 `main`，等待 CI/CD 自动部署。
4. 部署后登录服务器或访问线上环境验证修复效果。

---

## 五、常用命令

```bash
# 后端编译
cd green-worker-management-system && mvn compile -DskipTests -q

# 后端重启（项目根目录）
bash restart-backend.sh

# Web 编译/构建
cd landscape-admin-web && npm run build

# 小程序 TS 编译
cd green-driver-weapp/miniprogram && npx tsc

# 推送（经服务器 SOCKS 隧道，端口可自定义）
ssh -i /c/Users/Ginger-Hsu/Desktop/GingerHsu.pem -N -D 127.0.0.1:1082 root@47.109.68.155 &
git config http.proxy socks5h://127.0.0.1:1082
git config https.proxy socks5h://127.0.0.1:1082
git push origin main
git config --unset http.proxy
git config --unset https.proxy
```

---

## 六、注意事项

1. **数据库迁移**：新表/字段统一放在 `sql/` 目录，部署时由 CI/CD 自动执行；手写迁移请遵循既有命名规范。
2. **Git 推送**：优先尝试直连 `git push origin main`，超时后立即切到服务器 SOCKS 隧道（`socks5h://`）。
3. **前端组件**：新增页面继续使用 Tailwind 语义化类名和 shadcn/ui 组件；注意 `.ts` 文件在小程序端不会被自动编译。
4. **后端规范**：逻辑删除字段统一为 `deleted`；版本控制字段为 `version`；实体继承 `BaseEntity`。
5. **远程服务器**：如需手动查看日志/重启服务，先 SSH 登录再操作；部署目录为 `/home/deploy/qicai`。
