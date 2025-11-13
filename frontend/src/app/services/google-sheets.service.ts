import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '@environments/environment';

// Declare the 'gapi' variable to access the Google API client library
declare var gapi: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {
  private API_KEY = environment.googleApiKey;
  private CLIENT_ID = environment.googleClientId;

  private DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
  private SCOPES = "https://www.googleapis.com/auth/spreadsheets";

  private auth2: any;

  signedIn = new BehaviorSubject<boolean>(false);
  signedIn$ = this.signedIn.asObservable();

  constructor() {
    this.handleClientLoad();
  }

  private handleClientLoad() {
    gapi.load('client:auth2', () => this.initClient());
  }

  private initClient() {
    gapi.client.init({
      apiKey: this.API_KEY,
      clientId: this.CLIENT_ID,
      discoveryDocs: this.DISCOVERY_DOCS,
      scope: this.SCOPES
    }).then(() => {
      this.auth2 = gapi.auth2.getAuthInstance();

      // Listen for sign-in state changes
      this.auth2.isSignedIn.listen((isSignedIn: boolean) => this.updateSigninStatus(isSignedIn));

      // Handle the initial sign-in state
      this.updateSigninStatus(this.auth2.isSignedIn.get());
    }).catch((error: any) => {
      console.error('Error initializing Google API client', error);
    });
  }

  private updateSigninStatus(isSignedIn: boolean) {
    this.signedIn.next(isSignedIn);
  }

  signIn() {
    if (!this.auth2) {
      console.error('Google Auth instance not initialized');
      return;
    }
    this.auth2.signIn();
  }

  signOut() {
    if (!this.auth2) {
      console.error('Google Auth instance not initialized');
      return;
    }
    this.auth2.signOut();
  }

  // Placeholder for method to get sheet data
  public async getSheetData(spreadsheetId: string, range: string): Promise<any> {
    if (!this.signedIn.value) {
      throw new Error('Not signed in');
    }
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });
    return response.result.values;
  }

  // Placeholder for method to update sheet data
  public async updateSheetData(spreadsheetId: string, range: string, values: any[][]): Promise<any> {
    if (!this.signedIn.value) {
      throw new Error('Not signed in');
    }
    const resource = {
      values: values
    };
    const response = await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
      resource: resource,
    });
    return response.result;
  }
}
