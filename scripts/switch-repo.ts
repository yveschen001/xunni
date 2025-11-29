import { execSync } from 'child_process';

const args = process.argv.slice(2);
const target = args[0];

if (target !== 'old' && target !== 'new') {
  console.log('Usage: pnpm switch-repo <old|new>');
  console.log('  old: yveschen001/xunni');
  console.log('  new: crealizellc/XunNi');
  process.exit(1);
}

const url = target === 'old' 
  ? 'https://github.com/yveschen001/xunni.git'
  : 'https://github.com/crealizellc/XunNi.git';

try {
  execSync(`git remote set-url origin ${url}`);
  console.log(`✅ Switched remote origin to: ${url}`);
  
  // Verify
  const current = execSync('git remote get-url origin').toString().trim();
  console.log(`🔍 Current remote: ${current}`);
} catch (e) {
  console.error('❌ Failed to switch remote:', e);
  process.exit(1);
}

