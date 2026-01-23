# Test Cases Document
## Chamachurch Online Donation System

---

## 1. Donation Flow Test Cases

### TC-001: Complete PIX Donation Flow
**Priority**: P0 (Critical)  
**Type**: End-to-End  
**Preconditions**: Application is running, Mercado Pago API is accessible

**Test Steps**:
1. Navigate to home page
2. Select donation type "Dízimos"
3. Enter amount: R$ 100,00
4. Click "Próximo"
5. Enter personal information:
   - Name: "João Silva"
   - CPF: "123.456.789-09" (valid CPF)
   - Email: "joao@example.com"
   - Phone: "(11) 98765-4321"
6. Click "Próximo"
7. Select church location: "Chama Church - Manaus"
8. Click "Próximo"
9. Select payment method: "PIX"
10. Click "Finalizar Doação"

**Expected Results**:
- QR code is displayed
- PIX copy-paste code is shown
- Payment ID is generated
- Donation is saved in database with status "pending"
- Timer shows payment expiration countdown

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-002: Complete Credit Card Donation Flow
**Priority**: P0 (Critical)  
**Type**: End-to-End  
**Preconditions**: Application is running, Mercado Pago SDK is loaded

**Test Steps**:
1. Navigate to home page
2. Select donation type "Oferta de Gratidão"
3. Enter amount: R$ 50,00
4. Click "Próximo"
5. Enter personal information:
   - Name: "Maria Santos"
   - CPF: "987.654.321-00" (valid CPF)
   - Email: "maria@example.com"
   - Phone: "(21) 91234-5678"
6. Click "Próximo"
7. Select church location: "Chama Church On-line"
8. Click "Próximo"
9. Select payment method: "Cartão de Crédito"
10. Enter card details:
    - Card Number: "5031 4332 1540 6351" (test card)
    - Holder Name: "MARIA SANTOS"
    - Expiry: "12/2025"
    - CVV: "123"
11. Select installments: "1x de R$ 50,00"
12. Click "Finalizar Doação"

**Expected Results**:
- Payment is processed
- Success message is displayed
- Donation is saved with status "paid"
- Receipt is generated and displayed
- WhatsApp share option is available

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-003: Donation with Invalid CPF
**Priority**: P1 (High)  
**Type**: Negative Test

**Test Steps**:
1. Navigate to home page
2. Select any donation type
3. Enter amount: R$ 100,00
4. Click "Próximo"
5. Enter personal information with invalid CPF:
   - Name: "Test User"
   - CPF: "111.111.111-11" (invalid)
   - Email: "test@example.com"
   - Phone: "(11) 99999-9999"
6. Attempt to proceed

**Expected Results**:
- Error message is displayed: "CPF inválido"
- User cannot proceed to next step
- Form field is highlighted in red

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-004: Donation with Missing Required Fields
**Priority**: P1 (High)  
**Type**: Negative Test

**Test Steps**:
1. Navigate to home page
2. Select donation type
3. Leave amount field empty
4. Click "Próximo"

**Expected Results**:
- Error message is displayed
- User cannot proceed
- Required field is highlighted

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-005: Returning Donor Auto-Fill
**Priority**: P1 (High)  
**Type**: Functional

**Test Steps**:
1. Complete a donation with CPF "123.456.789-09"
2. Start a new donation
3. Enter the same CPF "123.456.789-09"
4. Tab out of CPF field

**Expected Results**:
- System checks if CPF exists in database
- Name, email, and phone fields are auto-filled
- User can modify the pre-filled information if needed

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

## 2. Payment Processing Test Cases

### TC-006: PIX Payment Status Update
**Priority**: P0 (Critical)  
**Type**: Integration

**Test Steps**:
1. Create a PIX donation
2. Note the payment ID
3. Simulate payment in Mercado Pago test environment
4. Wait for status polling (max 5 seconds)

**Expected Results**:
- Payment status changes from "pending" to "paid"
- Database is updated with new status
- Receipt is automatically generated
- User sees success message

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-007: PIX Payment Timeout
**Priority**: P1 (High)  
**Type**: Functional

**Test Steps**:
1. Create a PIX donation
2. Do not complete payment
3. Wait for payment expiration (typically 10 minutes)

**Expected Results**:
- Payment status remains "pending"
- User sees timeout message
- Option to create new donation is available

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-008: Credit Card Payment Declined
**Priority**: P1 (High)  
**Type**: Negative Test

**Test Steps**:
1. Start credit card donation flow
2. Use test card that will be declined
3. Complete the form and submit

**Expected Results**:
- Payment is rejected by Mercado Pago
- Error message is displayed to user
- Donation is saved with status "declined"
- User can try again with different card

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-009: Multiple Installments Payment
**Priority**: P2 (Medium)  
**Type**: Functional

**Test Steps**:
1. Start credit card donation with amount R$ 300,00
2. Select installments: "3x de R$ 100,00"
3. Complete payment

**Expected Results**:
- Payment is processed with 3 installments
- Total amount saved is R$ 300,00
- Receipt shows installment information

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

## 3. Receipt Generation Test Cases

### TC-010: PDF Receipt Generation
**Priority**: P0 (Critical)  
**Type**: Functional

**Test Steps**:
1. Complete a successful donation
2. Click "Baixar Recibo" button

**Expected Results**:
- PDF is generated successfully
- PDF contains:
  - Church logo/branding
  - Donation ID
  - Date and time
  - Donor name and CPF
  - Amount and donation type
  - Church location
  - Payment method
  - QR code for verification
- PDF is downloaded to user's device

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-011: Receipt WhatsApp Sharing
**Priority**: P1 (High)  
**Type**: Functional

**Test Steps**:
1. Complete a successful donation
2. Click "Compartilhar no WhatsApp" button

**Expected Results**:
- WhatsApp is opened (web or app)
- Pre-formatted message is populated with:
  - Donation confirmation text
  - Amount
  - Date
  - Church name
- PDF receipt is attached (if supported)

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

## 4. Donation History Test Cases

### TC-012: Search Donation History by CPF
**Priority**: P1 (High)  
**Type**: Functional

**Test Steps**:
1. Navigate to "/historico"
2. Enter CPF: "123.456.789-09"
3. Select church location: "Chama Church - Manaus"
4. Click "Buscar"

**Expected Results**:
- All donations for that CPF and location are displayed
- List shows:
  - Donation type
  - Amount
  - Date
  - Status
  - Payment method
- Donations are sorted by date (newest first)

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-013: Auto-Update Pending Payment Status
**Priority**: P1 (High)  
**Type**: Functional

**Test Steps**:
1. Create a PIX donation (status: pending)
2. Navigate to history page
3. Search for the donation
4. Complete the PIX payment in another tab
5. Wait on history page

**Expected Results**:
- System automatically checks pending payment status
- Status updates from "pending" to "paid" without page refresh
- Visual indicator shows status change

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-014: Regenerate Receipt from History
**Priority**: P2 (Medium)  
**Type**: Functional

**Test Steps**:
1. Navigate to history page
2. Search for a paid donation
3. Click "Baixar Recibo" for that donation

**Expected Results**:
- Receipt is regenerated with same information
- PDF is downloaded successfully

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

## 5. Admin Dashboard Test Cases

### TC-015: Admin Login
**Priority**: P0 (Critical)  
**Type**: Functional

**Test Steps**:
1. Navigate to "/admin"
2. Enter valid username
3. Enter valid password
4. Click "Entrar"

**Expected Results**:
- User is authenticated
- Redirected to "/admin/dashboard"
- Session is created

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-016: Admin Login with Invalid Credentials
**Priority**: P1 (High)  
**Type**: Negative Test

**Test Steps**:
1. Navigate to "/admin"
2. Enter invalid username or password
3. Click "Entrar"

**Expected Results**:
- Error message is displayed
- User remains on login page
- No session is created

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-017: View Dashboard Statistics
**Priority**: P1 (High)  
**Type**: Functional

**Test Steps**:
1. Login as admin
2. View dashboard home page

**Expected Results**:
- Statistics cards display:
  - Total donations (count)
  - Total amount (sum)
  - Unique donors (count)
  - Pending payments (count)
  - Today's earnings
  - Month's earnings
- All values are accurate and up-to-date

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-018: Filter Donations by Status
**Priority**: P1 (High)  
**Type**: Functional

**Test Steps**:
1. Login as admin
2. Navigate to donation list
3. Select status filter: "Pago"
4. Apply filter

**Expected Results**:
- Only donations with status "paid" are displayed
- Count is updated
- Pagination is adjusted

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-019: Filter Donations by Date Range
**Priority**: P1 (High)  
**Type**: Functional

**Test Steps**:
1. Login as admin
2. Select start date: "01/01/2026"
3. Select end date: "31/01/2026"
4. Apply filter

**Expected Results**:
- Only donations within date range are displayed
- Statistics are recalculated for filtered data

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-020: Pagination in Donation List
**Priority**: P2 (Medium)  
**Type**: Functional

**Test Steps**:
1. Login as admin
2. View donation list (assuming >10 donations exist)
3. Click "Próxima" to go to page 2

**Expected Results**:
- Next 10 donations are displayed
- Page number is updated
- "Anterior" button becomes enabled
- Total pages are calculated correctly

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-021: Cleanup Pending Donations
**Priority**: P2 (Medium)  
**Type**: Functional

**Test Steps**:
1. Login as admin
2. Click "Limpar Pendentes" button
3. Confirm deletion

**Expected Results**:
- Confirmation dialog appears
- All donations with status "pending" are deleted
- Statistics are updated
- Success message is displayed

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-022: Admin Logout
**Priority**: P1 (High)  
**Type**: Functional

**Test Steps**:
1. Login as admin
2. Click logout button
3. Attempt to access dashboard

**Expected Results**:
- User is logged out
- Session is destroyed
- Redirected to login page
- Cannot access dashboard without re-authentication

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

## 6. Security Test Cases

### TC-023: SQL Injection Prevention
**Priority**: P0 (Critical)  
**Type**: Security

**Test Steps**:
1. Navigate to history search
2. Enter CPF: "' OR '1'='1"
3. Submit search

**Expected Results**:
- Input is sanitized
- No SQL injection occurs
- Either error message or no results

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-024: XSS Prevention
**Priority**: P0 (Critical)  
**Type**: Security

**Test Steps**:
1. Start donation flow
2. Enter name: "<script>alert('XSS')</script>"
3. Complete donation

**Expected Results**:
- Script is not executed
- Input is escaped/sanitized
- Donation is saved safely

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-025: Unauthorized Admin Access
**Priority**: P0 (Critical)  
**Type**: Security

**Test Steps**:
1. Without logging in, navigate directly to "/admin/dashboard"

**Expected Results**:
- Access is denied
- Redirected to login page
- No sensitive data is displayed

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

## 7. Performance Test Cases

### TC-026: Page Load Time
**Priority**: P1 (High)  
**Type**: Performance

**Test Steps**:
1. Clear browser cache
2. Navigate to home page
3. Measure load time

**Expected Results**:
- Page loads in < 3 seconds
- All assets are loaded
- No console errors

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-027: API Response Time
**Priority**: P1 (High)  
**Type**: Performance

**Test Steps**:
1. Submit donation via API
2. Measure response time

**Expected Results**:
- API responds in < 2 seconds
- Payment is processed successfully

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-028: Concurrent Donations
**Priority**: P2 (Medium)  
**Type**: Load Test

**Test Steps**:
1. Simulate 10 concurrent donation requests
2. Monitor system performance

**Expected Results**:
- All donations are processed
- No timeouts or errors
- Database handles concurrent writes

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

## 8. Mobile Responsiveness Test Cases

### TC-029: Mobile Donation Flow
**Priority**: P1 (High)  
**Type**: UI/UX

**Test Steps**:
1. Open application on mobile device (or emulator)
2. Complete full donation flow

**Expected Results**:
- All elements are properly sized
- Touch targets are adequate (min 44x44px)
- Forms are easy to fill on mobile
- No horizontal scrolling
- Payment methods work on mobile

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-030: Tablet Responsiveness
**Priority**: P2 (Medium)  
**Type**: UI/UX

**Test Steps**:
1. Open application on tablet (or emulator)
2. Navigate through all pages

**Expected Results**:
- Layout adapts to tablet screen size
- All features are accessible
- No UI elements are cut off

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

## 9. Browser Compatibility Test Cases

### TC-031: Chrome Compatibility
**Priority**: P0 (Critical)  
**Type**: Compatibility

**Test Steps**:
1. Open application in Google Chrome (latest version)
2. Complete full donation flow

**Expected Results**:
- All features work correctly
- No console errors
- UI renders properly

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-032: Firefox Compatibility
**Priority**: P1 (High)  
**Type**: Compatibility

**Test Steps**:
1. Open application in Firefox (latest version)
2. Complete full donation flow

**Expected Results**:
- All features work correctly
- No console errors
- UI renders properly

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-033: Safari Compatibility
**Priority**: P1 (High)  
**Type**: Compatibility

**Test Steps**:
1. Open application in Safari (latest version)
2. Complete full donation flow

**Expected Results**:
- All features work correctly
- No console errors
- UI renders properly

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

## 10. Edge Cases Test Cases

### TC-034: Very Large Donation Amount
**Priority**: P2 (Medium)  
**Type**: Edge Case

**Test Steps**:
1. Enter donation amount: R$ 999,999.99
2. Complete donation

**Expected Results**:
- Amount is accepted
- Payment is processed correctly
- No overflow errors
- Receipt displays amount correctly

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-035: Special Characters in Name
**Priority**: P2 (Medium)  
**Type**: Edge Case

**Test Steps**:
1. Enter name with special characters: "José da Silva Júnior"
2. Complete donation

**Expected Results**:
- Name is accepted
- Stored correctly in database
- Displays correctly on receipt

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

### TC-036: Network Interruption During Payment
**Priority**: P1 (High)  
**Type**: Edge Case

**Test Steps**:
1. Start payment process
2. Disconnect network during API call
3. Reconnect network

**Expected Results**:
- Error message is displayed
- User can retry payment
- No duplicate donations are created

**Actual Results**: _[To be filled during testing]_

**Status**: _[Pass/Fail]_

---

## Test Summary

**Total Test Cases**: 36

**Priority Breakdown**:
- P0 (Critical): 10 test cases
- P1 (High): 18 test cases
- P2 (Medium): 8 test cases

**Type Breakdown**:
- Functional: 18 test cases
- Integration: 5 test cases
- Security: 3 test cases
- Performance: 3 test cases
- UI/UX: 2 test cases
- Compatibility: 3 test cases
- Edge Cases: 3 test cases
- Negative Tests: 4 test cases

---

**Document Version**: 1.0  
**Last Updated**: January 22, 2026  
**Test Environment**: Development/Staging
