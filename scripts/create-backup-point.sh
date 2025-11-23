#!/bin/bash

# 创建备份点的脚本
# 用法: ./scripts/create-backup-point.sh <backup-name>

BACKUP_NAME=$1

if [ -z "$BACKUP_NAME" ]; then
  echo "❌ 错误: 请提供备份名称"
  echo "用法: ./scripts/create-backup-point.sh <backup-name>"
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="backup-${BACKUP_NAME}-${TIMESTAMP}"

echo "📦 创建备份点: ${BRANCH_NAME}"

# 1. 创建备份分支
git checkout -b "${BRANCH_NAME}"

# 2. 提交当前状态
git add -A
git commit -m "backup: ${BACKUP_NAME} at ${TIMESTAMP}"

# 3. 推送到 GitHub
git push origin "${BRANCH_NAME}"

# 4. 回到主分支
git checkout main

echo "✅ 备份点已创建: ${BRANCH_NAME}"
echo "💡 回滚命令: git checkout ${BRANCH_NAME}"

