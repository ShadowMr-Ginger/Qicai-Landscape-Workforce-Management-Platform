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
2. 本地网络直连 GitHub 经常超时，当前可用的推送方式是 **经服务器做 SOCKS 隧道**：
   ```bash
   # 1. 建立隧道（后台运行）
   ssh -i /c/Users/Ginger-Hsu/Desktop/GingerHsu.pem -N -D 127.0.0.1:1080 root@47.109.68.155

   # 2. 配置 git 走 socks5h 代理（注意是 socks5h，让服务器远程解析 DNS）
   git config http.proxy socks5h://127.0.0.1:1080
   git config https.proxy socks5h://127.0.0.1:1080

   # 3. 推送
   git push origin main

   # 4. 清理代理配置
   git config --unset http.proxy
   git config --unset https.proxy
   ```
3. 远程服务器仓库 `/home/deploy/qicai` 目前存在本地未提交的部署产物；本次为推送临时 stash 了一份，如需要可登录服务器后手动处理。

---

## 三、当前已完成（无需重复做）

### 1. 项目内常用服务
- 新增表 `project_common_services`，按项目隔离常用服务。
- 后端：`ProjectCommonServiceEntity`、`Mapper`、`Service`、`Controller` 已完成；保存营业记录时会自动把新服务名称写入项目常用服务。
- 前端：项目详情弹窗内左侧显示项目常用服务面板；新增/编辑使用右侧 Sheet；可基于全局常用服务作为模板。
- 营业记录服务项下拉使用项目自身常用服务，单价/类型自动填充。

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
- 更新时子表先删后插，避免主键冲突；主表使用 `UpdateWrapper` 避免乐观锁失败。

---

## 四、下一步任务：记录台账

**目标**：新增一个「记录台账」大功能模块。

**当前状态**：需求尚未细化，需要与用户确认以下关键点后再开始实现：
1. 台账记录的具体业务对象是什么？（例如：项目收支台账、工人工资台账、设备/材料台账、还是综合经营台账？）
2. 需要哪些字段？（日期、项目、类型、金额、经手人、凭证、备注等）
3. 与现有模块（项目、营业记录、考勤、工资）的数据关联方式。
4. 需要的查询/筛选/导出能力。
5. 前端入口位置（独立菜单 `/ledger` 还是放在现有项目详情内？）。
6. 权限要求。

**建议先确认需求后再进行表设计、后端 API 和前端页面开发。**

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

# 推送（经服务器 SOCKS 隧道）
ssh -i /c/Users/Ginger-Hsu/Desktop/GingerHsu.pem -N -D 127.0.0.1:1080 root@47.109.68.155 &
git config http.proxy socks5h://127.0.0.1:1080
git config https.proxy socks5h://127.0.0.1:1080
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
