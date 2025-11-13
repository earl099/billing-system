import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table'; // Import MatTableModule
import { MatCardModule } from '@angular/material/card'; // Import MatCardModule
import { MatToolbarModule } from '@angular/material/toolbar'; // Import MatToolbarModule
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule
import { GoogleSheetsService } from '@services/google-sheets.service';
import { ConfigService } from '@services/config.service';
import { Subscription } from 'rxjs';
import { BillingRate } from '@models/billing-rate'; // Import BillingRate model

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule, // Add MatTableModule
    MatCardModule, // Add MatCardModule
    MatToolbarModule, // Add MatToolbarModule
    MatIconModule // Add MatIconModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings implements OnInit, OnDestroy {
  isSignedIn: boolean = false;
  private authSubscription: Subscription | undefined;

  spreadsheetIds: { [key: string]: string } = {
    transmittal: '',
    accountReceivable: '',
    details: ''
  };

  // Billing Rates properties
  billingRates: BillingRate[] = [];
  newBillingRate: BillingRate = {
    id: '',
    position: '',
    department: '',
    ratePerHour: 0,
    effectiveDate: ''
  };
  displayedColumns: string[] = ['id', 'position', 'department', 'ratePerHour', 'effectiveDate', 'actions'];


  constructor(
    private googleSheetsService: GoogleSheetsService,
    private configService: ConfigService
  ) { }

  ngOnInit(): void {
    this.authSubscription = this.googleSheetsService.signedIn$.subscribe(
      (status) => {
        this.isSignedIn = status;
      }
    );
    this.loadSettings();
    this.loadBillingRates(); // Load billing rates on init
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  signIn(): void {
    this.googleSheetsService.signIn();
  }

  signOut(): void {
    this.googleSheetsService.signOut();
  }

  loadSettings(): void {
    const savedIds = this.configService.getSpreadsheetIds();
    if (savedIds) {
      this.spreadsheetIds = { ...this.spreadsheetIds, ...savedIds };
    }
  }

  saveSettings(): void {
    this.configService.saveSpreadsheetIds(this.spreadsheetIds);
    alert('Google Sheet IDs saved successfully!');
  }

  // Billing Rates methods
  loadBillingRates(): void {
    const savedRates = this.configService.getBillingRates();
    if (savedRates) {
      this.billingRates = savedRates;
    }
  }

  addBillingRate(): void {
    // Simple validation and ID generation
    if (!this.newBillingRate.position || !this.newBillingRate.department || this.newBillingRate.ratePerHour <= 0 || !this.newBillingRate.effectiveDate) {
      alert('Please fill in all billing rate fields correctly.');
      return;
    }
    this.newBillingRate.id = 'BR-' + (this.billingRates.length + 1); // Simple ID generation
    this.billingRates.push({ ...this.newBillingRate });
    this.configService.saveBillingRates(this.billingRates);
    alert('Billing rate added and saved successfully!');
    this.resetNewBillingRateForm();
  }

  deleteBillingRate(id: string): void {
    this.billingRates = this.billingRates.filter(rate => rate.id !== id);
    this.configService.saveBillingRates(this.billingRates);
    alert('Billing rate deleted and saved successfully!');
  }

  resetNewBillingRateForm(): void {
    this.newBillingRate = {
      id: '',
      position: '',
      department: '',
      ratePerHour: 0,
      effectiveDate: ''
    };
  }
}
