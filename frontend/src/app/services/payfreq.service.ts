import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { PayFreq } from '@models/payFreq';
import { catchError, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PayfreqService {
  private baseUrl = environment.apiUrl

  private http = inject(HttpClient)

  addPayFreq(payFreqData: PayFreq): Observable<any> {
    return this.http.post(`${this.baseUrl}/payfreq`, payFreqData)
  }

  getPayFreqs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/payfreq`)
  }

  getPayFreq(_id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/payfreq/${_id}`)
  }

  deletePayFreq(_id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/payfreq/${_id}`)
  }
}
