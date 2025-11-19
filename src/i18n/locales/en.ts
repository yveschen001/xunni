/**
 * English Translations
 * Complete implementation
 */

import type { Translations } from '../types';

export const translations: Translations = {
  common: {
    yes: 'Yes',
    no: 'No',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    done: 'Done',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
    notSet: 'Not set',
  },

  onboarding: {
    welcome:
      '🎉 Welcome to XunNi!\n\n' +
      'XunNi is an anonymous bottle messaging platform that helps you find like-minded friends through MBTI and zodiac signs!\n\n' +
      'First, please select your language:',
    languageSelection: '🌍 Select your language:',
    languageSelected: '✅ Language set to {language}',
    startRegistration:
      "Great! Let's set up your profile ✨\n\n" +
      'This will only take 3-5 minutes.\n' +
      'You can pause anytime and continue later.',
    askNickname:
      'First, what would you like to be called?\n\nPlease enter your nickname (display name):',
    askGender: 'Please select your gender:\n\n⚠️ Note: Gender cannot be changed once set!',
    genderWarning: '⚠️ Confirm: Gender **cannot be changed** once set!\n\nPlease confirm:',
    askBirthday:
      'Please enter your birthday (format: YYYY-MM-DD):\n\n' +
      'Example: 1995-06-15\n\n' +
      '⚠️ Note:\n' +
      '• Birthday cannot be changed once set\n' +
      '• You must be 18 or older to use this service',
    birthdayWarning:
      '⚠️ Confirm: Birthday **cannot be changed** once set!\n\nYou entered: {birthday}\n\nPlease confirm:',
    birthdayFormat: '❌ Invalid birthday format. Please use YYYY-MM-DD\n\nExample: 1995-06-15',
    under18Error:
      "❌ Sorry, you must be 18 or older to use this service.\n\nPlease come back when you're older!",
    askMBTI:
      "Now let's take the MBTI personality test!\n\n" +
      'This will help us find better matches for you~\n\n' +
      'Ready?',
    mbtiComplete: '🎉 Test complete!\n\nYour MBTI type is: {mbti}\n\n{description}',
    askAntiFraud:
      'Last step: Anti-fraud test\n\n' +
      'To protect all users, we need to confirm you understand basic online safety.\n\n' +
      'Ready?',
    antiFraudComplete: '✅ Anti-fraud test passed!',
    askTerms:
      'Before you start, please read and agree to our terms:\n\n' +
      '📋 Privacy Policy\n' +
      '📋 Terms of Service\n\n' +
      'Click the button below to indicate you have read and agree to the terms.',
    termsAgree: '✅ I have read and agree',
    registrationComplete:
      "🎉 Congratulations! You've completed all setup!\n\n" +
      'Your profile:\n' +
      '• Nickname: {nickname}\n' +
      '• Gender: {gender}\n' +
      '• Age: {age} years old\n' +
      '• Zodiac: {zodiac}\n' +
      '• MBTI: {mbti}\n\n' +
      'You can now start using XunNi!',
    profileSummary:
      'Your profile:\n• Nickname: {nickname}\n• Gender: {gender}\n• Age: {age} years old\n• Zodiac: {zodiac}\n• MBTI: {mbti}',
  },

  commands: {
    start: 'Start',
    help: 'Help',
    throw: 'Throw Bottle',
    catch: 'Catch Bottle',
    profile: 'Profile',
    stats: 'Statistics',
    vip: 'VIP Subscription',
    block: 'Block User',
    report: 'Report',
    appeal: 'Appeal Ban',
    rules: 'View Rules',
  },

  help: {
    title: '📖 XunNi Command List',
    coreFeatures: '🎮 Core Features',
    safetyFeatures: '🛡️ Safety Features',
    helpSection: '📖 Help',
  },

  bottle: {
    throw: {
      title: '🌊 Throw Bottle',
      askContent: 'Please enter your message:',
      success: '✅ Bottle thrown!',
      limitReached:
        "❌ You've used all your bottles for today.\n\nFree users: 3/day, VIP users: 30/day.",
    },
    catch: {
      title: '🎣 Catch Bottle',
      found: '🎉 You caught a bottle!',
      notFound: '😔 No bottles available for you right now.\n\nTry again later!',
      accept: '✅ Accept',
      reject: '❌ Reject',
    },
  },

  profile: {
    title: '👤 Profile',
    nickname: 'Nickname',
    gender: 'Gender',
    age: 'Age',
    zodiac: 'Zodiac',
    mbti: 'MBTI',
    language: 'Language',
    vipStatus: 'VIP Status',
    edit: 'Edit Profile',
  },

  vip: {
    title: '⭐ VIP Subscription',
    benefits:
      '🎁 VIP Benefits:\n' +
      '• 30 bottles per day (Free: 3)\n' +
      '• Filter by zodiac/MBTI\n' +
      '• Auto-translation in 34 languages\n' +
      '• Ad-free',
    price: '💰 Price: 5 USD / month',
    subscribe: 'Subscribe to VIP',
    alreadyVIP: '✅ You are already a VIP member!\n\nExpires: {expireAt}',
    expired: '⚠️ Your VIP has expired.\n\nClick below to renew:',
  },

  invite: {
    inviterSuccess:
      '🎉 Invitation Success!\n\n' +
      'Your friend {nickname} has completed registration and activation!\n\n' +
      '🎁 Reward: Daily bottle quota +1\n' +
      '📊 Total invites: {count}\n' +
      '🎯 {userType} user limit: {maxInvites}\n' +
      '📦 Current daily quota: {quota}',

    inviteeSuccess:
      '🎊 Congratulations on activation!\n\n' +
      'You and your inviter both received rewards:\n' +
      "• Your inviter's daily quota +1 ✅\n" +
      '• You can now use XunNi! ✅\n\n' +
      '💡 Want more quota?\n' +
      'Invite your friends to join XunNi!\n' +
      'Each successful invite = +1 daily quota\n' +
      '(Max 10 invites = 13 bottles/day)\n\n' +
      'View your invite code → /profile',

    limitWarning:
      '⚠️ Invite quota almost full\n\n' +
      'You have invited {count} people, only 1 slot left!\n\n' +
      '💎 Upgrade to VIP to unlock:\n' +
      '• Invite limit: 10 → 100 people\n' +
      '• Daily quota: 13 → 130 bottles\n' +
      '• More exclusive benefits\n\n' +
      'Upgrade now → /vip',

    limitReached:
      '🎊 Congratulations! Invite quota full\n\n' +
      'You have invited {count} people and received maximum free rewards!\n\n' +
      '💎 Want to unlock more invites?\n' +
      'Upgrade to VIP to invite up to 100 people\n\n' +
      'Upgrade now → /vip',

    codeAccepted:
      '✅ Used invite code from {inviterName}\n\n' +
      'After completing registration, you both will receive rewards!',

    codeInvalid: '❌ Invalid invite code, please check and try again',

    selfInviteError: '❌ Cannot use your own invite code',

    upgradePrompt: '💡 Want unlimited invites? Upgrade to VIP to unlock 100 people limit!',

    stats: {
      title: '📊 Invite Statistics',
      totalInvites: 'Total Invites',
      activatedInvites: 'Activated',
      pendingInvites: 'Pending',
      conversionRate: 'Conversion Rate',
      yourInviteCode: 'Your Invite Code',
      shareButton: 'Share Invite Code',
    },
  },

  errors: {
    generic:
      '❌ An error occurred. Please try again later.\n\nIf the problem persists, please contact support.',
    notRegistered: "❌ You haven't registered yet.\n\nPlease complete registration: /start",
    banned:
      '❌ Your account has been banned.\n\nReason: {reason}\n\nIf you have questions, use /appeal to appeal.',
    invalidInput: '❌ Invalid input format. Please try again.',
    networkError: '❌ Network error. Please try again later.',
  },

  ban: {
    // Ban notification (temporary) - Friendly version
    temporaryBan:
      '⚠️ Account Security Notice\n\n' +
      'Our system has detected unusual activity on your account. To protect our community, your account is temporarily unavailable.\n\n' +
      '⏰ Expected recovery time: {unbanTime}\n' +
      '🕐 Suspension duration: approximately {duration}\n\n' +
      '📖 Please review our community guidelines: /rules\n\n' +
      '💡 If you believe this is a mistake, you can appeal using /appeal and we will review your case.',

    // Ban notification (permanent) - Friendly version
    permanentBan:
      '⚠️ Account Security Notice\n\n' +
      'Our system has detected serious violations on your account. After AI security review, your account has been suspended.\n\n' +
      '📖 Please review our community guidelines: /rules\n\n' +
      '💡 If you believe this is a mistake, you can appeal using /appeal and a human moderator will review your case.',

    // Unban notification
    unbanNotification:
      '✅ **Ban Lifted**\n\n' +
      'An administrator has removed your account restrictions.\n\n' +
      'You can now use all features normally.\n\n' +
      '💡 Please follow community guidelines to avoid future restrictions.',

    // Ban check (temporary) - Friendly version
    bannedTemporary:
      '⚠️ Account Temporarily Unavailable\n\n' +
      'Your account is currently suspended, possibly due to unusual activity detected by our system.\n\n' +
      '⏰ Expected recovery time: {unbanTime}\n' +
      '🕐 Time remaining: approximately {timeLeft}\n\n' +
      '📖 Please review our community guidelines: /rules\n' +
      '💡 If you have questions, you can appeal using /appeal',

    // Ban check (permanent) - Friendly version
    bannedPermanent:
      '⚠️ Account Suspended\n\n' +
      'Your account has been suspended for violating community guidelines.\n\n' +
      '📖 Please review our community guidelines: /rules\n' +
      '💡 If you have questions, you can appeal using /appeal',
  },

  // Appeal system
  appeal: {
    // Appeal submission prompt
    prompt:
      '📝 Appeal Explanation\n\n' +
      'Please briefly explain why you believe this is a mistake. Our team will review your appeal as soon as possible.\n\n' +
      '💡 Tips:\n' +
      '• Be honest about the situation\n' +
      '• Provide relevant evidence or explanation\n' +
      '• Be polite and respectful\n\n' +
      'Please enter your appeal reason:',

    // Appeal submitted
    submitted:
      '✅ Appeal Submitted\n\n' +
      'Thank you for your appeal. Our team will review your case within 24-48 hours.\n\n' +
      'Appeal ID: #{appealId}\n' +
      'Submitted: {time}\n\n' +
      '💡 You can check your appeal status with /appeal_status',

    // Appeal already exists
    alreadyExists:
      '⚠️ You have already submitted an appeal\n\n' +
      'Appeal ID: #{appealId}\n' +
      'Status: {status}\n' +
      'Submitted: {time}\n\n' +
      'Please wait patiently for the review result.',

    // Appeal approved
    approved:
      '🎉 Appeal Approved\n\n' +
      'After review, we believe this was indeed a mistake. Your account restrictions have been lifted and you can use all features normally.\n\n' +
      'Thank you for your understanding and cooperation!',

    // Appeal rejected
    rejected:
      '❌ Appeal Denied\n\n' +
      'After careful review, we confirm the original decision was correct.\n\n' +
      'Review notes: {notes}\n\n' +
      'Please follow community guidelines to avoid similar situations in the future.',

    // Appeal status
    status:
      '📋 Appeal Status\n\n' +
      'Appeal ID: #{appealId}\n' +
      'Status: {status}\n' +
      'Submitted: {createdAt}\n' +
      '{reviewInfo}\n\n' +
      '💡 We will process your appeal as soon as possible',

    // No appeal found
    noAppeal:
      '❌ No appeal found\n\n' +
      'If your account is restricted, you can submit an appeal using /appeal.',

    // Not banned
    notBanned:
      '✅ Your account status is normal\n\n' +
      'There are currently no restrictions, you can use all features normally.',

    // Reason too short
    reasonTooShort:
      '❌ Appeal reason too short\n\n' +
      'Please provide at least 10 characters to help us better understand the situation.',

    // Reason too long
    reasonTooLong:
      '❌ Appeal reason too long\n\n' + 'Please keep your explanation under 500 characters.',
  },

  // Admin system
  admin: {
    // Permission errors
    onlySuperAdmin: '❌ Only super admins can use this command.',
    onlyAdmin: '❌ Only admins can use this command.',
    cannotBanAdmin: '❌ Cannot ban admin accounts.',

    // Admin list
    listTitle: '👥 **Admin List**',
    listTotal: 'Total: {count} admin(s)',
    listRoleSuperAdmin: '🔱 Super Admin',
    listRoleAdmin: '👮 Admin',
    listId: '• ID: `{id}`',
    listNickname: '• Nickname: {nickname}',
    listUsername: '• Username: @{username}',
    listNotRegistered: 'Not registered',
    listFooter: '💡 Use /admin_add to add admins\n💡 Use /admin_remove to remove admins',

    // Admin add
    addUsageError:
      '❌ Usage error\n\n**Correct format:**\n`/admin_add <user_id>`\n\n**Example:**\n`/admin_add 123456789` - Add as regular admin\n\n💡 Use /admin_list to view current admin list',
    addAlreadySuperAdmin: '❌ This user is already a super admin.',
    addAlreadyAdmin: '❌ This user is already an admin.',
    addUserNotFound: '❌ User not found or not registered.',
    addInstructions:
      '⚠️ **Notice**\n\nThis command requires manual configuration file modification.\n\n**Steps:**\n1. Edit `wrangler.toml`\n2. Find `ADMIN_USER_IDS` variable\n3. Add user ID: `{userId}`\n4. Format: `ADMIN_USER_IDS = "ID1,ID2,{userId}"`\n5. Redeploy: `pnpm deploy:staging`\n\n**User Info:**\n• ID: `{userId}`\n• Nickname: {nickname}\n• Username: @{username}\n\n💡 Or modify environment variables in Cloudflare Dashboard',

    // Admin remove
    removeUsageError:
      '❌ Usage error\n\n**Correct format:**\n`/admin_remove <user_id>`\n\n**Example:**\n`/admin_remove 123456789` - Remove regular admin\n\n💡 Use /admin_list to view current admin list',
    removeCannotRemoveSuperAdmin: '❌ Cannot remove super admin.',
    removeNotAdmin: '❌ This user is not an admin.',
    removeInstructions:
      '⚠️ **Notice**\n\nThis command requires manual configuration file modification.\n\n**Steps:**\n1. Edit `wrangler.toml`\n2. Find `ADMIN_USER_IDS` variable\n3. Remove user ID: `{userId}`\n4. Redeploy: `pnpm deploy:staging`\n\n**User Info:**\n• ID: `{userId}`\n• Nickname: {nickname}\n• Username: @{username}\n\n💡 Or modify environment variables in Cloudflare Dashboard',

    // Admin ban
    banUsageError:
      '❌ Usage error\n\n**Correct format:**\n`/admin_ban <user_id> [hours|permanent]`\n\n**Examples:**\n`/admin_ban 123456789` - Ban for 1 hour (default)\n`/admin_ban 123456789 24` - Ban for 24 hours\n`/admin_ban 123456789 permanent` - Permanent ban',
    banUserNotFound: '❌ User not found.',
    banSuccess:
      '✅ User banned\n\n• User ID: `{userId}`\n• Nickname: {nickname}\n• Duration: {duration}\n• Unban time: {unbanTime}',
    banSuccessPermanent:
      '✅ User banned\n\n• User ID: `{userId}`\n• Nickname: {nickname}\n• Duration: Permanent',

    // Admin unban
    unbanUsageError:
      '❌ Usage error\n\n**Correct format:**\n`/admin_unban <user_id>`\n\n**Example:**\n`/admin_unban 123456789`',
    unbanUserNotFound: '❌ User not found.',
    unbanNotBanned: '❌ This user is not banned.',
    unbanSuccess:
      '✅ User unbanned\n\n• User ID: `{userId}`\n• Nickname: {nickname}\n\nUnban notification sent to user.',

    // Admin bans
    bansTitle: '📋 Ban Records',
    bansUserHistory: '📋 User Ban History',
    bansUserId: 'User ID: `{userId}`',
    bansNickname: 'Nickname: {nickname}',
    bansTotalCount: 'Ban count: {count}',
    bansCurrentStatus: 'Current status: {status}',
    bansStatusBanned: 'Banned',
    bansStatusNormal: 'Normal',
    bansNoRecords: '❌ No ban records found.',
    bansRecordItem:
      '**Ban #{id}**\n• Time: {time}\n• Reason: {reason}\n• Duration: {duration}\n• Status: {status}',
    bansStatusActive: 'Active',
    bansStatusInactive: 'Inactive',

    // Admin appeals
    appealsTitle: '📋 Pending Appeals',
    appealsNoRecords: '✅ No pending appeals.',
    appealsRecordItem:
      '**Appeal #{id}**\n• User: {nickname} (`{userId}`)\n• Submitted: {time}\n• Reason: {reason}\n\nUse /admin_approve {id} to approve\nUse /admin_reject {id} to reject',

    // Admin approve
    approveUsageError:
      '❌ Usage error\n\n**Correct format:**\n`/admin_approve <appeal_id> [notes]`\n\n**Examples:**\n`/admin_approve 1` - Approve appeal\n`/admin_approve 1 Confirmed as false positive` - Approve with notes',
    approveNotFound: '❌ Appeal not found.',
    approveAlreadyReviewed: '❌ This appeal has already been reviewed.',
    approveSuccess:
      '✅ Appeal approved\n\n• Appeal ID: #{id}\n• User: {nickname} (`{userId}`)\n• Review notes: {notes}\n\nUser has been unbanned and notified.',

    // Admin reject
    rejectUsageError:
      '❌ Usage error\n\n**Correct format:**\n`/admin_reject <appeal_id> [notes]`\n\n**Examples:**\n`/admin_reject 1` - Reject appeal\n`/admin_reject 1 Violation confirmed` - Reject with notes',
    rejectNotFound: '❌ Appeal not found.',
    rejectAlreadyReviewed: '❌ This appeal has already been reviewed.',
    rejectSuccess:
      '✅ Appeal rejected\n\n• Appeal ID: #{id}\n• User: {nickname} (`{userId}`)\n• Review notes: {notes}\n\nUser has been notified.',

    // Common
    error: '❌ An error occurred. Please try again later.',
  },
};
