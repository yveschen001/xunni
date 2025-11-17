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
  },

  onboarding: {
    welcome:
      '🎉 Welcome to XunNi!\n\n' +
      'XunNi is an anonymous bottle messaging platform that helps you find like-minded friends through MBTI and zodiac signs!\n\n' +
      'First, please select your language:',
    languageSelection: '🌍 Select your language:',
    languageSelected: '✅ Language set to {language}',
    startRegistration:
      'Great! Let\'s set up your profile ✨\n\n' +
      'This will only take 3-5 minutes.\n' +
      'You can pause anytime and continue later.',
    askNickname: 'First, what would you like to be called?\n\nPlease enter your nickname (display name):',
    askGender: 'Please select your gender:\n\n⚠️ Note: Gender cannot be changed once set!',
    genderWarning: '⚠️ Confirm: Gender **cannot be changed** once set!\n\nPlease confirm:',
    askBirthday:
      'Please enter your birthday (format: YYYY-MM-DD):\n\n' +
      'Example: 1995-06-15\n\n' +
      '⚠️ Note:\n' +
      '• Birthday cannot be changed once set\n' +
      '• You must be 18 or older to use this service',
    birthdayWarning: '⚠️ Confirm: Birthday **cannot be changed** once set!\n\nYou entered: {birthday}\n\nPlease confirm:',
    birthdayFormat: '❌ Invalid birthday format. Please use YYYY-MM-DD\n\nExample: 1995-06-15',
    under18Error: '❌ Sorry, you must be 18 or older to use this service.\n\nPlease come back when you\'re older!',
    askMBTI:
      'Now let\'s take the MBTI personality test!\n\n' +
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
      '🎉 Congratulations! You\'ve completed all setup!\n\n' +
      'Your profile:\n' +
      '• Nickname: {nickname}\n' +
      '• Gender: {gender}\n' +
      '• Age: {age} years old\n' +
      '• Zodiac: {zodiac}\n' +
      '• MBTI: {mbti}\n\n' +
      'You can now start using XunNi!',
    profileSummary: 'Your profile:\n• Nickname: {nickname}\n• Gender: {gender}\n• Age: {age} years old\n• Zodiac: {zodiac}\n• MBTI: {mbti}',
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
      limitReached: '❌ You\'ve used all your bottles for today.\n\nFree users: 3/day, VIP users: 30/day.',
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
      '• Daily bottle quota +1\n\n' +
      '💡 Invite more friends to get more quota!\n' +
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
    generic: '❌ An error occurred. Please try again later.\n\nIf the problem persists, please contact support.',
    notRegistered: '❌ You haven\'t registered yet.\n\nPlease complete registration: /start',
    banned: '❌ Your account has been banned.\n\nReason: {reason}\n\nIf you have questions, use /appeal to appeal.',
    invalidInput: '❌ Invalid input format. Please try again.',
    networkError: '❌ Network error. Please try again later.',
  },
};

