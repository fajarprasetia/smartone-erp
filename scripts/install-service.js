const { exec } = require('child_process');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

console.log(chalk.blue('Installing SmartOne ERP as a Windows service...'));

// Check if PM2 is installed
exec('pm2 -v', (error) => {
  if (error) {
    console.log(chalk.yellow('PM2 is not installed. Installing PM2...'));
    
    exec('npm install -g pm2', (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Error installing PM2: ${error.message}`));
        return;
      }
      
      installPM2WindowsStartup();
    });
  } else {
    console.log(chalk.green('PM2 is already installed.'));
    installPM2WindowsStartup();
  }
});

function installPM2WindowsStartup() {
  console.log(chalk.cyan('Installing PM2 Windows startup module...'));
  
  exec('npm install -g pm2-windows-startup', (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`Error installing PM2 Windows startup: ${error.message}`));
      return;
    }
    
    console.log(chalk.cyan('Setting up PM2 to start on boot...'));
    exec('pm2-startup install', (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Error setting up PM2 startup: ${error.message}`));
        return;
      }
      
      startApplication();
    });
  });
}

function startApplication() {
  // Create ecosystem.config.js file
  const ecosystemPath = path.join(__dirname, '..', 'ecosystem.config.js');
  
  const ecosystemConfig = `module.exports = {
  apps: [{
    name: 'smartone-erp',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '${path.join(__dirname, '..').replace(/\\/g, '\\\\')}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    }
  }]
};`;

  fs.writeFileSync(ecosystemPath, ecosystemConfig);
  console.log(chalk.green('Created PM2 ecosystem config file.'));
  
  console.log(chalk.cyan('Starting application with PM2...'));
  exec('pm2 start ecosystem.config.js', (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`Error starting application with PM2: ${error.message}`));
      return;
    }
    
    console.log(chalk.cyan('Saving PM2 process list...'));
    exec('pm2 save', (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Error saving PM2 process list: ${error.message}`));
        return;
      }
      
      console.log(chalk.green('✅ SmartOne ERP has been successfully installed as a Windows service!'));
      console.log(chalk.blue('The application will automatically start when your computer boots up.'));
      console.log(chalk.blue('You can manage the service using the following commands:'));
      console.log(chalk.yellow('- Stop service: pm2 stop smartone-erp'));
      console.log(chalk.yellow('- Start service: pm2 start smartone-erp'));
      console.log(chalk.yellow('- Restart service: pm2 restart smartone-erp'));
      console.log(chalk.yellow('- Check logs: pm2 logs smartone-erp'));
      console.log(chalk.yellow('- Monitor service: pm2 monit'));
    });
  });
} 