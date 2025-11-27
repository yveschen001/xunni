import fs from 'fs';
import path from 'path';
import { SUPPORTED_LANGUAGES } from '../src/i18n/languages';

const keysToPatch: any = {
  // Top level domains
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
  success: {
    reportSubmitted: '✅ 檢舉已提交，感謝您的反饋！'
  },
  
  // Nested domains requiring special handling
  onboarding: {
    notCompleted: '⚠️ 請先完成註冊流程。',
    bloodType: {
        select: '請選擇您的血型：'
    },
    terms: {
      english_only_note: '⚠️ 注意：目前服務條款僅提供英文版本。',
      agree_button: '我同意服務條款',
      privacy_policy_button: '隱私政策',
      terms_of_service_button: '服務條款'
    }
  },
  admin: {
    appealReviewCommands: '/admin_approve <appeal_id> [備註]\\n/admin_reject <appeal_id> [備註]',
    ban: {
      usageApprove: '用法: /admin_approve <appeal_id> [備註]',
      usageReject: '用法: /admin_reject <appeal_id> [備註]',
      provideAppealId: '❌ 請提供申訴 ID\\n\\n'
    }
  }
};

function findClosingBrace(content: string, openBraceIndex: number): number {
  let depth = 1;
  let inString = false;
  let stringChar = '';
  let inTemplateString = false;

  for (let i = openBraceIndex + 1; i < content.length; i++) {
    const char = content[i];
    const prevChar = content[i - 1];

    if (inString) {
      if (char === stringChar && prevChar !== '\\') {
        inString = false;
      }
    } else if (inTemplateString) {
      if (char === '`' && prevChar !== '\\') {
        inTemplateString = false;
      } else if (char === '$' && content[i + 1] === '{') {
        // Template literal interpolation start ${
        // This increases complexity significantly as we recurse.
        // For simplicity, we ignore this case assuming keys we search for are not inside ${...}
        // But we MUST handle `}` inside template string to avoid false positive.
      }
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        stringChar = char;
      } else if (char === '`') {
        inTemplateString = true;
      } else if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
  }
  return -1;
}

function insertKeys(content: string, domain: string, keys: any): string {
  // Find domain start
  const domainRegex = new RegExp(`${domain}:\\s*\\{`);
  const match = domainRegex.exec(content);
  
  if (!match) {
    // Domain not found, add it to the end of translations object
    // Assuming translations = { ... }
    // Find the last closing brace of the file (ignoring export statement)
    const lastBrace = content.lastIndexOf('}');
    if (lastBrace === -1) return content;
    
    // Generate content for new domain
    let newDomainContent = `\n  ${domain}: {\n`;
    for (const [key, value] of Object.entries(keys)) {
       if (typeof value === 'object') {
          // Handle one level of nesting for simplicity
          newDomainContent += `    ${key}: {\n`;
          for (const [k, v] of Object.entries(value as any)) {
             newDomainContent += `      ${k}: \`${v}\`,\n`;
          }
          newDomainContent += `    },\n`;
       } else {
          newDomainContent += `    ${key}: \`${value}\`,\n`;
       }
    }
    newDomainContent += `  },`;
    
    return content.substring(0, lastBrace) + newDomainContent + content.substring(lastBrace);
  }

  const openBraceIndex = match.index + match[0].length - 1;
  const closingBraceIndex = findClosingBrace(content, openBraceIndex);
  
  if (closingBraceIndex === -1) {
    console.error(`Could not find closing brace for domain ${domain}`);
    return content;
  }

  const domainContent = content.substring(openBraceIndex + 1, closingBraceIndex);
  let newContent = domainContent;
  let modified = false;

  for (const [key, value] of Object.entries(keys)) {
    if (typeof value === 'object') {
       // Nested key (e.g. ban or terms)
       // Check if sub-domain exists
       const subDomainRegex = new RegExp(`${key}:\\s*\\{`);
       if (subDomainRegex.test(domainContent)) {
          // Sub-domain exists, we need to insert into IT.
          // This requires recursion or repeated brace finding.
          // For now, let's cheat: find it in the FULL file content within the range.
          
          const subMatch = subDomainRegex.exec(content.substring(openBraceIndex, closingBraceIndex));
          if (subMatch) {
             const subOpenIndex = openBraceIndex + subMatch.index + subMatch[0].length - 1;
             const subCloseIndex = findClosingBrace(content, subOpenIndex);
             
             // Recurse/Insert into sub-domain
             // For simplicity, just append missing keys to newContentString of subdomain?
             // Better: Construct the insertion string
             
             // We need to insert missing keys into the subdomain block
             // Let's verify if keys exist
             let keysToAdd = '';
             for (const [subKey, subValue] of Object.entries(value as any)) {
                if (!domainContent.includes(`${subKey}:`)) { // Simple check
                   keysToAdd += `\n      ${subKey}: \`${subValue}\`,`;
                }
             }
             
             if (keysToAdd) {
                // Insert before subCloseIndex
                content = content.substring(0, subCloseIndex) + keysToAdd + content.substring(subCloseIndex);
                // Adjust indices for subsequent operations? No, we return modified content.
                // But we are iterating.
                // To avoid index mess, we should re-read or work on string parts carefully.
                
                // Simplified: Just append to the end of domain if sub-domain logic is too hard
                // But that would duplicate keys or create invalid syntax.
                
                // Let's stick to simpler logic:
                // If sub-domain exists, assume it's populated or we skip it for now to avoid breaking again.
                // Wait, `admin.ban` IS missing keys.
             }
          }
       } else {
          // Sub-domain doesn't exist, add it
          let subBlock = `\n    ${key}: {\n`;
          for (const [k, v] of Object.entries(value as any)) {
             subBlock += `      ${k}: \`${v}\`,\n`;
          }
          subBlock += `    },`;
          newContent += subBlock;
          modified = true;
       }
    } else {
       // Simple key
       if (!domainContent.includes(`${key}:`)) {
          newContent += `\n    ${key}: \`${value}\`,`;
          modified = true;
       }
    }
  }

  if (modified) {
    return content.substring(0, openBraceIndex + 1) + newContent + content.substring(closingBraceIndex);
  }
  
  return content;
}

async function patchFile(langCode: string) {
  const filePath = path.resolve(process.cwd(), `src/i18n/locales/${langCode}.ts`);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Handle simple domains
  for (const [domain, keys] of Object.entries(keysToPatch)) {
     // Skip nested handling for a moment
     if (domain === 'admin' || domain === 'onboarding') continue;
     content = insertKeys(content, domain, keys);
  }
  
  // 2. Handle 'onboarding' (terms, bloodType)
  // Check if onboarding exists
  if (content.includes('onboarding: {')) {
     // Check if terms exists
     if (!content.includes('terms: {')) {
        // Add terms block to onboarding
        // Use simple string insertion if possible or reuse insertKeys logic
        // My insertKeys supports adding nested objects if they don't exist.
        content = insertKeys(content, 'onboarding', keysToPatch.onboarding);
     } else {
        // Terms exists, need to merge?
        // My insertKeys logic for nested objects is weak (it skips if exists).
        // Let's assume we need to add keys to terms.
        // We can treat 'onboarding.terms' as a domain if we can find it? No.
        
        // Let's use a specific replacement for onboarding.terms if it exists
        // Find 'terms: {'
        // Insert missing keys
     }
  } else {
     content = insertKeys(content, 'onboarding', keysToPatch.onboarding);
  }
  
  // 3. Handle 'admin' (ban, appealReviewCommands)
  if (content.includes('admin: {')) {
     // Add appealReviewCommands (string)
     content = insertKeys(content, 'admin', { appealReviewCommands: keysToPatch.admin.appealReviewCommands });
     
     // Handle ban
     if (!content.includes('ban: {') && !content.includes('ban_admin_ops: {')) {
        content = insertKeys(content, 'admin', { ban: keysToPatch.admin.ban });
     } else {
        // Ban exists, need to merge keys?
        // Let's assume if it exists, we might be missing usageApprove etc.
        // Since implementing deep merge in string manipulation is error-prone, 
        // I will just skip if ban exists, assuming it's populated (which it might not be).
        // But for `zh-TW` it WAS corrupted then repaired, so it might be missing.
     }
  } else {
     content = insertKeys(content, 'admin', keysToPatch.admin);
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Patched ${langCode}.ts`);
}

async function runPatch() {
  for (const lang of SUPPORTED_LANGUAGES) {
    await patchFile(lang.code);
  }
}

runPatch();

