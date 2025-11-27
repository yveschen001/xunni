import fs from 'fs';
import path from 'path';
import { SUPPORTED_LANGUAGES } from '../src/i18n/languages';

const missingKeys: any = {
  help: {
    admin_ads: '\\n/admin_ads - 管理官方廣告\\n',
    admin_tasks: '\\n/admin_tasks - 管理社群任務'
  },
  officialAd: {
    rewardTemporary: '臨時額度'
  },
  report: {
    aiAutoBan: 'AI 自動封禁'
  },
  buttons: {
    claim: '領取獎勵',
    verify: '驗證'
  },
  common: {
    open: '開啟',
    anonymousUser: '匿名用戶'
  },
  onboarding: {
    terms: {
      english_only_note: '⚠️ 注意：目前服務條款僅提供英文版本。',
      agree_button: '我同意服務條款',
      privacy_policy_button: '隱私政策',
      terms_of_service_button: '服務條款'
    },
    bloodType: {
      select: '請選擇您的血型：'
    },
    notCompleted: '⚠️ 請先完成註冊流程。'
  },
  invite: {
    selfInviteError: '❌ 您不能使用自己的邀請碼！',
    upgradePrompt: '💡 升級 VIP 可獲得更多邀請獎勵！',
    inviteeSuccess: '🎉 恭喜！您已成功接受邀請！'
  },
  throw: {
    tips: '💡 提示：',
    friendlyContent: '請保持內容友善，共同維護良好的交友環境。'
  },
  settings: {
    selectOption: '請選擇要設定的項目：',
    returnToMenu: '返回主選單'
  },
  warnings: {
    text6: '⚠️ 請勿發送敏感資訊',
    register2: '⚠️ 請先完成註冊流程。',
    register4: '⚠️ 請先完成註冊流程。'
  },
  messageForward: {
    replyHint: '💡 長按對方的訊息並選擇「回覆」來發送回應。',
    urlNotAllowed: '⚠️ 禁止發送網址',
    urlNotAllowedDesc: '為了安全起見，禁止發送外部連結。',
    removeLinks: '請移除連結後再試。',
    vipDailyLimit: 'VIP 每日上限',
    upgradeVip: '升級 VIP'
  },
  conversation: {
    conversationInfoError: '⚠️ 對話資訊錯誤，請稍後再試。'
  },
  admin: {
    appealReviewCommands: '/admin_approve <appeal_id> [備註]\\n/admin_reject <appeal_id> [備註]',
    ban: {
      usageApprove: '用法: /admin_approve <appeal_id> [備註]',
      usageReject: '用法: /admin_reject <appeal_id> [備註]',
      provideAppealId: '❌ 請提供申訴 ID\\n\\n'
    }
  },
  success: {
    reportSubmitted: '✅ 檢舉已提交，感謝您的反饋！'
  }
};

async function patchI18nFile(langCode: string, keys: any) {
  const filePath = path.resolve(process.cwd(), `src/i18n/locales/${langCode}.ts`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}, skipping.`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  function processKeys(currentKeys: any, prefix: string[]) {
    for (const [key, value] of Object.entries(currentKeys)) {
      if (typeof value === 'object' && value !== null) {
        processKeys(value, [...prefix, key]);
      } else {
        const domain = prefix[0];
        const nestedKeys = prefix.slice(1);
        
        // Find domain block
        let domainRegex = new RegExp(`(${domain}:\\s*\\{[^}]*?)(\\s*\\})`, 's');
        if (!domainRegex.test(content)) {
          // If domain doesn't exist, try to add it at the end of the object
           const lastBrace = content.lastIndexOf('}');
           if (lastBrace !== -1) {
             content = content.substring(0, lastBrace) + `,\n  ${domain}: {\n  }\n` + content.substring(lastBrace);
             domainRegex = new RegExp(`(${domain}:\\s*\\{[^}]*?)(\\s*\\})`, 's');
             console.log(`Created new domain '${domain}' in ${langCode}`);
           }
        }

        if (domainRegex.test(content)) {
          // If we have nested keys (e.g. onboarding.terms.agree_button)
          if (nestedKeys.length > 0) {
            // This is a simplified approach: we assume max 1 level of nesting within domain for now, 
            // or we just flatten for the regex if possible.
            // But onboarding.terms is a nested object inside onboarding domain.
            
            // Regex to find the nested object start
            const nestedKey = nestedKeys[0];
            const nestedRegex = new RegExp(`(${nestedKey}:\\s*\\{[^}]*?)(\\s*\\})`, 's');
            
            // We need to match the domain block first, then look inside it.
            content = content.replace(domainRegex, (match, p1, p2) => {
              // Check if nested key exists in p1 (domain content)
              if (new RegExp(`${nestedKey}:\\s*\\{`).test(p1)) {
                 // Nested object exists, try to insert key into it
                 // We need to do another replace on p1
                 return match.replace(nestedRegex, (m, np1, np2) => {
                    const finalKey = nestedKeys.length > 1 ? nestedKeys[1] : key; // Assuming max 2 levels deep for this script
                    // Actually, if we are in recursive call, 'key' is the leaf key.
                    // If prefix is ['onboarding', 'terms'], key is 'agree_button'.
                    
                    if (!new RegExp(`${key}:`).test(m)) {
                       modified = true;
                       console.log(`✅ Inserted '${key}' into '${domain}.${nestedKey}' for ${langCode}`);
                       return np1.trim() + `,\n      ${key}: \`${value}\`` + np2;
                    }
                    return m;
                 });
              } else {
                // Nested object does not exist in domain, add it
                // Logic to add nested object is complex with regex.
                // For now, let's just append it to the domain if it's not there.
                // But wait, the structure must be maintained.
                
                // Let's try a simpler approach: Just check if the full string key: value exists? No, context matters.
                
                // Fallback: If we can't find the nested structure, we might need to be more careful.
                // Given the specific keys we need to patch (onboarding.terms.*), let's handle them specifically or accept that this script is "best effort" for standard depth.
                
                // If it's onboarding.terms
                if (domain === 'onboarding' && nestedKey === 'terms') {
                   const termsBlock = `\n    terms: {\n      ${key}: \`${value}\`\n    },`;
                   // Insert into domain
                   modified = true;
                   console.log(`✅ Inserted new block '${nestedKey}' with '${key}' into '${domain}' for ${langCode}`);
                   return p1.trim() + termsBlock + p2;
                }
                
                // admin.ban
                if (domain === 'admin' && nestedKey === 'ban') {
                    // Check if ban block exists (it might be renamed to ban_admin_ops)
                    // If we need to patch 'admin.ban', we should check if 'ban' or 'ban_admin_ops' exists?
                    // The script uses 'ban'.
                     const banBlock = `\n    ban: {\n      ${key}: \`${value}\`\n    },`;
                     modified = true;
                     console.log(`✅ Inserted new block '${nestedKey}' with '${key}' into '${domain}' for ${langCode}`);
                     return p1.trim() + banBlock + p2;
                }
                
                return match;
              }
            });
          } else {
            // Direct key in domain
            content = content.replace(domainRegex, (match, p1, p2) => {
              if (!new RegExp(`${key}:`).test(p1)) {
                modified = true;
                console.log(`✅ Inserted '${key}' into '${domain}' for ${langCode}`);
                return p1.trim() + `,\n    ${key}: \`${value}\`` + p2;
              }
              return match;
            });
          }
        }
      }
    }
  }

  processKeys(keys, []);

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

async function runPatch() {
  for (const lang of SUPPORTED_LANGUAGES) {
    await patchI18nFile(lang.code, missingKeys);
  }
  console.log('🎉 Patch complete.');
}

runPatch();

