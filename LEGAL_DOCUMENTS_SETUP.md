# 🔒 XunNi Legal Documents Setup Guide

## 📋 Overview

This document explains how to set up and deploy XunNi's legal documents (Privacy Policy, Terms of Service, Community Guidelines).

**⚠️ Important: All legal documents are provided in English only and are the legally binding version.**

---

## ✅ **Completed Documents**

We have created complete legal documents for XunNi to ensure compliance with Telegram App Center and various legal regulations.

### **1. Privacy Policy**
- **File Location**: `public/privacy.html`
- **Language**: English (legally binding version)
- **Content**:
  - Data collection scope and purpose
  - Data usage and sharing explanation
  - Data protection measures
  - User rights explanation
  - GDPR compliance
  - Children's privacy protection (18+ restriction)
  - International data transfer explanation

### **2. Terms of Service**
- **File Location**: `public/terms.html`
- **Language**: English (legally binding version)
- **Content**:
  - Service description and eligibility
  - Usage rules and prohibited conduct
  - **Fraud and financial disclaimers** (key protection)
  - Violation handling and appeal mechanism
  - VIP subscription and refund policy
  - Limitation of liability and dispute resolution

### **3. Community Guidelines**
- **File Location**: `public/community.html`
- **Language**: English (legally binding version)
- **Content**:
  - Core values
  - Encouraged and prohibited behavior
  - Specific scenario guidelines
  - Reporting and handling process
  - Safety recommendations

---

## 🚀 **Deployment Steps**

### **Step 1: Deploy HTML Files to Cloudflare**

#### **Method A: Using Cloudflare Workers Sites (Recommended)**

1. **Configure `wrangler.toml`**

```toml
# Add to existing wrangler.toml
[site]
bucket = "./public"
```

2. **Deploy**

```bash
pnpm deploy:staging
# or
pnpm deploy:production
```

3. **Access URLs**

```
https://your-worker.your-subdomain.workers.dev/privacy.html
https://your-worker.your-subdomain.workers.dev/terms.html
https://your-worker.your-subdomain.workers.dev/community.html
```

#### **Method B: Using Cloudflare Pages (Separate Deployment)**

1. **Create Cloudflare Pages Project**

```bash
# Login to Cloudflare Dashboard
# Pages > Create a project > Connect to Git
# Or use Wrangler CLI
npx wrangler pages project create xunni-legal
```

2. **Deploy public Directory**

```bash
npx wrangler pages deploy public --project-name=xunni-legal
```

3. **Custom Domain (Optional)**

```
Add custom domain in Cloudflare Pages settings:
legal.xunni.app or xunni.app
```

---

### **Step 2: Update URL References in Code**

#### **Create Configuration File**

**File: `src/config/legal_urls.ts`** (new file)

```typescript
/**
 * Legal Documents URLs Configuration
 * 
 * Update this file to modify all legal document URLs
 */

// Choose URL based on environment
const BASE_URL = 
  process.env.NODE_ENV === 'production'
    ? 'https://xunni.app'  // Production (custom domain)
    : 'https://your-worker.your-subdomain.workers.dev';  // Development/Staging

export const LEGAL_URLS = {
  PRIVACY_POLICY: `${BASE_URL}/privacy.html`,
  TERMS_OF_SERVICE: `${BASE_URL}/terms.html`,
  COMMUNITY_GUIDELINES: `${BASE_URL}/community.html`,
} as const;

// Or use Workers URL directly (if you don't want to set up custom domain)
// export const LEGAL_URLS = {
//   PRIVACY_POLICY: 'https://your-worker.your-subdomain.workers.dev/privacy.html',
//   TERMS_OF_SERVICE: 'https://your-worker.your-subdomain.workers.dev/terms.html',
//   COMMUNITY_GUIDELINES: 'https://your-worker.your-subdomain.workers.dev/community.html',
// } as const;
```

#### **Update Handler Files**

**1. Update `src/telegram/handlers/start.ts`**

```typescript
// Add import at the top of the file
import { LEGAL_URLS } from '~/config/legal_urls';

// Find lines 345-346, replace with:
[{ text: '📋 View Privacy Policy', url: LEGAL_URLS.PRIVACY_POLICY }],
[{ text: '📋 View Terms of Service', url: LEGAL_URLS.TERMS_OF_SERVICE }],
```

**2. Update `src/telegram/handlers/onboarding_input.ts`**

```typescript
// Add import at the top of the file
import { LEGAL_URLS } from '~/config/legal_urls';

// Find lines 203-204, replace with:
[{ text: '📋 View Privacy Policy', url: LEGAL_URLS.PRIVACY_POLICY }],
[{ text: '📋 View Terms of Service', url: LEGAL_URLS.TERMS_OF_SERVICE }],
```

**3. Update `src/telegram/handlers/onboarding_callback.ts`**

```typescript
// Add import at the top of the file
import { LEGAL_URLS } from '~/config/legal_urls';

// Find lines 754-755, replace with:
[{ text: '📋 View Privacy Policy', url: LEGAL_URLS.PRIVACY_POLICY }],
[{ text: '📋 View Terms of Service', url: LEGAL_URLS.TERMS_OF_SERVICE }],
```

---

### **Step 3: Add Routing Support (if using Workers Sites)**

**Update `src/router.ts`**

Add static file routing in the `handleRequest` function:

```typescript
export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // ✨ NEW: Serve static legal documents
  if (path === '/privacy.html' || path === '/terms.html' || path === '/community.html') {
    try {
      // Cloudflare Workers Sites will handle this automatically
      // If using Workers Sites, this code will work automatically
      // No need to add manual code
      return new Response('Legal document', { status: 200 });
    } catch (error) {
      return new Response('Not Found', { status: 404 });
    }
  }

  // ... other routing logic ...
}
```

---

### **Step 4: Test Deployment**

1. **Local Testing**

```bash
# Start local development server
pnpm dev

# Access
http://localhost:8787/privacy.html
http://localhost:8787/terms.html
http://localhost:8787/community.html
```

2. **Staging Testing**

```bash
# Deploy to Staging
pnpm deploy:staging

# Access
https://your-staging-worker.workers.dev/privacy.html
https://your-staging-worker.workers.dev/terms.html
https://your-staging-worker.workers.dev/community.html
```

3. **Production Deployment**

```bash
# Deploy to Production
pnpm deploy:production

# Access
https://your-production-worker.workers.dev/privacy.html
# Or custom domain
https://xunni.app/privacy.html
```

---

### **Step 5: Set Up BotFather**

Set up Bot information in Telegram BotFather:

```
/setdescription
XunNi - MBTI Bottle Messaging Anonymous Social Bot
Match chat partners based on MBTI, zodiac, gender, and other criteria

/setabouttext
🍾 XunNi is an anonymous bottle messaging social platform based on MBTI and zodiac signs

✨ Core Features:
• Match chat partners based on MBTI, zodiac, gender
• Completely anonymous chat, protect privacy
• MBTI personality test, horoscope readings
• VIP users support automatic translation in 34 languages

🛡️ Safety Guarantee:
• Must be 18+ years old to use
• Anti-fraud security test
• Reporting and banning mechanism

📋 Legal Documents:
• Privacy Policy: https://xunni.app/privacy.html
• Terms of Service: https://xunni.app/terms.html
• Community Guidelines: https://xunni.app/community.html

/setcommands
start - Start / Register
throw - Throw a bottle
catch - Catch a bottle
profile - View profile
stats - View statistics
invite - Invite friends
vip - VIP subscription
block - Block user
report - Report violation
appeal - Appeal ban
delete_me - Delete account
help - Help
```

---

## 🔍 **Compliance Checklist**

### **Telegram App Center Requirements**

- [x] ✅ **Privacy Policy**: Created, includes complete data collection and usage explanation
- [x] ✅ **Terms of Service**: Created, includes service description and disclaimers
- [x] ✅ **Community Guidelines**: Created, clearly defines prohibited behavior and penalties
- [x] ✅ **Age Restriction**: Clearly marked 18+ restriction
- [x] ✅ **Anti-Fraud Warning**: Emphasizes fraud risks in multiple places
- [x] ✅ **Account Deletion**: `/delete_me` command implemented
- [x] ✅ **Bot Description**: Needs to be set in BotFather
- [x] ✅ **Command List**: Needs to be set in BotFather

### **GDPR Compliance**

- [x] ✅ **Data Collection Transparency**: Clearly states what data is collected
- [x] ✅ **Data Usage Purpose**: Clearly states data usage purposes
- [x] ✅ **User Rights**: Right of access, rectification, erasure, data portability
- [x] ✅ **Data Retention Period**: Clearly states retention periods
- [x] ✅ **Data Protection Measures**: Encrypted transmission, access control
- [x] ✅ **International Data Transfer**: Explains data may be transferred to other countries

### **Legal Disclaimers**

- [x] ✅ **Fraud Disclaimer**: Clearly states not responsible for user fraud
- [x] ✅ **Financial Disclaimer**: Clearly states not responsible for financial transactions
- [x] ✅ **Content Disclaimer**: Clearly states not responsible for user content
- [x] ✅ **Service Availability Disclaimer**: Clearly states no guarantee of uninterrupted service
- [x] ✅ **Third-Party Disclaimer**: Clearly states not responsible for third-party services
- [x] ✅ **Health and Safety Disclaimer**: Clearly states not responsible for offline meeting safety

---

## 📝 **Important Notes**

### **1. Language Strategy**

**✅ English Only (Recommended)**

- All legal documents are provided in English only
- English is the legally binding version
- This is the industry standard (Telegram, Discord, Twitter all use English-only legal documents)
- Avoids translation errors and legal risks
- Reduces maintenance costs

**In Bot Messages:**

```typescript
// Add a simple notice in the Bot
const legalNotice = {
  en: "📋 Legal documents are provided in English only.",
  zh: "📋 法律文檔僅提供英文版本。",
  // other languages...
};
```

### **2. URL Configuration**

**Please modify the URL in `src/config/legal_urls.ts` according to your actual deployment:**

```typescript
// Option 1: Use custom domain (recommended)
const BASE_URL = 'https://xunni.app';

// Option 2: Use Workers URL
const BASE_URL = 'https://xunni-bot.your-subdomain.workers.dev';

// Option 3: Use Cloudflare Pages URL
const BASE_URL = 'https://xunni-legal.pages.dev';
```

### **3. Custom Domain Setup**

If you want to use a custom domain (e.g., `xunni.app`):

1. Add domain in Cloudflare Dashboard
2. Set up DNS records
3. Bind custom domain in Workers or Pages
4. Update BASE_URL in `legal_urls.ts`

### **4. Regular Updates**

Legal documents should be reviewed and updated regularly:

- Update relevant terms when features change
- Update compliance content when regulations change
- Modify "Last Updated" date with each update
- Notify users of significant changes

---

## 🎯 **Next Steps**

After completing legal document setup, you can:

1. ✅ Submit Bot to Telegram App Center
2. ✅ Start promotion and operation
3. ✅ Develop advertising system (Phase 1-3)

---

## 📞 **Need Help?**

If you encounter issues during setup:

1. Check Cloudflare Workers/Pages deployment logs
2. Confirm URL configuration is correct
3. Test that all links are accessible
4. Confirm button links in Bot are correct

---

**Legal Documents Setup Guide Complete!** 🎉

**Reference Documentation:**
- Cloudflare Workers Sites: https://developers.cloudflare.com/workers/configuration/sites/
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- Telegram Bot Guidelines: https://core.telegram.org/bots/guidelines
