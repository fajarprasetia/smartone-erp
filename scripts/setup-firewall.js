const { exec } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('Setting up Windows Firewall rules for SmartOne ERP...'));

// Get the port from environment or use default
const port = process.env.PORT || 3000;

// Commands to create inbound and outbound rules
const createInboundRule = `netsh advfirewall firewall add rule name="SmartOne ERP (Inbound ${port})" dir=in action=allow protocol=TCP localport=${port}`;
const createOutboundRule = `netsh advfirewall firewall add rule name="SmartOne ERP (Outbound ${port})" dir=out action=allow protocol=TCP localport=${port}`;

// Execute firewall commands
console.log(chalk.cyan('Creating inbound firewall rule...'));
exec(createInboundRule, (error, stdout, stderr) => {
  if (error) {
    console.error(chalk.red(`Error creating inbound rule: ${error.message}`));
    return;
  }
  if (stderr) {
    console.log(chalk.yellow(`Warning: ${stderr}`));
  }
  console.log(chalk.green('Inbound firewall rule created successfully!'));
  
  console.log(chalk.cyan('Creating outbound firewall rule...'));
  exec(createOutboundRule, (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`Error creating outbound rule: ${error.message}`));
      return;
    }
    if (stderr) {
      console.log(chalk.yellow(`Warning: ${stderr}`));
    }
    console.log(chalk.green('Outbound firewall rule created successfully!'));
    
    console.log(chalk.green('✅ Firewall rules set up successfully!'));
    console.log(chalk.blue('Your application should now be accessible from other devices on your network.'));
    console.log(chalk.yellow(`They can access it using your computer's IP address: http://YOUR_IP_ADDRESS:${port}`));
    console.log(chalk.yellow('To find your IP address, you can run "ipconfig" in Command Prompt.'));
  });
}); 