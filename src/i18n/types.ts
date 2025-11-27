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
    prev: string;
    pageInfo: string;
    skip: string;
    done: string;
    error: string;
    success: string;
    loading: string;
    notSet: string;
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
    text: string;
    text2: string;
    text3: string;
    text4: string;
    text5: string;
    text6: string;
    text7: string;
    text8: string;
    text9: string;
    text10: string;
    text11: string;
    text12: string;
    text13: string;
    text14: string;
    text15: string;
    text16: string;
    text17: string;
    text18: string;
    text19: string;
    text20: string;
    text21: string;
    text22: string;
    text23: string;
    text24: string;
    text25: string;
    text26: string;
    text27: string;
    text28: string;
    text29: string;
    text30: string;
    text31: string;
    text32: string;
    text33: string;
    text34: string;
    register: string;
    bottle: string;
    bottle2: string;
    bottle3: string;
    bottle4: string;
    bottle5: string;
    bottle6: string;
    bottle7: string;
    bottle8: string;
    bottle9: string;
    conversation: string;
    conversation2: string;
    profile: string;
    profile2: string;
    profile3: string;
    mbti: string;
    mbti2: string;
    stats: string;
    vip: string;
    vip2: string;
    vip3: string;
    vip4: string;
    vip5: string;
    vip6: string;
    invite: string;
    invite2: string;
    ad: string;
    ad2: string;
    ad3: string;
    ad4: string;
    ad5: string;
    ad6: string;
    appeal: string;
    appeal2: string;
    appeal3: string;
    appeal4: string;
    appeal5: string;
    appeal6: string;
    report: string;
    ban: string;
    ban2: string;
    ban3: string;
    ban4: string;
    ban5: string;
    ban6: string;
    settings: string;
    settings2: string;
    admin: string;
    admin2: string;
    admin3: string;
    admin4: string;
    admin5: string;
    admin6: string;
    broadcast: string;
    broadcast2: string;
    broadcast3: string;
    broadcast4: string;
    broadcast5: string;
    broadcast6: string;
    cancel: string;
    message: string;
    message2: string;
    message3: string;
    message4: string;
    message5: string;
    message6: string;
    message8: string;
    birthday: string;
    quota: string;
    quota2: string;
    success: string;
    throw: string;
    admin_ads: string;
    admin_tasks: string;
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
    unbanNotification: string;
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
