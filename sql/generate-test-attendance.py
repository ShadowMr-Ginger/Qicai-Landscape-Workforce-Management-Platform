#!/usr/bin/env python3
"""生成测试考勤数据"""
import random
import datetime
import pymysql

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Xjq@020319",
    "database": "landscape_workforce",
    "charset": "utf8mb4",
}

random.seed(42)

conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor()

# 1. 清空现有考勤数据
print("清理现有数据...")
cursor.execute("DELETE FROM worker_attendance_records")
cursor.execute("DELETE FROM driver_attendance_records")
cursor.execute("DELETE FROM attendance_batches")
conn.commit()

# 2. 获取基础数据
cursor.execute("SELECT id, gender, base_daily_salary, overtime_hourly_rate FROM workers WHERE is_employed=1 AND deleted=0")
workers = cursor.fetchall()

cursor.execute("SELECT id, base_daily_salary, overtime_hourly_rate FROM drivers WHERE is_active=1 AND deleted=0")
drivers = cursor.fetchall()

cursor.execute("SELECT id, male_daily_revenue, female_daily_revenue, gross_margin_rate FROM projects WHERE is_system=0 AND status=1")
projects = cursor.fetchall()

print(f"工人: {len(workers)}, 司机: {len(drivers)}, 项目: {len(projects)}")

# 3. 生成批次
work_types = [(1, "普通作业"), (2, "技术作业")]
now = datetime.datetime.now()

batch_id = 1
for day_offset in range(15):
    batch_date = (now - datetime.timedelta(days=day_offset)).strftime("%Y-%m-%d")
    driver = random.choice(drivers)
    driver_id = driver[0]
    driver_base = driver[1] or 300
    driver_ot_rate = driver[2] or 50

    # 创建批次
    cursor.execute(
        """INSERT INTO attendance_batches
        (driver_id, batch_date, status, remark, create_time, update_time, deleted, version)
        VALUES (%s, %s, 1, %s, NOW(), NOW(), 0, 1)""",
        (driver_id, batch_date, f"{batch_date} 考勤批次")
    )
    batch_db_id = cursor.lastrowid

    # 司机考勤记录
    driver_ot_hours = random.choice([0, 0, 0, 1, 2, 3])
    driver_ot_wage = round(driver_ot_rate * driver_ot_hours, 2)
    driver_total = round(driver_base + driver_ot_wage, 2)
    work_type_id = random.choice([1, 2])

    cursor.execute(
        """INSERT INTO driver_attendance_records
        (driver_id, attendance_date, attendance_type, overtime_hours, work_type_id,
         daily_wage, overtime_wage, total_wage, remark, is_settled, create_time, update_time, deleted, version, source_batch_id)
        VALUES (%s, %s, 2, %s, %s, %s, %s, %s, '', 0, NOW(), NOW(), 0, 1, %s)""",
        (driver_id, batch_date, driver_ot_hours, work_type_id, driver_base, driver_ot_wage, driver_total, batch_db_id)
    )

    # 工人考勤记录（5-8人）
    selected_workers = random.sample(workers, min(random.randint(5, 8), len(workers)))
    for w in selected_workers:
        worker_id, gender, base_salary, ot_rate = w
        base = base_salary or 200
        rate = ot_rate or 30
        att_type = random.choice([1, 2])
        att_type_val = 1 if att_type == 1 else 2
        actual_base = round(base / 2, 2) if att_type == 1 else base
        ot_hours = random.choice([0, 0, 0, 1, 2])
        ot_wage = round(rate * ot_hours, 2)
        total = round(actual_base + ot_wage, 2)
        project = random.choice(projects)
        project_id = project[0]
        wt_id = random.choice([1, 2])

        cursor.execute(
            """INSERT INTO worker_attendance_records
            (batch_id, driver_id, worker_id, project_id, attendance_date, attendance_type,
             overtime_hours, work_type_id, daily_wage, overtime_wage, total_wage, remark,
             is_settled, settled_time, settled_by, create_time, update_time, deleted, version)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, '', 0, NULL, NULL, NOW(), NOW(), 0, 1)""",
            (batch_db_id, driver_id, worker_id, project_id, batch_date, att_type_val,
             ot_hours, wt_id, actual_base, ot_wage, total)
        )

    batch_id += 1
    print(f"  生成批次 {batch_db_id} ({batch_date}): 司机 {driver_id}, 工人 {len(selected_workers)}")

conn.commit()
cursor.close()
conn.close()
print("完成！")
