
import { FORTUNE_PROMPTS } from '../../src/prompts/fortune';

// Mock Data
const userProfile = {
    name: 'Brother',
    gender: 'Male',
    birth_date: '1990-05-20',
    birth_time: '14:00',
    is_birth_time_unknown: false,
    birth_city: 'Taipei',
    mbti_result: 'INTJ',
    blood_type: 'A'
};

const targetProfileSiblings = {
    name: 'Sister',
    gender: 'Female',
    birth_date: '1995-08-15',
    birth_time: '10:30',
    is_birth_time_unknown: false,
    birth_city: 'Kaohsiung'
};

const targetProfileLover = {
    name: 'Lover',
    gender: 'Female',
    birth_date: '1992-02-14',
    birth_time: '20:00',
    is_birth_time_unknown: false,
    birth_city: 'Tokyo'
};

function generateXml(profile: any, targetProfile: any, context: any) {
    const getYear = (dateStr: string) => dateStr.split('-')[0];
    const userBirthYear = getYear(profile.birth_date);
    const targetBirthYear = targetProfile ? getYear(targetProfile.birth_date) : '';
    const langName = 'Traditional Chinese (Taiwan)';
    const localizedZodiac = 'Taurus';

    return `
<context_data>
  <user_profile>
    <name>${profile.name}</name>
    <gender>${profile.gender}</gender>
    <birth>${profile.birth_date} ${(!profile.is_birth_time_unknown && profile.birth_time) ? profile.birth_time : 'Unknown Time'}</birth>
    <birth_year>${userBirthYear}</birth_year>
    <user_language>${langName}</user_language>
    <zodiac>${localizedZodiac}</zodiac>
    <location>${profile.birth_city || 'Unknown'}</location>
    <mbti>${profile.mbti_result || 'Unknown'}</mbti>
    <blood_type>${profile.blood_type || 'Unknown'}</blood_type>
    <job_role>Not provided</job_role>
    <industry>Not provided</industry>
    <interests>Not provided</interests>
  </user_profile>
  
  <request_info>
    <target_date>2023-10-27</target_date>
    <fortune_type>love_match</fortune_type>
  </request_info>

  <chart_data>
    {}
  </chart_data>

  ${targetProfile ? `<target_profile>
    <name>${targetProfile.name}</name>
    <birth>${targetProfile.birth_date} ${(!targetProfile.is_birth_time_unknown && targetProfile.birth_time) ? targetProfile.birth_time : 'Unknown Time'}</birth>
    <birth_year>${targetBirthYear}</birth_year>
    <gender>${targetProfile.gender}</gender>
    <location>${targetProfile.birth_city || 'Unknown'}</location>
  </target_profile>` : ''}
  
  ${context ? `<extra_context>${JSON.stringify(context)}</extra_context>` : ''}
</context_data>
`;
}

function testScenario(name: string, target: any, relationshipType: string, familyRole?: string) {
    console.log(`\n--- TESTING SCENARIO: ${name} ---`);
    const context = { relationship_type: relationshipType, family_role: familyRole };
    
    // 1. Generate XML
    const xml = generateXml(userProfile, target, context);
    console.log('XML Output Check (Partial):');
    if (xml.includes('<location>Kaohsiung</location>') || xml.includes('<location>Tokyo</location>')) {
        console.log('✅ Target Location Found');
    } else {
        console.error('❌ Target Location MISSING');
    }
    if (xml.includes('1995') || xml.includes('1992')) {
        console.log('✅ Target Birth Year Found');
    } else {
        console.error('❌ Target Birth Year MISSING');
    }

    // 2. Generate Prompt Logic (Simulated)
    let taskPrompt = FORTUNE_PROMPTS.LOVE_MATCH_1;
    taskPrompt += `\n\nIMPORTANT: You MUST answer in Traditional Chinese (Taiwan).`;

    if (relationshipType && familyRole) {
        taskPrompt = taskPrompt.replace('{Relationship Type}', relationshipType);
        taskPrompt = taskPrompt.replace('{Role}', familyRole);
        taskPrompt = taskPrompt.replace('{User Gender}', userProfile.gender);
        taskPrompt = taskPrompt.replace('{Target Gender}', target.gender);
    }
    
    console.log('Prompt Logic Check (Kinship Rule Presence):');
    if (taskPrompt.includes('Compare Birth Years')) {
        console.log('✅ Kinship Check Logic Present');
    } else {
        console.error('❌ Kinship Check Logic MISSING');
    }
}

// Run Tests
testScenario('A: Siblings (Brother & Sister)', targetProfileSiblings, 'family', 'younger_sister');
testScenario('B: Lovers', targetProfileLover, 'love', 'Partner');

