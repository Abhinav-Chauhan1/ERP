declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeInstance {
    checkout(options: { paymentSessionId: string }): void;
  }

  export interface LoadOptions {
    mode: 'sandbox' | 'production';
  }

  export function load(options: LoadOptions): Promise<CashfreeInstance>;
}
