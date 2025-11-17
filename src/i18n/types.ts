/**
 * i18n Type Definitions
 */

export interface Translations {
  // Common
  common: {
    yes: string;
    no: string;
    cancel: string;
    confirm: string;
    back: string;
    next: string;
    skip: string;
    done: string;
    error: string;
    success: string;
    loading: string;
  };

  // Onboarding
  onboarding: {
    welcome: string;
    languageSelection: string;
    languageSelected: string;
    startRegistration: string;
    askNickname: string;
    askGender: string;
    genderWarning: string;
    askBirthday: string;
    birthdayWarning: string;
    birthdayFormat: string;
    under18Error: string;
    askMBTI: string;
    mbtiComplete: string;
    askAntiFraud: string;
    antiFraudComplete: string;
    askTerms: string;
    termsAgree: string;
    registrationComplete: string;
    profileSummary: string;
  };

  // Commands
  commands: {
    start: string;
    help: string;
    throw: string;
    catch: string;
    profile: string;
    stats: string;
    vip: string;
    block: string;
    report: string;
    appeal: string;
    rules: string;
  };

  // Help
  help: {
    title: string;
    coreFeatures: string;
    safetyFeatures: string;
    helpSection: string;
  };

  // Bottle
  bottle: {
    throw: {
      title: string;
      askContent: string;
      success: string;
      limitReached: string;
    };
    catch: {
      title: string;
      found: string;
      notFound: string;
      accept: string;
      reject: string;
    };
  };

  // Profile
  profile: {
    title: string;
    nickname: string;
    gender: string;
    age: string;
    zodiac: string;
    mbti: string;
    language: string;
    vipStatus: string;
    edit: string;
  };

  // VIP
  vip: {
    title: string;
    benefits: string;
    price: string;
    subscribe: string;
    alreadyVIP: string;
    expired: string;
  };

  // Invite
  invite: {
    inviterSuccess: string;
    inviteeSuccess: string;
    limitWarning: string;
    limitReached: string;
    codeAccepted: string;
    codeInvalid: string;
    selfInviteError: string;
    upgradePrompt: string;
    stats: {
      title: string;
      totalInvites: string;
      activatedInvites: string;
      pendingInvites: string;
      conversionRate: string;
      yourInviteCode: string;
      shareButton: string;
    };
  };

  // Errors
  errors: {
    generic: string;
    notRegistered: string;
    banned: string;
    invalidInput: string;
    networkError: string;
  };
}

