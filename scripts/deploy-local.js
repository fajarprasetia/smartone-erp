const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const chalk = require('chalk');

// Create .env.production if it doesn't exist
const envPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(envPath)) {
  console.log(chalk.yellow('Creating .env.production file...'));
  
  const envContent = `# Database
DATABASE_URL="postgresql://postgres:0135@localhost:5432/smartone_erp"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${require('crypto').randomBytes(32).toString('hex')}"

# Host and Port
HOST=0.0.0.0
PORT=3000
`;

  fs.writeFileSync(envPath, envContent);
  console.log(chalk.green('.env.production file created successfully!'));
}

console.log(chalk.blue('Starting deployment process...'));

// Function to execute commands with proper error handling
function runCommand(command, message) {
  return new Promise((resolve, reject) => {
    console.log(chalk.cyan(`${message}...`));
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        return reject(error);
      }
      if (stderr) {
        console.log(chalk.yellow(`Warning: ${stderr}`));
      }
      console.log(chalk.green(`${message} completed!`));
      resolve(stdout);
    });
  });
}

// Main deployment function
async function deploy() {
  try {
    // Install dependencies
    await runCommand('pnpm install', 'Installing dependencies');
    
    // Generate Prisma client
    await runCommand('pnpm prisma generate', 'Generating Prisma client');
    
    // Build the application
    await runCommand('pnpm build', 'Building application');
    
    console.log(chalk.green('✅ Deployment preparation completed!'));
    console.log(chalk.blue('To start the server, run:'));
    console.log(chalk.yellow('pnpm start'));
    
    console.log(chalk.blue('\nTo set up as a Windows service:'));
    console.log(chalk.yellow('1. Install pm2: npm install -g pm2'));
    console.log(chalk.yellow('2. Install pm2-windows-startup: npm install -g pm2-windows-startup'));
    console.log(chalk.yellow('3. Set up pm2 to start on boot: pm2-startup install'));
    console.log(chalk.yellow('4. Start the application: pm2 start npm --name "smartone-erp" -- start'));
    console.log(chalk.yellow('5. Save the process list: pm2 save'));
    
  } catch (error) {
    console.error(chalk.red('Deployment failed!'));
    process.exit(1);
  }
}

deploy(); 