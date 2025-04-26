// Test script for SPK API routes
const fetch = require('node-fetch');
const chalk = require('chalk');

// Base API URL - adjust as needed for your environment
const BASE_URL = 'http://localhost:3000/api';

// Helper to show colorful console output
function log(type, message) {
  switch (type) {
    case 'info':
      console.log(chalk.blue('ℹ️ ' + message));
      break;
    case 'success':
      console.log(chalk.green('✅ ' + message));
      break;
    case 'error':
      console.log(chalk.red('❌ ' + message));
      break;
    case 'warn':
      console.log(chalk.yellow('⚠️ ' + message));
      break;
    case 'step':
      console.log(chalk.cyan('\n📋 ' + message));
      break;
    default:
      console.log(message);
  }
}

// Test the SPK generation endpoint
async function testGenerateSPK() {
  log('step', 'TESTING SPK GENERATION');
  
  try {
    log('info', 'Calling /api/orders/spk/generate');
    const response = await fetch(`${BASE_URL}/orders/spk/generate`);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.spk) {
      throw new Error('No SPK returned in the response');
    }
    
    log('success', `Generated SPK: ${data.spk}`);
    
    if (data.fallback) {
      log('warn', 'Using fallback SPK generation mechanism');
    }
    
    return data.spk;
  } catch (error) {
    log('error', `Failed to generate SPK: ${error.message}`);
    throw error;
  }
}

// Test the SPK verification endpoint
async function testVerifySPK(spk) {
  log('step', 'TESTING SPK VERIFICATION');
  
  try {
    log('info', `Verifying SPK: ${spk}`);
    const response = await fetch(`${BASE_URL}/orders/spk/verify?spk=${spk}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.valid) {
      log('success', `SPK ${spk} is valid`);
      
      if (data.reservation) {
        log('success', `Reservation expires at: ${new Date(data.reservation.expiresAt).toLocaleString()}`);
      }
      
      if (data.fallback) {
        log('warn', 'Using fallback verification mechanism');
      }
    } else {
      log('error', `SPK ${spk} is invalid: ${data.message}`);
    }
    
    return data;
  } catch (error) {
    log('error', `Failed to verify SPK: ${error.message}`);
    throw error;
  }
}

// Test an invalid SPK
async function testInvalidSPK() {
  log('step', 'TESTING INVALID SPK');
  
  const invalidSpk = 'INVALID';
  
  try {
    log('info', `Verifying invalid SPK: ${invalidSpk}`);
    const response = await fetch(`${BASE_URL}/orders/spk/verify?spk=${invalidSpk}`);
    
    if (response.status === 400) {
      log('success', 'API correctly rejected invalid SPK format');
    } else {
      log('warn', `Expected 400 status, got ${response.status}`);
    }
    
    const data = await response.json();
    log('info', `Response: ${JSON.stringify(data)}`);
    
    return data;
  } catch (error) {
    log('error', `Error testing invalid SPK: ${error.message}`);
    throw error;
  }
}

// Run all tests
async function runTests() {
  log('info', 'Starting SPK API tests');
  
  try {
    // Test 1: Generate a new SPK
    const spk = await testGenerateSPK();
    
    // Test 2: Verify the generated SPK
    await testVerifySPK(spk);
    
    // Test 3: Verify the SPK again to check reservation extension
    log('info', 'Verifying same SPK again to test reservation extension');
    await testVerifySPK(spk);
    
    // Test 4: Test invalid SPK
    await testInvalidSPK();
    
    log('success', 'All tests completed successfully');
  } catch (error) {
    log('error', `Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
runTests(); 