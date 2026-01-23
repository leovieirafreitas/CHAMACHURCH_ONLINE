# Technical Specification Document
## Chamachurch Online Donation System

---

## 1. System Architecture

### 1.1 Architecture Overview
The system follows a modern **JAMstack architecture** with:
- **Frontend**: Next.js with React (Server-Side Rendering + Client-Side Rendering)
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: Supabase (PostgreSQL with REST API)
- **Payment Gateway**: Mercado Pago API
- **Hosting**: Vercel/Render (recommended)

### 1.2 Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Donation Page│  │ History Page │  │ Admin Dashboard│     │
│  │  (page.tsx)  │  │(historico)   │  │  (admin)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/donate  │  │/api/check-   │  │/api/check-   │      │
│  │              │  │  status      │  │  donor       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                ↓                              ↓
┌──────────────────────────┐    ┌──────────────────────────┐
│   PAYMENT GATEWAY        │    │      DATABASE            │
│   Mercado Pago API       │    │      Supabase            │
│   - PIX Processing       │    │   - Donations Table      │
│   - Card Processing      │    │   - Admin Table          │
│   - Status Checking      │    │   - PostgreSQL           │
└──────────────────────────┘    └──────────────────────────┘
```

---

## 2. Database Design

### 2.1 Donations Table Schema

```typescript
interface Donation {
  id: string;                    // UUID, Primary Key
  amount: number;                // DECIMAL(10,2)
  type: string;                  // VARCHAR(100) - donation type
  church_location: string;       // VARCHAR(100)
  payment_method: 'pix' | 'credit_card';
  status: 'pending' | 'paid' | 'declined' | 'canceled';
  payer_name: string;            // VARCHAR(255)
  payer_email: string;           // VARCHAR(255)
  payer_cpf: string;             // VARCHAR(14) - formatted
  payer_phone: string;           // VARCHAR(15)
  pagbank_order_id: string;      // VARCHAR(100) - MP payment ID
  pagbank_reference_id: string;  // VARCHAR(100)
  created_at: string;            // TIMESTAMP
  updated_at?: string;           // TIMESTAMP
}
```

**Indexes**:
- Primary: `id`
- Index on: `payer_cpf` (for donor lookup)
- Index on: `status` (for filtering)
- Index on: `created_at` (for sorting)
- Index on: `church_location` (for filtering)

### 2.2 Admin Table Schema

```typescript
interface Admin {
  id: string;           // UUID, Primary Key
  username: string;     // VARCHAR(100), UNIQUE
  password: string;     // VARCHAR(255) - bcrypt hashed
  created_at: string;   // TIMESTAMP
}
```

**Indexes**:
- Primary: `id`
- Unique: `username`

### 2.3 Supabase Configuration

**Row Level Security (RLS) Policies**:

```sql
-- Donations table policies
-- Allow public insert (for new donations)
CREATE POLICY "Allow public insert" ON donations
  FOR INSERT WITH CHECK (true);

-- Allow public read for own donations (by CPF)
CREATE POLICY "Allow read own donations" ON donations
  FOR SELECT USING (true);

-- Allow admin full access
CREATE POLICY "Allow admin full access" ON donations
  FOR ALL USING (auth.role() = 'authenticated');

-- Admin table policies
-- Only allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON admin
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 3. API Specifications

### 3.1 POST /api/donate

**Purpose**: Create a new donation and process payment via Mercado Pago

**Request Body**:
```typescript
{
  amount: number;              // Required, > 0
  description: string;         // Donation type description
  churchLocation: string;      // Required
  paymentMethod: 'pix' | 'credit_card';
  customer: {
    name: string;              // Required
    email: string;             // Required
    cpf: string;               // Required, 11 digits
    phone: string;             // Required, 10-11 digits
  };
  // For credit card only:
  token?: string;              // Card token from MP SDK
  paymentMethodId?: string;    // 'visa', 'master', etc.
  installments?: number;       // 1-12
  issuerId?: string;           // Issuer ID from MP
}
```

**Response (Success - PIX)**:
```typescript
{
  id: number;                  // MP payment ID
  status: string;              // 'pending', 'approved', etc.
  detail: string;              // Status detail
  qr_codes: [{
    links: [{
      rel: 'QRCODE.PNG',
      href: string;            // Base64 QR code image
    }],
    text: string;              // PIX copy-paste code
  }]
}
```

**Response (Success - Credit Card)**:
```typescript
{
  id: number;                  // MP payment ID
  status: string;              // 'approved', 'rejected', etc.
  detail: string;              // Status detail
}
```

**Response (Error)**:
```typescript
{
  error: string;               // Error message
}
```

**Status Codes**:
- `200`: Success
- `400`: Bad request (missing fields)
- `500`: Server error

### 3.2 POST /api/check-status

**Purpose**: Check payment status with Mercado Pago and update database

**Request Body**:
```typescript
{
  paymentId: string;           // MP payment ID
}
```

**Response**:
```typescript
{
  status: string;              // Current payment status
  mpStatus: string;            // Original MP status
}
```

### 3.3 POST /api/check-donor

**Purpose**: Check if donor exists in database by CPF

**Request Body**:
```typescript
{
  cpf: string;                 // 11 digits
  churchLocation: string;      // Filter by location
}
```

**Response (Found)**:
```typescript
{
  exists: true;
  donor: {
    name: string;
    email: string;
    phone: string;
  }
}
```

**Response (Not Found)**:
```typescript
{
  exists: false;
}
```

---

## 4. Payment Processing

### 4.1 Mercado Pago Integration

**SDK Version**: `mercadopago@2.12.0`

**Configuration**:
```typescript
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});
```

**Environment Modes**:
- **Test Mode**: Access token starts with `TEST-`
- **Production Mode**: Access token starts with `APP_USR-`

### 4.2 PIX Payment Flow

**Step 1**: Create payment
```typescript
const paymentData = {
  transaction_amount: amount,
  description: description,
  payment_method_id: 'pix',
  payer: {
    email: payerEmail,
    first_name: firstName,
    last_name: lastName,
    identification: {
      type: 'CPF',
      number: cpf
    }
  },
  external_reference: `REF-${Date.now()}`
};

const response = await payment.create({ body: paymentData });
```

**Step 2**: Extract QR code data
```typescript
const qrCodeBase64 = response.point_of_interaction.transaction_data.qr_code_base64;
const qrCodeText = response.point_of_interaction.transaction_data.qr_code;
```

**Step 3**: Poll for payment status
- Check every 5 seconds
- Maximum 10 minutes
- Update database when status changes

### 4.3 Credit Card Payment Flow

**Step 1**: Tokenize card on frontend
```javascript
// Using Mercado Pago SDK
const cardToken = await mp.createCardToken({
  cardNumber: '1234567812345678',
  cardholderName: 'HOLDER NAME',
  cardExpirationMonth: '12',
  cardExpirationYear: '2025',
  securityCode: '123',
  identificationType: 'CPF',
  identificationNumber: '12345678900'
});
```

**Step 2**: Send token to backend
```typescript
const paymentData = {
  transaction_amount: amount,
  description: description,
  payment_method_id: paymentMethodId, // 'visa', 'master'
  token: cardToken.id,
  installments: installments,
  issuer_id: issuerId,
  payer: { /* ... */ }
};

const response = await payment.create({ body: paymentData });
```

**Step 3**: Handle response
- `approved`: Payment successful
- `rejected`: Payment declined
- `in_process`: Under review

### 4.4 Status Mapping

**Mercado Pago → Internal Status**:
```typescript
const statusMap = {
  'approved': 'paid',
  'rejected': 'declined',
  'cancelled': 'canceled',
  'in_process': 'pending',
  'pending': 'pending'
};
```

---

## 5. Frontend Components

### 5.1 Main Donation Page (`app/page.tsx`)

**Component Structure**:
```
Home (Main Component)
├── Header (Logo, Title)
├── Donation Type Selection
│   └── Grid of donation cards
├── Amount Input
├── Personal Information Form
│   ├── Name Input
│   ├── CPF Input (with validation)
│   ├── Email Input
│   └── Phone Input
├── Church Location Selector
├── Payment Method Selection
│   ├── PIX Option
│   └── Credit Card Option
├── Payment Processing
│   ├── PIX QR Code Display
│   └── Credit Card Form
└── Receipt Display
```

**State Management**:
```typescript
const [step, setStep] = useState(1);
const [selectedType, setSelectedType] = useState('');
const [amount, setAmount] = useState('');
const [formData, setFormData] = useState({
  name: '',
  cpf: '',
  email: '',
  phone: ''
});
const [churchLocation, setChurchLocation] = useState('');
const [paymentMethod, setPaymentMethod] = useState('pix');
const [paymentData, setPaymentData] = useState(null);
const [loading, setLoading] = useState(false);
```

### 5.2 History Page (`app/historico/page.tsx`)

**Features**:
- CPF search form
- Church location filter
- Donation list display
- Status auto-update for pending donations
- Receipt regeneration
- WhatsApp sharing

**Auto-Update Logic**:
```typescript
const checkPendingStatuses = async (items) => {
  const pendingItems = items.filter(item => item.status === 'pending');
  
  for (const item of pendingItems) {
    const response = await fetch('/api/check-status', {
      method: 'POST',
      body: JSON.stringify({ paymentId: item.pagbank_order_id })
    });
    
    const data = await response.json();
    
    if (data.status !== 'pending') {
      // Update UI with new status
    }
  }
};
```

### 5.3 Admin Dashboard (`app/admin/dashboard/page.tsx`)

**Features**:
- Authentication check
- Statistics cards
- Donation list with pagination
- Date filtering
- Status filtering
- Cleanup tools

**Statistics Calculation**:
```typescript
const stats = {
  totalDonations: donations.length,
  totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
  uniqueDonors: new Set(donations.map(d => d.payer_cpf)).size,
  pendingPayments: donations.filter(d => d.status === 'pending').length,
  todayEarnings: donations
    .filter(d => isToday(d.created_at) && d.status === 'paid')
    .reduce((sum, d) => sum + d.amount, 0),
  monthEarnings: donations
    .filter(d => isThisMonth(d.created_at) && d.status === 'paid')
    .reduce((sum, d) => sum + d.amount, 0)
};
```

---

## 6. Security Implementation

### 6.1 Input Validation

**CPF Validation**:
```typescript
function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Checksum validation
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}
```

**Email Validation**:
```typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

### 6.2 Environment Variables

**Required Variables**:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Mercado Pago
MP_ACCESS_TOKEN=TEST-xxx or APP_USR-xxx
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxx or APP_USR-xxx
```

**Security Best Practices**:
- Never commit `.env.local` to version control
- Use different keys for test and production
- Rotate keys periodically
- Use `NEXT_PUBLIC_` prefix only for client-side variables

### 6.3 API Security

**Rate Limiting** (Recommended):
```typescript
// Implement rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

**CORS Configuration**:
```typescript
// Next.js API route
export async function POST(request: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  // ... rest of handler
}
```

---

## 7. Error Handling

### 7.1 Frontend Error Handling

**Payment Errors**:
```typescript
try {
  const response = await fetch('/api/donate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Payment failed');
  }
  
  const data = await response.json();
  setPaymentData(data);
} catch (error) {
  console.error('Payment error:', error);
  alert(`Erro no pagamento: ${error.message}`);
  setLoading(false);
}
```

### 7.2 Backend Error Handling

**Mercado Pago Errors**:
```typescript
try {
  const response = await payment.create({ body: paymentData });
  return response;
} catch (error: any) {
  console.error('MP Payment Error:', JSON.stringify(error, null, 2));
  
  if (error.cause) {
    console.error('MP Error Causes:', JSON.stringify(error.cause, null, 2));
  }
  
  // Return user-friendly error
  throw new Error(
    error.message || 'Erro ao processar pagamento. Tente novamente.'
  );
}
```

**Database Errors**:
```typescript
const { data, error } = await supabase
  .from('donations')
  .insert(donationData);

if (error) {
  console.error('Supabase Error:', error);
  throw new Error('Erro ao salvar doação no banco de dados.');
}
```

---

## 8. Performance Optimization

### 8.1 Code Splitting

**Dynamic Imports**:
```typescript
// Load heavy components only when needed
const PDFGenerator = dynamic(() => import('@/components/PDFGenerator'), {
  ssr: false,
  loading: () => <p>Gerando recibo...</p>
});
```

### 8.2 Image Optimization

**Next.js Image Component**:
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Chamachurch Logo"
  width={200}
  height={100}
  priority // For above-the-fold images
/>
```

### 8.3 API Response Caching

**Supabase Query Optimization**:
```typescript
// Use select to fetch only needed columns
const { data } = await supabase
  .from('donations')
  .select('id, amount, status, created_at')
  .eq('payer_cpf', cpf)
  .order('created_at', { ascending: false })
  .limit(50);
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Example: CPF Validation Test**:
```typescript
describe('validateCPF', () => {
  it('should validate correct CPF', () => {
    expect(validateCPF('123.456.789-09')).toBe(true);
  });
  
  it('should reject invalid CPF', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
  });
  
  it('should reject CPF with wrong length', () => {
    expect(validateCPF('123')).toBe(false);
  });
});
```

### 9.2 Integration Tests

**Example: Donation API Test**:
```typescript
describe('POST /api/donate', () => {
  it('should create PIX payment', async () => {
    const response = await fetch('/api/donate', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        description: 'Test Donation',
        churchLocation: 'central',
        paymentMethod: 'pix',
        customer: {
          name: 'Test User',
          email: 'test@test.com',
          cpf: '12345678900',
          phone: '11999999999'
        }
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.qr_codes).toBeDefined();
  });
});
```

### 9.3 E2E Tests (Recommended)

**Using Playwright or Cypress**:
```typescript
test('complete donation flow', async ({ page }) => {
  await page.goto('/');
  
  // Select donation type
  await page.click('[data-testid="donation-type-dizimo"]');
  
  // Enter amount
  await page.fill('[data-testid="amount-input"]', '100');
  
  // Fill personal info
  await page.fill('[data-testid="name-input"]', 'Test User');
  await page.fill('[data-testid="cpf-input"]', '12345678900');
  await page.fill('[data-testid="email-input"]', 'test@test.com');
  await page.fill('[data-testid="phone-input"]', '11999999999');
  
  // Select location
  await page.selectOption('[data-testid="location-select"]', 'central');
  
  // Select payment method
  await page.click('[data-testid="payment-pix"]');
  
  // Submit
  await page.click('[data-testid="submit-button"]');
  
  // Verify QR code appears
  await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
});
```

---

## 10. Deployment

### 10.1 Build Process

**Commands**:
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

**Build Output**:
- Static pages: Pre-rendered at build time
- API routes: Deployed as serverless functions
- Assets: Optimized and cached

### 10.2 Environment Setup

**Vercel Deployment**:
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

**Render Deployment**:
1. Create new Web Service
2. Connect repository
3. Set environment variables
4. Configure:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Node Version: 18+

### 10.3 Database Migration

**Supabase Setup**:
```sql
-- Create donations table
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(100) NOT NULL,
  church_location VARCHAR(100) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  payer_name VARCHAR(255) NOT NULL,
  payer_email VARCHAR(255) NOT NULL,
  payer_cpf VARCHAR(14) NOT NULL,
  payer_phone VARCHAR(15) NOT NULL,
  pagbank_order_id VARCHAR(100),
  pagbank_reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_donations_cpf ON donations(payer_cpf);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created ON donations(created_at DESC);
CREATE INDEX idx_donations_location ON donations(church_location);

-- Create admin table
CREATE TABLE admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 11. Monitoring and Logging

### 11.1 Application Logging

**Console Logging**:
```typescript
// Structured logging
console.log('Processing donation:', {
  amount: paymentData.amount,
  method: paymentData.paymentMethod,
  timestamp: new Date().toISOString()
});

// Error logging
console.error('Payment failed:', {
  error: error.message,
  stack: error.stack,
  paymentId: paymentData.id
});
```

### 11.2 Performance Monitoring

**Recommended Tools**:
- Vercel Analytics (built-in)
- Google Analytics
- Sentry (error tracking)
- LogRocket (session replay)

### 11.3 Database Monitoring

**Supabase Dashboard**:
- Query performance
- Database size
- Active connections
- Slow queries

---

## 12. Maintenance and Support

### 12.1 Regular Tasks

**Daily**:
- Monitor payment success rate
- Check for failed payments
- Review error logs

**Weekly**:
- Database backup verification
- Performance metrics review
- Security updates check

**Monthly**:
- Dependency updates
- Security audit
- Performance optimization

### 12.2 Backup Strategy

**Database Backups**:
- Automatic daily backups (Supabase)
- Point-in-time recovery
- Export critical data weekly

**Code Backups**:
- Git version control
- GitHub repository
- Tagged releases

---

**Document Version**: 1.0  
**Last Updated**: January 22, 2026  
**Author**: Technical Team
