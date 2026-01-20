const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_PAGBANK_ENV === 'production'
    ? 'https://api.pagseguro.com'
    : 'https://sandbox.api.pagseguro.com';

interface CreateOrderParams {
    amount: number;
    description: string;
    customer: {
        name: string;
        email: string;
        tax_id: string; // CPF/CNPJ
        phone: {
            area: string;
            number: string;
        };
    };
    paymentMethod: 'pix' | 'credit_card';
    cardToken?: string; // Optional for credit card
    encryptedCard?: string; // Alternative for credit card
    cardBody?: {
        number: string;
        holder: string;
        expMonth: string;
        expYear: string;
        cvv: string;
    };
}

export async function createOrder(params: CreateOrderParams) {
    if (!PAGBANK_TOKEN) {
        throw new Error('PAGBANK_TOKEN is not configured');
    }

    const { amount, description, customer, paymentMethod, cardToken, encryptedCard } = params;

    // Basic payload structure
    const payload: any = {
        reference_id: `REF-${Date.now()}`,
        customer: {
            name: customer.name,
            email: customer.email,
            tax_id: customer.tax_id.replace(/\D/g, ''),
            phones: [
                {
                    country: '55',
                    area: customer.phone.area,
                    number: customer.phone.number,
                    type: 'MOBILE'
                }
            ]
        },
        items: [
            {
                name: description,
                quantity: 1,
                unit_amount: Math.round(amount * 100) // Convert to cents
            }
        ],
        notification_urls: [
            'https://chamachurch.com/api/webhook/pagbank' // Placeholder
        ]
    };

    // Payment Method Specifics
    if (paymentMethod === 'pix') {
        payload.qr_codes = [
            {
                amount: {
                    value: Math.round(amount * 100)
                },
                expiration_date: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour expiration
            }
        ];
    } else if (paymentMethod === 'credit_card') {
        const cardBody = params.cardBody;

        payload.charges = [
            {
                reference_id: `CHARGE-${Date.now()}`,
                description: description,
                amount: {
                    value: Math.round(amount * 100),
                    currency: 'BRL'
                },
                payment_method: {
                    type: 'CREDIT_CARD',
                    installments: 1,
                    capture: true,
                    card: {
                        number: cardBody?.number,
                        exp_month: cardBody?.expMonth,
                        exp_year: cardBody?.expYear,
                        security_code: cardBody?.cvv,
                        holder: {
                            name: cardBody?.holder
                        },
                        store: false
                    }
                }
            }
        ];
    }

    try {
        const response = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAGBANK_TOKEN}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('PagBank API Error Status:', response.status);
            console.error('PagBank API Error Body:', JSON.stringify(data, null, 2));
            // Extract the first error message if available
            const errorMessage = data.error_messages
                ? data.error_messages.map((e: any) => `${e.code}: ${e.message} (${e.parameter_name})`).join(', ')
                : (data.message || 'Failed to create order');
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('Create Order Exception:', error);
        throw error;
    }
}
