import csv
import shutil
import sys
import os

filename = 'i18n_for_translation.csv'
temp_filename = 'i18n_for_translation_payments.csv'

# Backup original file
if not os.path.exists(filename + '.backup_payments'):
    shutil.copy(filename, filename + '.backup_payments')

# Define new keys to add
new_keys = {
    'payments.title': {
        'en': '💳 Payment History (Page {page} / {total})',
        'zh-CN': '💳 支付记录（第 {page} / {total} 页）',
        'zh-TW': '💳 支付記錄（第 {page} / {total} 頁）'
    },
    'payments.empty': {
        'en': 'No payment records found.',
        'zh-CN': '目前没有支付记录。',
        'zh-TW': '目前沒有支付記錄。'
    },
    'payments.status.paid': {
        'en': '✅ Payment Successful',
        'zh-CN': '✅ 支付成功',
        'zh-TW': '✅ 支付成功'
    },
    'payments.status.refunded': {
        'en': '↩️ Refunded',
        'zh-CN': '↩️ 已退款',
        'zh-TW': '↩️ 已退款'
    },
    'payments.status.failed': {
        'en': '❌ Payment Failed',
        'zh-CN': '❌ 支付失败',
        'zh-TW': '❌ 支付失敗'
    },
    'payments.status.pending': {
        'en': '⏳ Processing',
        'zh-CN': '⏳ 处理中',
        'zh-TW': '⏳ 處理中'
    },
    'payments.product.VIP_MONTHLY': {
        'en': '💎 VIP Monthly Subscription',
        'zh-CN': '💎 VIP 月费订阅',
        'zh-TW': '💎 VIP 月費訂閱'
    },
    'buttons.viewPayments': {
        'en': '💰 Subscription History',
        'zh-CN': '💰 订阅记录',
        'zh-TW': '💰 訂閱記錄'
    },
    'buttons.backToVip': {
        'en': '💎 Back to VIP Menu',
        'zh-CN': '💎 返回 VIP 选单',
        'zh-TW': '💎 返回 VIP 選單'
    }
}

try:
    rows = []
    existing_keys = set()
    fieldnames = []

    # Read existing
    with open(filename, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        for row in reader:
            existing_keys.add(row.get('key'))
            rows.append(row)

    # Append new keys
    for key, values in new_keys.items():
        if key not in existing_keys:
            print(f"Adding new key: {key}")
            new_row = {field: '' for field in fieldnames} # Initialize empty
            new_row['key'] = key
            # Set values for specified languages
            for lang, value in values.items():
                if lang in new_row:
                    new_row[lang] = value
            
            # Fill other languages with English fallback if available
            if 'en' in values:
                for field in fieldnames:
                    if field not in ['key', 'en', 'zh-CN', 'zh-TW'] and not new_row[field]:
                         new_row[field] = values['en']

            rows.append(new_row)
        else:
            print(f"Key {key} already exists, skipping.")

    # Write back
    with open(temp_filename, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # Replace original file
    shutil.move(temp_filename, filename)
    print("CSV file updated successfully.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

