# 用户可见内容分析

## 1. Telegram 消息（最重要）
- sendMessage() 调用
- editMessageText() 调用
- reply() 调用
- answerCallbackQuery() 调用

## 2. 按钮文字
- InlineKeyboardButton 的 text 属性
- ReplyKeyboardButton 的 text 属性

## 3. 菜单和命令描述
- BotCommand 的 description

## 4. 错误/成功/警告消息
- throw new Error() 中用户可见的错误
- 返回给用户的状态消息

## 5. 表单提示
- ForceReply 的 input_field_placeholder

## 6. 数据库中的用户可见内容
- tasks 表的 name, description
- 其他表中用户会看到的字段

## 7. 报表和统计
- analytics_reports.ts 中的报表模板
- stats.ts 中的统计信息

## 8. 帮助文档
- help.ts 中的帮助文本
- tutorial.ts 中的教程文本
