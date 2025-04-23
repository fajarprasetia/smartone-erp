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

// Test Order ID - replace with a valid order ID that's ready for print process
// This is the ID you want to test with
const TEST_ORDER_ID = "your-order-id-here"; 

// Test User IDs - replace with valid user IDs from your database
const PRINT_OPERATOR_ID = "print-operator-id-here";
const PRESS_OPERATOR_ID = "press-operator-id-here";

// Test updating print information
async function testPrintUpdate() {
  log('step', 'TESTING PRINT UPDATE API');
  
  try {
    log('info', `Updating print information for order: ${TEST_ORDER_ID}`);
    
    const printData = {
      gramasi: "180",
      lebar_kertas: "160",
      lebar_file: "155",
      rip: "ONYX",
      dimensi_file: "155x90",
      prints_mesin: "Mimaki",
      prints_icc: "Premium",
      prints_target: "100",
      prints_qty: "120",
      prints_bagus: "0", // Start with 0, will be updated in print-done
      prints_waste: "0", // Start with 0, will be updated in print-done
      print_id: PRINT_OPERATOR_ID,
      // No need to set status or tgl_print, they will be set automatically
    };
    
    const response = await fetch(`${BASE_URL}/orders/${TEST_ORDER_ID}/production/print`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error (${response.status}): ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    log('success', 'Print information updated successfully');
    log('info', `Order status: ${data.order.status}`);
    
    return data.order;
  } catch (error) {
    log('error', `Failed to update print information: ${error.message}`);
    throw error;
  }
}

// Test marking print as done
async function testPrintDone() {
  log('step', 'TESTING PRINT DONE API');
  
  try {
    log('info', `Marking print as done for order: ${TEST_ORDER_ID}`);
    
    const printDoneData = {
      prints_bagus: "110",
      prints_reject: "5",
      prints_waste: "5",
      catatan_print: "Print completed successfully with minimal waste",
      // No need to set status or print_done, they will be set automatically
    };
    
    const response = await fetch(`${BASE_URL}/orders/${TEST_ORDER_ID}/production/print-done`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printDoneData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error (${response.status}): ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    log('success', 'Print marked as done successfully');
    log('info', `Order status: ${data.order.status}`);
    
    return data.order;
  } catch (error) {
    log('error', `Failed to mark print as done: ${error.message}`);
    throw error;
  }
}

// Test updating press information
async function testPressUpdate() {
  log('step', 'TESTING PRESS UPDATE API');
  
  try {
    log('info', `Updating press information for order: ${TEST_ORDER_ID}`);
    
    const pressData = {
      press_mesin: "HP",
      press_setting: "Standard",
      press_qty: "110",
      press_suhu: "180",
      press_tekanan: "Medium",
      press_waktu: "15",
      press_id: PRESS_OPERATOR_ID,
      // No need to set status or tgl_press, they will be set automatically
    };
    
    const response = await fetch(`${BASE_URL}/orders/${TEST_ORDER_ID}/production/press`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pressData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error (${response.status}): ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    log('success', 'Press information updated successfully');
    log('info', `Order status: ${data.order.status}`);
    
    return data.order;
  } catch (error) {
    log('error', `Failed to update press information: ${error.message}`);
    throw error;
  }
}

// Test marking press as done
async function testPressDone() {
  log('step', 'TESTING PRESS DONE API');
  
  try {
    log('info', `Marking press as done for order: ${TEST_ORDER_ID}`);
    
    const pressDoneData = {
      press_bagus: "105",
      press_reject: "5",
      catatan_press: "Press completed successfully with minimal rejects",
      // No need to set status or press_done, they will be set automatically
    };
    
    const response = await fetch(`${BASE_URL}/orders/${TEST_ORDER_ID}/production/press-done`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pressDoneData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error (${response.status}): ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    log('success', 'Press marked as done successfully');
    log('info', `Order status: ${data.order.status}`);
    
    return data.order;
  } catch (error) {
    log('error', `Failed to mark press as done: ${error.message}`);
    throw error;
  }
}

// Run all tests
async function runTests() {
  log('info', 'Starting production workflow API tests');
  
  // Check if TEST_ORDER_ID has been set properly
  if (TEST_ORDER_ID === "your-order-id-here") {
    log('error', 'Please set TEST_ORDER_ID to a valid order ID before running the tests');
    process.exit(1);
  }
  
  // Check if operator IDs have been set properly
  if (PRINT_OPERATOR_ID === "print-operator-id-here" || 
      PRESS_OPERATOR_ID === "press-operator-id-here") {
    log('error', 'Please set PRINT_OPERATOR_ID and PRESS_OPERATOR_ID to valid user IDs before running the tests');
    process.exit(1);
  }
  
  try {
    // Run the tests sequentially to simulate the production workflow
    
    // Test 1: Update print information
    await testPrintUpdate();
    
    // Test 2: Mark print as done
    await testPrintDone();
    
    // Test 3: Update press information
    await testPressUpdate();
    
    // Test 4: Mark press as done
    await testPressDone();
    
    log('success', 'All production workflow API tests completed successfully');
  } catch (error) {
    log('error', `Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Check for --help argument
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\nProduction Workflow API Test Script');
  console.log('=================================\n');
  console.log('Before running this script:');
  console.log('1. Update the TEST_ORDER_ID variable with a valid order ID');
  console.log('2. Update the PRINT_OPERATOR_ID and PRESS_OPERATOR_ID with valid user IDs');
  console.log('3. Ensure your server is running at the BASE_URL specified\n');
  console.log('Usage: node test-production-api.js\n');
  process.exit(0);
}

// Run the tests
runTests(); 