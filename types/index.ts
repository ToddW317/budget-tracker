export interface TwilioVerificationRequest {
  phoneNumber: string;
  code?: string;
  action: 'send' | 'verify';
}

// Add any other shared types here
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
} 