
import { translations } from '../src/i18n/locales/zh-TW/index';

const PROTECTED_KEYS = [
  // Menu & Profile
  'menu.birthDate',
  'menu.zodiac',
  'menu.bloodType',
  'menu.interests',
  'menu.bio',
  'menu.driftBottles',
  'menu.fortuneBottles',
  'menu.yourStatus',
  
  // Tasks
  'tasks.name.city',
  'tasks.description.city',
  'tasks.name.bio',
  'tasks.name.interests',

  // Fortune
  'fortune.menuTitle',
  'fortune.menu.love',
  
  // Admin & Help
  'help.superAdminTitle',
  'admin.analyticsTitle',
  
  // Common
  'common.back3',
  'common.saved_to_history',
  'common.analyzing',
  'common.date',
  'common.unknown',
  'common.processing',
  'common.continue_op',

  // Success
  'success.text6',
  'success.bottleThrown',

  // Interests
  'interests.title',
  'interests.subtitle',
  'interests.current',
  'interests.save',
  'interests.categories.life',

  // Fortune
  'fortune.type.daily',
  'fortune.type.weekly',
  'fortune.type.ziwei',
  'fortune.type.astrology',
  'fortune.type.tarot',
  'fortune.backToMenu',
  'fortune.back_to_menu',
  'fortune.love.invite_friend',
  'fortune.love.error_not_found',

  // Edit Profile
  'edit_profile.bioInstruction',
  'edit_profile.nicknameInstruction',
  'settings.blocklist.title',
  'settings.blocklist.empty',

  // Edit Profile
  'edit_profile.menuTitle',
  'edit_profile.nicknameButton',
  'edit_profile.bioButton',
  'edit_profile.regionButton',
  'edit_profile.interestsButton',
  'edit_profile.bloodTypeButton',
  'edit_profile.matchPrefButton',
  'edit_profile.nicknameInstruction',
  'edit_profile.bloodTypeInstruction',

  // Career
  'career.label_role',
  'career.btn_edit_role',
  'career.role.employee',
  'career.industry.tech.label'
];

function checkKeys() {
  console.log('🛡️  Verifying Protected Keys in zh-TW.ts...');
  
  // Debug: Log structure
  console.log('Keys in translations:', Object.keys(translations));
  if (translations['tasks']) console.log('Keys in tasks:', Object.keys(translations['tasks']));
  if (translations['fortune']) console.log('Keys in fortune:', Object.keys(translations['fortune']));
  if (translations['menu']) console.log('Keys in menu:', Object.keys(translations['menu']));

  let missingCount = 0;

  for (const path of PROTECTED_KEYS) {
    const keys = path.split('.');
    let current: any = translations;
    let exists = true;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        exists = false;
        break;
      }
    }

    if (!exists) {
      console.error(`❌ Missing Protected Key: ${path}`);
      missingCount++;
    } else {
      // Optional: Check for empty values or bad placeholders
      if (typeof current === 'string') {
         if (current.includes('${') && !current.includes('\\${')) {
             // We allow ${} if it matches the new standard, but user wanted {}?
             // Actually, if we standardized on {}, we should flag ${} as potential error if i18n doesn't support it.
             // But for now, just existence.
         }
      }
    }
  }

  if (missingCount > 0) {
    console.error(`\n🚨 Verification FAILED: ${missingCount} protected keys are missing.`);
    console.error('Please restore these keys before deploying.');
    process.exit(1);
  } else {
    console.log('✅ All protected keys are present.');
  }
}

checkKeys();

