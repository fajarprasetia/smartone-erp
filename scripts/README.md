# Test Scripts

This directory contains test scripts for various API endpoints and system features.

## SPK System Tests

### Database-level SPK Test
```
node scripts/test-spk-system.js
```

This script tests the SPK (Surat Perintah Kerja) system at the database level. It verifies:
- SPK counter functionality
- Reservation creation and management
- Database operations for SPK management

### API-level SPK Test
```
pnpm test:spk
```

This script tests the SPK API endpoints:
- Generation of new SPK numbers
- Verification of SPK numbers
- Reservation extension
- Invalid SPK handling

## Production Workflow Tests

```
pnpm test:production
```

This script tests the production workflow API endpoints in sequence:

1. **Print Update**: Sets an order status to PRINT and adds print information
2. **Print Done**: Marks a print job as completed and updates the status to PRINT DONE
3. **Press Update**: Sets an order status to PRESS and adds press information
4. **Press Done**: Marks a press job as completed and updates the status to PRESS DONE

### Configuration

Before running the production workflow test, you need to edit the script to:

1. Set a valid order ID in the `TEST_ORDER_ID` variable
2. Set valid user IDs for print and press operators in `PRINT_OPERATOR_ID` and `PRESS_OPERATOR_ID`

You can also run with the `--help` flag for more information:

```
node scripts/test-production-api.js --help
```

## Running the Tests

Make sure your development server is running:

```
pnpm dev
```

Then run any of the test scripts as described above. 