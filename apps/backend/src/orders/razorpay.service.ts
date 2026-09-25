import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export interface RazorpayOrder {
  id: string;
  amount: number; // paise
  currency: string;
}

/**
 * Minimal Razorpay client (Orders API + signature check) using plain fetch.
 * Keys come from RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET — use the rzp_test_ keys
 * from the Razorpay Dashboard (Test Mode) for the demo. The secret never leaves the server.
 */
@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);

  constructor(private readonly config: ConfigService) {}

  private get keyId(): string {
    return (this.config.get<string>('RAZORPAY_KEY_ID') || '').trim();
  }

  private get keySecret(): string {
    return (this.config.get<string>('RAZORPAY_KEY_SECRET') || '').trim();
  }

  isConfigured(): boolean {
    return this.keyId.startsWith('rzp_') && this.keySecret.length > 0;
  }

  /** Safe to send to the app (the checkout needs it) */
  get publicKeyId(): string {
    return this.keyId;
  }

  get isTestMode(): boolean {
    return this.keyId.startsWith('rzp_test_');
  }

  async createOrder(
    amountInRupees: number,
    receipt: string,
    notes: Record<string, string> = {},
  ): Promise<RazorpayOrder> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    let res: Awaited<ReturnType<typeof fetch>>;
    try {
      res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amountInRupees * 100),
          currency: 'INR',
          receipt: receipt.slice(0, 40),
          notes,
        }),
      });
    } catch (err: any) {
      this.logger.error(`Razorpay unreachable: ${err.message}`);
      throw new ServiceUnavailableException(
        'Online payment could not be started. Please try again or choose Cash on Delivery.',
      );
    }

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Razorpay order creation failed (${res.status}): ${body}`);
      throw new ServiceUnavailableException(
        'Online payment could not be started. Please try again or choose Cash on Delivery.',
      );
    }

    const data = (await res.json()) as RazorpayOrder;
    return { id: data.id, amount: data.amount, currency: data.currency };
  }

  /** Checks razorpay_signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
  verifySignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): boolean {
    const expected = createHmac('sha256', this.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature || '');
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
