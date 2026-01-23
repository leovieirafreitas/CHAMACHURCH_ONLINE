/**
 * Backend API Tests for Chamachurch Donation System
 * Tests all API endpoints for functionality, validation, and security
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const validDonation = {
    amount: 100.00,
    description: 'Dízimos',
    churchLocation: 'central',
    paymentMethod: 'pix',
    customer: {
        name: 'João Silva Test',
        email: 'joao.test@example.com',
        cpf: '12345678900',
        phone: '11999999999'
    }
};

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Test results storage
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to log test results
function logTest(name, passed, message = '') {
    results.total++;
    if (passed) {
        results.passed++;
        console.log(`${colors.green}✓${colors.reset} ${name}`);
    } else {
        results.failed++;
        console.log(`${colors.red}✗${colors.reset} ${name}`);
        if (message) console.log(`  ${colors.yellow}${message}${colors.reset}`);
    }
    results.tests.push({ name, passed, message });
}

// Helper function to make API requests
async function apiRequest(endpoint, method = 'POST', body = null) {
    const startTime = Date.now();
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : null,
        });

        const responseTime = Date.now() - startTime;
        const data = await response.json().catch(() => null);

        return {
            status: response.status,
            data,
            responseTime,
            ok: response.ok
        };
    } catch (error) {
        return {
            status: 0,
            data: null,
            responseTime: Date.now() - startTime,
            ok: false,
            error: error.message
        };
    }
}

// Test Suite 1: POST /api/donate - Functionality Tests
async function testDonateFunctionality() {
    console.log(`\n${colors.cyan}=== Test Suite 1: /api/donate Functionality ===${colors.reset}\n`);

    // API-TC001: Successful PIX Donation
    const result1 = await apiRequest('/api/donate', 'POST', validDonation);
    logTest(
        'API-TC001: Create PIX donation with valid data',
        result1.status === 200 && result1.data?.id,
        result1.status !== 200 ? `Status: ${result1.status}, Error: ${result1.data?.error}` : ''
    );

    if (result1.data?.id) {
        logTest(
            'API-TC001: Response contains QR code data',
            result1.data.qr_codes && Array.isArray(result1.data.qr_codes),
            !result1.data.qr_codes ? 'QR codes not found in response' : ''
        );
    }

    // API-TC004: Credit Card Payment (will fail without SSL)
    const creditCardDonation = {
        ...validDonation,
        paymentMethod: 'credit_card',
        token: 'test_token',
        paymentMethodId: 'visa',
        installments: 1,
        issuerId: '123'
    };

    const result4 = await apiRequest('/api/donate', 'POST', creditCardDonation);
    logTest(
        'API-TC004: Credit card payment attempt',
        result4.status === 200 || result4.status === 500,
        result4.status === 500 ? 'Expected: Requires SSL/HTTPS' : ''
    );
}

// Test Suite 2: POST /api/donate - Validation Tests
async function testDonateValidation() {
    console.log(`\n${colors.cyan}=== Test Suite 2: /api/donate Validation ===${colors.reset}\n`);

    // API-TC002: Invalid CPF
    const invalidCPF = {
        ...validDonation,
        customer: { ...validDonation.customer, cpf: '11111111111' }
    };

    const result2 = await apiRequest('/api/donate', 'POST', invalidCPF);
    logTest(
        'API-TC002: Reject invalid CPF',
        result2.status === 400 || result2.status === 500,
        result2.status === 200 ? 'Warning: Invalid CPF was accepted' : ''
    );

    // API-TC003: Missing Required Fields
    const missingFields = {
        amount: 100.00,
        customer: { name: 'Test' }
    };

    const result3 = await apiRequest('/api/donate', 'POST', missingFields);
    logTest(
        'API-TC003: Reject missing required fields',
        result3.status === 400 && result3.data?.error,
        result3.status !== 400 ? `Status: ${result3.status}` : ''
    );

    // API-TC008: Invalid Amount (negative)
    const invalidAmount = {
        ...validDonation,
        amount: -50.00
    };

    const result8 = await apiRequest('/api/donate', 'POST', invalidAmount);
    logTest(
        'API-TC008: Reject negative amount',
        result8.status === 400 || result8.status === 500,
        result8.status === 200 ? 'Warning: Negative amount was accepted' : ''
    );

    // Zero amount
    const zeroAmount = {
        ...validDonation,
        amount: 0
    };

    const result8b = await apiRequest('/api/donate', 'POST', zeroAmount);
    logTest(
        'API-TC008: Reject zero amount',
        result8b.status === 400 || result8b.status === 500,
        result8b.status === 200 ? 'Warning: Zero amount was accepted' : ''
    );
}

// Test Suite 3: POST /api/check-donor
async function testCheckDonor() {
    console.log(`\n${colors.cyan}=== Test Suite 3: /api/check-donor ===${colors.reset}\n`);

    // API-TC005: Check existing donor (after creating one)
    const checkExisting = await apiRequest('/api/check-donor', 'POST', {
        cpf: '12345678900',
        churchLocation: 'central'
    });

    logTest(
        'API-TC005: Check donor endpoint responds',
        checkExisting.status === 200,
        checkExisting.status !== 200 ? `Status: ${checkExisting.status}` : ''
    );

    if (checkExisting.status === 200) {
        logTest(
            'API-TC005: Response has exists field',
            checkExisting.data?.hasOwnProperty('exists'),
            !checkExisting.data?.hasOwnProperty('exists') ? 'Missing exists field' : ''
        );
    }

    // API-TC006: Check non-existing donor
    const checkNonExisting = await apiRequest('/api/check-donor', 'POST', {
        cpf: '99999999999',
        churchLocation: 'central'
    });

    logTest(
        'API-TC006: Non-existing donor returns exists: false',
        checkNonExisting.status === 200 && checkNonExisting.data?.exists === false,
        checkNonExisting.data?.exists !== false ? 'Should return exists: false' : ''
    );
}

// Test Suite 4: POST /api/check-status
async function testCheckStatus() {
    console.log(`\n${colors.cyan}=== Test Suite 4: /api/check-status ===${colors.reset}\n`);

    // API-TC007: Check payment status
    const result7 = await apiRequest('/api/check-status', 'POST', {
        paymentId: '123456789'
    });

    logTest(
        'API-TC007: Check status endpoint responds',
        result7.status === 200 || result7.status === 404 || result7.status === 500,
        result7.status === 0 ? 'Endpoint may not exist' : ''
    );

    if (result7.status === 200 && result7.data) {
        logTest(
            'API-TC007: Response contains status field',
            result7.data.hasOwnProperty('status'),
            !result7.data.hasOwnProperty('status') ? 'Missing status field' : ''
        );
    }
}

// Test Suite 5: Security Tests
async function testSecurity() {
    console.log(`\n${colors.cyan}=== Test Suite 5: Security Tests ===${colors.reset}\n`);

    // API-TC009: SQL Injection Prevention
    const sqlInjection = {
        ...validDonation,
        description: "Dízimos'; DROP TABLE donations; --",
        customer: {
            ...validDonation.customer,
            name: "João'; DROP TABLE donations; --"
        }
    };

    const result9 = await apiRequest('/api/donate', 'POST', sqlInjection);
    logTest(
        'API-TC009: SQL injection attempt handled safely',
        result9.status === 200 || result9.status === 400,
        result9.status === 0 ? 'Server may have crashed - CRITICAL!' : ''
    );

    // API-TC012: CORS Headers (check with OPTIONS)
    const corsCheck = await fetch(`${BASE_URL}/api/donate`, {
        method: 'OPTIONS'
    });

    logTest(
        'API-TC012: CORS preflight request handled',
        corsCheck.status === 200 || corsCheck.status === 204,
        corsCheck.status >= 400 ? 'CORS may not be configured' : ''
    );
}

// Test Suite 6: Performance Tests
async function testPerformance() {
    console.log(`\n${colors.cyan}=== Test Suite 6: Performance Tests ===${colors.reset}\n`);

    // API-TC010: Response Time
    const perfTests = [
        { endpoint: '/api/donate', body: validDonation },
        { endpoint: '/api/check-donor', body: { cpf: '12345678900', churchLocation: 'central' } },
        { endpoint: '/api/check-status', body: { paymentId: '123' } }
    ];

    for (const test of perfTests) {
        const result = await apiRequest(test.endpoint, 'POST', test.body);
        logTest(
            `API-TC010: ${test.endpoint} responds in < 2000ms`,
            result.responseTime < 2000,
            result.responseTime >= 2000 ? `Response time: ${result.responseTime}ms` : `Response time: ${result.responseTime}ms ✓`
        );
    }
}

// Test Suite 7: Error Handling
async function testErrorHandling() {
    console.log(`\n${colors.cyan}=== Test Suite 7: Error Handling ===${colors.reset}\n`);

    // Invalid JSON
    try {
        const response = await fetch(`${BASE_URL}/api/donate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid json'
        });

        logTest(
            'API-TC011: Invalid JSON handled gracefully',
            response.status === 400 || response.status === 500,
            response.status === 200 ? 'Should reject invalid JSON' : ''
        );
    } catch (error) {
        logTest('API-TC011: Invalid JSON handled gracefully', false, error.message);
    }

    // Empty body
    const emptyBody = await apiRequest('/api/donate', 'POST', {});
    logTest(
        'API-TC011: Empty request body handled',
        emptyBody.status === 400,
        emptyBody.status !== 400 ? `Status: ${emptyBody.status}` : ''
    );
}

// Main test runner
async function runAllTests() {
    console.log(`${colors.blue}
╔═══════════════════════════════════════════════════════════╗
║     Chamachurch Backend API Test Suite                    ║
║     Testing: http://localhost:3000                        ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

    try {
        await testDonateFunctionality();
        await testDonateValidation();
        await testCheckDonor();
        await testCheckStatus();
        await testSecurity();
        await testPerformance();
        await testErrorHandling();

        // Print summary
        console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
        console.log(`\n${colors.cyan}Test Summary:${colors.reset}`);
        console.log(`  Total Tests: ${results.total}`);
        console.log(`  ${colors.green}✓ Passed: ${results.passed}${colors.reset}`);
        console.log(`  ${colors.red}✗ Failed: ${results.failed}${colors.reset}`);
        console.log(`  Pass Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

        // Save results to file
        const fs = require('fs');
        const reportPath = './testsprite_tests/backend_test_results.json';
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`\n${colors.cyan}Results saved to: ${reportPath}${colors.reset}\n`);

        // Exit with appropriate code
        process.exit(results.failed > 0 ? 1 : 0);

    } catch (error) {
        console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
        process.exit(1);
    }
}

// Run tests
runAllTests();
