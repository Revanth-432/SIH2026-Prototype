import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Values Razorpay Checkout returns to the app after a successful payment */
export class VerifyPaymentDto {
  @ApiProperty({ example: 'order_Nx8Y0lqHk3aB1c' })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId!: string;

  @ApiProperty({ example: 'pay_Nx8Z4Hc1lWj0uQ' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId!: string;

  @ApiProperty({ description: 'HMAC signature from Razorpay Checkout' })
  @IsString()
  @IsNotEmpty()
  razorpaySignature!: string;
}
