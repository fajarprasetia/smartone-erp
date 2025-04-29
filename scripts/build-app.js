const { exec } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.blue('Starting custom build process...'));

// Create a temporary .env.local file
console.log(chalk.cyan('Setting up environment...'));
const envPath = path.join(__dirname, '..', '.env.local');

// Only create if it doesn't exist
if (!fs.existsSync(envPath)) {
  const envContent = `# Disable telemetry and ignore legacy warnings
NEXT_TELEMETRY_DISABLED=1
NEXT_IGNORE_LEGACY_NODE_WARNINGS=1
`;

  fs.writeFileSync(envPath, envContent);
  console.log(chalk.green('Created temporary environment configuration.'));
}

// Run the build with a predefined command
console.log(chalk.cyan('Building application...'));
exec('node node_modules/next/dist/bin/next build', (error, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.error(chalk.yellow(stderr));
  
  if (error) {
    console.error(chalk.red(`Build failed: ${error.message}`));
    process.exit(1);
  }
  
  console.log(chalk.green('✅ Build completed successfully!'));
}); 