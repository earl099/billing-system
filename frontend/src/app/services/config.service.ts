import { Injectable } from '@angular/core';
import { BillingRate } from '@models/billing-rate';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly SPREADSHEET_IDS_KEY = 'spreadsheet_ids';
  private readonly BILLING_RATES_KEY = 'billing_rates';

  constructor() { }

  public saveSpreadsheetIds(ids: { [key: string]: string }): void {
    localStorage.setItem(this.SPREADSHEET_IDS_KEY, JSON.stringify(ids));
  }

  public getSpreadsheetIds(): { [key: string]: string } | null {
    const ids = localStorage.getItem(this.SPREADSHEET_IDS_KEY);
    return ids ? JSON.parse(ids) : null;
  }

  public getSpreadsheetId(key: string): string | null {
    const ids = this.getSpreadsheetIds();
    return ids ? ids[key] : null;
  }

  public saveBillingRates(rates: BillingRate[]): void {
    localStorage.setItem(this.BILLING_RATES_KEY, JSON.stringify(rates));
  }

  public getBillingRates(): BillingRate[] | null {
    const rates = localStorage.getItem(this.BILLING_RATES_KEY);
    return rates ? JSON.parse(rates) : null;
  }
}
