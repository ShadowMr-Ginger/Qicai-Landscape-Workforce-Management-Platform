# 交接文档：绿化工人管理系统 — 后续待完成任务

> 生成时间：2026-06-08
> 本文件用于新对话快速接手项目，不需要回顾全部历史。

---

## 一、项目概况

| 项目 | 路径 | 技术栈 |
|---|---|---|
| 管理后台 Web | `landscape-admin-web/` | Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| 后端服务 | `green-worker-management-system/` | Spring Boot 3.2.5 + MyBatis-Plus 3.5.6 + MySQL 8 |
| 司机/管理员小程序 | `green-driver-weapp/miniprogram/` | 微信原生 + TypeScript |

运行端口：
- 后端：8080
- Web 管理后台：3000

---

## 二、当前已完成（无需重复做）

### 1. 司机考勤记录（批次审核）
- Web 端 `batches/page.tsx` 详情弹窗已增加黄色背景的司机考勤卡片
- 小程序管理员端 `batch-review-detail` 已增加司机考勤区块
- 后端 `AttendanceServiceImpl` 已增加 `buildDefaultDriverRecord`、`createDriverRecordForBatch`、`calculateDriverOvertimeWage` 等辅助方法
- 后端 `DriverAttendanceRecordVO` 已增加 `baseDailySalary`、`overtimeHourlyRate`
- 数据库迁移已应用：`worker_attendance_records.batch_id` 可空、新增 `driver_id` 列

### 2. 小程序管理员端工人考勤编辑
- `green-driver-weapp/miniprogram/pages/admin/batch-review-detail/index.ts`
- 已支持点击工人卡片打开底部编辑面板
- 已支持修改：出勤类型（全天/半天）、加班时长、日薪、备注
- 工资会根据出勤类型和加班时长自动重算

### 3. 深色模式 + 系统设置页面
- 已新增 `theme-store.ts` + `ThemeProvider`
- Header 右上角可切换浅色/深色/跟随系统
- 全站主要颜色已替换为语义化 CSS 变量，支持 `.dark`
- 系统设置页面 (`/settings`) 已完成：外观切换、账号信息、修改密码 UI、系统信息、退出登录

---

## 三、明确下一步要修改的任务

### 任务 A：小程序管理员端 — 编辑工人考勤时，增加「工地项目」和「作业类型」选择

**背景**：
- 小程序端 `batch-review-detail` 当前编辑工人时，只有出勤类型、加班时长、日薪、备注。
- 管理后台 Web 端可以修改工人的 `projectId`（工地项目）和 `workTypeId`（作业类型）。
- 小程序端也需要支持这两项修改。

**涉及文件**：
- `green-driver-weapp/miniprogram/pages/admin/batch-review-detail/index.ts`
- `green-driver-weapp/miniprogram/pages/admin/batch-review-detail/index.wxml`
- `green-driver-weapp/miniprogram/pages/admin/batch-review-detail/index.scss`

**关键信息**：
1. 批次详情接口 `/admin/attendance/batches/{id}` 返回的 `workerRecords` 中，每个工人已有：
   - `projectId` / `projectName`
   - `workTypeId` / `workTypeName`
2. 需要额外调用接口获取可选列表：
   - 项目列表：`getAllProjects()`（在 `miniprogram/utils/api.ts` 中可能未导出，需要确认）
   - 作业类型列表：`getWorkTypeList()`（同样在 api.ts 中确认）
3. `ReviewBatchDTO.WorkerRecordUpdateItem` 后端接收字段包含 `projectId` 和 `workTypeId`，payload 中直接传入即可。
4. 当前 `onApprove` 的 payload 已经包含了 `projectId` 和 `workTypeId`，所以只需要在前端编辑面板中增加这两个字段的选择即可。

**建议实现方式**：
- 在 `loadDetail` 中同时拉取项目列表和作业类型列表，存入 data
- 编辑面板增加两个 picker：
  - 工地项目 picker：`range="{{projectOptions}}" range-key="projectName"`，选中后设置 `editingWorker.projectId`
  - 作业类型 picker：`range="{{workTypeOptions}}" range-key="typeName"`，选中后设置 `editingWorker.workTypeId`
- 注意：picker 的 `value` 是数组下标（Number），需要转成对应的 `id`

---

### 任务 B：Web 管理端 + 小程序端 — 司机考勤卡片增加「日薪」编辑字段

**背景**：
- 当前两端司机考勤审核时，都只能修改「加班时长」和「备注」。
- 用户要求：日薪也应该可修改。初始提交考勤时，司机日薪 = 司机基础薪资 (`baseDailySalary`)，但在审核批次内应该允许调整。

**涉及文件**：
- Web 端：`landscape-admin-web/app/(dashboard)/batches/page.tsx`
- 小程序端：`green-driver-weapp/miniprogram/pages/admin/batch-review-detail/index.ts` + `index.wxml` + `index.scss`
- 后端：`green-worker-management-system/src/main/java/com/green/module/attendance/service/impl/AttendanceServiceImpl.java`

**关键信息**：

1. **Web 端当前代码位置**：
   - 搜索 `detailDriverRecord` 可定位司机卡片 JSX
   - 当前司机卡片有：出勤（只读）、加班时长（可编辑）、日薪（只读）、加班工资（只读）、备注（可编辑）
   - 需要把「日薪」改为可编辑 Input
   - `recalcDriverWages(record)` 当前基于 `baseDailySalary` 和 `overtimeHourlyRate` 重算
   - 当日薪被用户手动修改后，应使用用户输入的日薪 + `overtimeHourlyRate * overtimeHours` 重新计算 `totalWage`
   - 类似工人卡片的日薪编辑逻辑已经存在，可以直接参考

2. **小程序端当前代码位置**：
   - `index.ts` 中 `onDriverOvertimeChange` 已经会重算司机工资
   - 需要新增 `onDriverDailyWageChange(e)` 方法
   - 需要修改 `driver-item` 区块，把日薪从只读文本改为 `input type="digit"`
   - 重算逻辑：
     ```ts
     const dailyWage = parseFloat(e.detail.value) || 0
     const overtimeWage = editingDriverRecord.overtimeWage || 0
     const totalWage = Math.round((dailyWage + overtimeWage) * 100) / 100
     ```

3. **后端逻辑检查**：
   - `ReviewBatchDTO.DriverRecordUpdateItem` 当前字段：
     ```java
     @NotNull private Long recordId;
     private BigDecimal overtimeHours;
     private String remark;
     ```
   - **注意：这里缺少 `dailyWage` 字段！**
   - 需要扩展 DTO，增加 `dailyWage` 字段
   - `AttendanceServiceImpl.reviewBatch()` 中，更新司机记录的逻辑：
     ```java
     if (driverItem.getOvertimeHours() != null) {
         driverRec.setOvertimeHours(driverItem.getOvertimeHours());
     }
     if (driverItem.getRemark() != null) {
         driverRec.setRemark(driverItem.getRemark());
     }
     // 此处需要增加 dailyWage 处理
     if (driverItem.getDailyWage() != null) {
         driverRec.setDailyWage(driverItem.getDailyWage());
     }
     // 然后基于新的 dailyWage + 重算后的 overtimeWage 更新 totalWage
     ```
   - 当前后端在 `reviewBatch` 里会重新根据 `driver.getBaseDailySalary()` 覆盖 `dailyWage`，这个逻辑需要调整：如果前端传了 `dailyWage`，优先使用前端值；否则才回退到基础薪资。

4. **Web 端 payload**：
   - `handleReview` 中的 `driverRecord` payload 当前只传：
     ```ts
     payload.driverRecord = {
       recordId: detailDriverRecord.id,
       overtimeHours: detailDriverRecord.overtimeHours,
       remark: detailDriverRecord.remark,
     }
   - 需要增加 `dailyWage: detailDriverRecord.dailyWage`

5. **小程序端 payload**：
   - `onApprove` 中的 `driverRecord` payload 当前只传 `recordId`、`overtimeHours`、`remark`
   - 需要增加 `dailyWage`

---

## 四、修改清单（Checklist）

- [ ] 后端 DTO：`ReviewBatchDTO.DriverRecordUpdateItem` 增加 `dailyWage` 字段
- [ ] 后端 Service：`AttendanceServiceImpl.reviewBatch()` 处理司机 `dailyWage`，优先使用前端传入值
- [ ] Web 管理端：`batches/page.tsx` 司机卡片中日薪改为可编辑
- [ ] Web 管理端：`batches/page.tsx` `handleReview` payload 增加 `dailyWage`
- [ ] 小程序端：`batch-review-detail/index.ts` 新增 `onDriverDailyWageChange`
- [ ] 小程序端：`batch-review-detail/index.wxml` 司机区块增加日薪输入
- [ ] 小程序端：`batch-review-detail/index.ts` `onApprove` payload 增加 `dailyWage`
- [ ] 小程序端：`batch-review-detail/index.ts` 拉取项目/作业类型列表
- [ ] 小程序端：`batch-review-detail/index.wxml` 编辑面板增加项目和作业类型 picker
- [ ] 验证 `mvn compile`、`npx tsc`、`npm run build` 均通过
- [ ] 验证后端重启后功能正常

---

## 五、常用命令

```bash
# 后端编译
cd green-worker-management-system && mvn compile -q

# 后端重启（项目根目录）
bash restart-backend.sh

# Web 编译
cd landscape-admin-web && npm run build

# 小程序 TS 编译
cd green-driver-weapp/miniprogram && npx tsc

# 小程序 SCSS 编译（单文件）
cd green-driver-weapp/miniprogram
npx sass --style=expanded --no-source-map pages/admin/batch-review-detail/index.scss pages/admin/batch-review-detail/index.wxss
```

---

## 六、注意事项

1. **数据库**：`worker_attendance_records` 的 `driver_id` 列和 `batch_id` 可空已经通过 `sql/migrate-driver-record.sql` 应用，不需要重复执行。
2. **主题/深色模式**：全站颜色已替换为语义化变量，新增页面/组件请继续使用 `bg-card`、`text-foreground`、`border-border` 等，避免写死 `bg-gray-*`。
3. **批次备注策略**：批次级备注只进入司机考勤记录，工人记录保留各自的 per-worker remark。
4. **司机考勤设计**：司机始终 `attendanceType = 2`（全天），没有 `projectId` 和 `workTypeId`。
5. **微信小程序 picker 注意**：`range` 绑定对象数组时需要用 `range-key` 指定显示字段，`value` 返回的是数组下标字符串，需要手动转成对应 id。
