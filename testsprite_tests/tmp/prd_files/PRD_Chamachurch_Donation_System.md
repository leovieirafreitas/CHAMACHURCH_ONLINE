# Product Requirements Document (PRD)
## Chamachurch Online Donation System

---

## 1. Product Overview

### 1.1 Product Name
**Chamachurch Online Donation System** (Sistema de Contribuição Chamachurch)

### 1.2 Product Vision
Provide a secure, user-friendly online platform for church members and supporters to make donations (tithes, offerings, and mission contributions) to Chamachurch locations in Brazil and Africa, with seamless payment processing and transparent donation tracking.

### 1.3 Target Users
- **Primary Users**: Church members and supporters who want to make financial contributions
- **Secondary Users**: Church administrators who need to track and manage donations
- **Locations Served**: 
  - Chama Church - Manaus
  - Chama Church - Manacapuru
  - Chama Church África
  - Chama Church On-line

---

## 2. Core Features

### 2.1 Donation Management

#### 2.1.1 Donation Types
**Priority**: P0 (Critical)

**Description**: Users can select from multiple donation categories:
- **Dízimos (Tithes)**: Regular 10% contribution
- **Ofertas (Offerings)**:
  - Oferta de Gratidão (Gratitude Offering)
  - Oferta de Amor (Love Offering)
  - Oferta de Construção (Building Offering)
- **Missões (Missions)**:
  - Missões Brasil (Brazil Missions)
  - Missões África (Africa Missions)

**Acceptance Criteria**:
- All donation types must be clearly labeled with descriptions
- Icons must be displayed for each category
- User can select only one donation type per transaction

#### 2.1.2 Donation Amount Input
**Priority**: P0 (Critical)

**Description**: Users can enter custom donation amounts in Brazilian Reais (BRL).

**Acceptance Criteria**:
- Amount must be formatted as currency (R$ XX,XX)
- Minimum donation amount validation
- Real-time currency formatting as user types
- Clear visual feedback for invalid amounts

#### 2.1.3 Church Location Selection
**Priority**: P0 (Critical)

**Description**: Users must select which church location their donation is for.

**Acceptance Criteria**:
- Dropdown or selection interface for 4 locations
- Selection is required before proceeding
- Selected location is stored with donation record

### 2.2 User Information Collection

#### 2.2.1 Personal Information Form
**Priority**: P0 (Critical)

**Description**: Collect donor information for payment processing and receipts.

**Required Fields**:
- Full Name
- CPF (Brazilian Tax ID)
- Email Address
- Phone Number (with area code)

**Acceptance Criteria**:
- CPF validation (11 digits, valid format)
- Email format validation
- Phone number validation (10-11 digits)
- All fields are required
- Auto-fill for returning donors based on CPF

#### 2.2.2 Donor Recognition
**Priority**: P1 (High)

**Description**: System checks if donor CPF exists in database and auto-fills information.

**Acceptance Criteria**:
- API call to check CPF on blur/change
- Auto-populate name, email, phone if found
- Allow user to update information if needed
- No error if CPF not found (new donor)

### 2.3 Payment Processing

#### 2.3.1 PIX Payment Integration
**Priority**: P0 (Critical)

**Description**: Process donations via PIX using Mercado Pago API.

**Acceptance Criteria**:
- Generate QR code for PIX payment
- Display copy-paste PIX code
- Show payment expiration time
- Real-time payment status checking
- Update donation status when payment confirmed
- Handle payment timeout/expiration

**Technical Requirements**:
- Integration with Mercado Pago Payment API
- QR code generation and display
- Polling mechanism for payment status
- Secure API key management

#### 2.3.2 Credit Card Payment Integration
**Priority**: P0 (Critical)

**Description**: Process donations via credit card using Mercado Pago API.

**Acceptance Criteria**:
- Secure card data collection (tokenization)
- Support for major card brands (Visa, Mastercard, etc.)
- Installment options display
- Card validation before submission
- Immediate payment confirmation/rejection
- Error handling for declined cards

**Technical Requirements**:
- Mercado Pago SDK integration
- PCI-compliant card tokenization
- Issuer identification
- Installment calculation

### 2.4 Receipt Generation

#### 2.4.1 PDF Receipt Creation
**Priority**: P0 (Critical)

**Description**: Generate professional PDF receipts for completed donations.

**Receipt Contents**:
- Church branding/logo
- Donation ID and date
- Donor name and CPF
- Donation amount and type
- Church location
- Payment method
- Receipt verification QR code

**Acceptance Criteria**:
- PDF generated immediately after payment confirmation
- Professional formatting and layout
- Downloadable to user's device
- Includes all required information for tax purposes

#### 2.4.2 Receipt Sharing
**Priority**: P1 (High)

**Description**: Allow users to share receipts via WhatsApp.

**Acceptance Criteria**:
- WhatsApp share button on receipt
- Pre-formatted message with donation details
- PDF attachment included
- Works on mobile and desktop

### 2.5 Donation History

#### 2.5.1 History Search
**Priority**: P1 (High)

**Description**: Users can search their donation history by CPF and location.

**Acceptance Criteria**:
- Search by CPF (required)
- Filter by church location (optional)
- Display list of all matching donations
- Show donation status, amount, date, type
- Sort by date (newest first)
- Pagination for large result sets

#### 2.5.2 Status Tracking
**Priority**: P1 (High)

**Description**: Display current status of each donation and auto-update pending payments.

**Donation Statuses**:
- `pending`: Payment initiated but not confirmed
- `paid`: Payment confirmed and processed
- `declined`: Payment rejected
- `canceled`: Payment canceled by user or timeout

**Acceptance Criteria**:
- Visual status indicators (colors, icons)
- Automatic status checking for pending donations
- Status updates without page refresh
- Clear status labels in Portuguese

### 2.6 Admin Dashboard

#### 2.6.1 Admin Authentication
**Priority**: P0 (Critical)

**Description**: Secure login system for church administrators.

**Acceptance Criteria**:
- Username/password authentication
- Session management
- Logout functionality
- Redirect to login if not authenticated
- Password stored securely (hashed)

#### 2.6.2 Dashboard Statistics
**Priority**: P1 (High)

**Description**: Display key metrics about donations.

**Metrics Displayed**:
- Total donations (count)
- Total amount donated (sum)
- Unique donors (count)
- Pending payments (count)
- Today's earnings
- Month's earnings

**Acceptance Criteria**:
- Real-time data from database
- Clear visual presentation (cards/widgets)
- Currency formatting for amounts
- Auto-refresh capability

#### 2.6.3 Donation List Management
**Priority**: P1 (High)

**Description**: View and manage all donations in the system.

**Features**:
- Paginated donation list
- Filter by status
- Filter by date range
- Search by donor name/CPF
- Sort by various fields
- View donation details

**Acceptance Criteria**:
- Display all relevant donation information
- Pagination (configurable items per page)
- Responsive table design
- Export capability (future enhancement)

#### 2.6.4 Donation Cleanup Tools
**Priority**: P2 (Medium)

**Description**: Administrative tools to clean up donations by status.

**Acceptance Criteria**:
- Delete donations by status (pending, declined, canceled)
- Confirmation dialog before deletion
- Bulk deletion capability
- Cannot delete paid donations
- Audit log of deletions (future enhancement)

---

## 3. Technical Architecture

### 3.1 Technology Stack

**Frontend**:
- Next.js 16.1.4 (React 19.2.3)
- TypeScript 5.9.3
- CSS Modules for styling

**Backend**:
- Next.js API Routes (serverless functions)
- Node.js runtime

**Database**:
- Supabase (PostgreSQL)

**Payment Processing**:
- Mercado Pago API

**PDF Generation**:
- jsPDF library

### 3.2 Database Schema

#### Donations Table
```sql
- id: UUID (primary key)
- amount: DECIMAL
- type: VARCHAR (donation type)
- church_location: VARCHAR
- payment_method: VARCHAR (pix, credit_card)
- status: VARCHAR (pending, paid, declined, canceled)
- payer_name: VARCHAR
- payer_email: VARCHAR
- payer_cpf: VARCHAR
- payer_phone: VARCHAR
- pagbank_order_id: VARCHAR (Mercado Pago payment ID)
- pagbank_reference_id: VARCHAR
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Admin Table
```sql
- id: UUID (primary key)
- username: VARCHAR
- password: VARCHAR (hashed)
- created_at: TIMESTAMP
```

### 3.3 API Endpoints

#### Public Endpoints
- `POST /api/donate` - Create new donation and process payment
- `POST /api/check-status` - Check payment status
- `POST /api/check-donor` - Check if donor exists

#### Protected Endpoints
- Admin dashboard routes (authentication required)

### 3.4 Security Requirements

**Priority**: P0 (Critical)

**Requirements**:
- HTTPS only for all connections
- Environment variables for sensitive data (API keys, database credentials)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF protection
- Rate limiting on API endpoints
- Secure password hashing (bcrypt or similar)
- PCI compliance for card data (tokenization)

---

## 4. User Experience Requirements

### 4.1 Multi-Step Donation Flow

**Steps**:
1. Select donation type
2. Enter donation amount
3. Enter personal information
4. Select church location
5. Choose payment method
6. Complete payment
7. View receipt

**UX Requirements**:
- Clear progress indication
- Back navigation between steps
- Form validation at each step
- Error messages in Portuguese
- Loading states during API calls
- Success confirmation

### 4.2 Responsive Design

**Priority**: P0 (Critical)

**Requirements**:
- Mobile-first design approach
- Responsive layouts for all screen sizes
- Touch-friendly interface elements
- Optimized for common mobile devices
- Desktop optimization for admin dashboard

### 4.3 Accessibility

**Priority**: P2 (Medium)

**Requirements**:
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Clear error messages
- Focus indicators

### 4.4 Performance

**Priority**: P1 (High)

**Requirements**:
- Page load time < 3 seconds
- API response time < 2 seconds
- Optimized images and assets
- Code splitting and lazy loading
- Efficient database queries

---

## 5. Localization

### 5.1 Language Support

**Priority**: P0 (Critical)

**Requirements**:
- All UI text in Brazilian Portuguese
- Currency in Brazilian Reais (R$)
- Date format: DD/MM/YYYY
- Phone format: (XX) XXXXX-XXXX
- CPF format: XXX.XXX.XXX-XX

---

## 6. Testing Requirements

### 6.1 Unit Testing
- Payment processing functions
- Form validation logic
- Database operations
- API endpoint handlers

### 6.2 Integration Testing
- Mercado Pago API integration
- Supabase database operations
- End-to-end donation flow
- Receipt generation

### 6.3 User Acceptance Testing
- Complete donation flow (PIX and credit card)
- Admin dashboard functionality
- Donation history search
- Receipt generation and sharing
- Mobile device testing

---

## 7. Deployment Requirements

### 7.1 Environment Configuration

**Required Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `MP_ACCESS_TOKEN` (Mercado Pago)
- `NEXT_PUBLIC_MP_PUBLIC_KEY` (Mercado Pago)

### 7.2 Hosting Requirements
- Node.js 18+ runtime
- HTTPS support
- Environment variable management
- Automatic deployments from Git
- Backup and disaster recovery

---

## 8. Future Enhancements

### 8.1 Planned Features (Not in Current Scope)
- Recurring donations (monthly subscriptions)
- Multiple payment methods (bank transfer, boleto)
- Donation campaigns and goals
- Donor portal with full history
- Email notifications
- SMS confirmations
- Advanced analytics and reporting
- Export to accounting software
- Multi-language support
- Mobile app (iOS/Android)

---

## 9. Success Metrics

### 9.1 Key Performance Indicators (KPIs)
- Number of successful donations per month
- Total donation amount per month
- Payment success rate (%)
- Average donation amount
- User retention rate
- Payment method distribution
- Mobile vs desktop usage
- Page load performance metrics

### 9.2 User Satisfaction Metrics
- Donation completion rate
- Time to complete donation
- Error rate during donation process
- User feedback and ratings

---

## 10. Compliance and Legal

### 10.1 Data Privacy
- LGPD (Brazilian General Data Protection Law) compliance
- Privacy policy disclosure
- User consent for data collection
- Data retention policies
- Right to data deletion

### 10.2 Financial Compliance
- Tax receipt requirements
- Financial record keeping
- Audit trail for all transactions
- PCI DSS compliance for card payments

---

**Document Version**: 1.0  
**Last Updated**: January 22, 2026  
**Status**: Active Development
