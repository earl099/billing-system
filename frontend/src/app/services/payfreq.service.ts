import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { PayFreq } from '@models/payFreq';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PayfreqService {
  private baseUrl = environment

  private httpOptions = {
    headers: new HttpHeaders({ 'Content/Type': 'application/json' })
  }

  private http = inject(HttpClient)

  addPayFreq(payFreqData: PayFreq): Observable<any> {
    return this.http.post(`${this.baseUrl}/payfreq`, this.httpOptions)
  }

  getPayFreqs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/payfreq`, this.httpOptions)
  }

  getPayFreq(_id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/payfreq/${_id}`, this.httpOptions)
  }

  updatePayFreq(_id: string, payFreqData: PayFreq): Observable<any> {
    return this.http.put(`${this.baseUrl}/payfreq/${_id}`, payFreqData, this.httpOptions)
  }

  deletePayFreq(_id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/payfreq/${_id}`, this.httpOptions)
  }
}
