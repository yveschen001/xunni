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

  // Ban
  ban: {
    temporaryBan: string;
    permanentBan: string;
    bannedTemporary: string;
    bannedPermanent: string;
  };

  // Appeal
  appeal: {
    prompt: string;
    submitted: string;
    alreadyExists: string;
    approved: string;
    rejected: string;
    status: string;
    noAppeal: string;
    notBanned: string;
    reasonTooShort: string;
    reasonTooLong: string;
  };

  // Admin system
  admin: {
    // Permission errors
    onlySuperAdmin: string;
    onlyAdmin: string;
    cannotBanAdmin: string;
    
    // Admin list
    listTitle: string;
    listTotal: string;
    listRoleSuperAdmin: string;
    listRoleAdmin: string;
    listId: string;
    listNickname: string;
    listUsername: string;
    listNotRegistered: string;
    listFooter: string;
    
    // Admin add
    addUsageError: string;
    addAlreadySuperAdmin: string;
    addAlreadyAdmin: string;
    addUserNotFound: string;
    addInstructions: string;
    
    // Admin remove
    removeUsageError: string;
    removeCannotRemoveSuperAdmin: string;
    removeNotAdmin: string;
    removeInstructions: string;
    
    // Admin ban
    banUsageError: string;
    banUserNotFound: string;
    banSuccess: string;
    banSuccessPermanent: string;
    
    // Admin unban
    unbanUsageError: string;
    unbanUserNotFound: string;
    unbanNotBanned: string;
    unbanSuccess: string;
    
    // Admin freeze
    freezeUsageError: string;
    freezeUserNotFound: string;
    freezeSuccess: string;
    
    // Admin bans
    bansTitle: string;
    bansUserHistory: string;
    bansUserId: string;
    bansNickname: string;
    bansTotalCount: string;
    bansCurrentStatus: string;
    bansStatusBanned: string;
    bansStatusNormal: string;
    bansNoRecords: string;
    bansRecordItem: string;
    bansStatusActive: string;
    bansStatusInactive: string;
    
    // Admin appeals
    appealsTitle: string;
    appealsNoRecords: string;
    appealsRecordItem: string;
    
    // Admin approve
    approveUsageError: string;
    approveNotFound: string;
    approveAlreadyReviewed: string;
    approveSuccess: string;
    
    // Admin reject
    rejectUsageError: string;
    rejectNotFound: string;
    rejectAlreadyReviewed: string;
    rejectSuccess: string;
    
    // Common
    error: string;
  };
}

