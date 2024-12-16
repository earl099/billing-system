import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  // private baseUrl = 'http://localhost:3000/api'
  private baseUrl = 'https://billingsez.onrender.com/api';
  http = inject(HttpClient);
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  err = 'An error occured.';

  constructor() {}

  addEmp(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/add-employee`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  getEmps(offset?: number | null, limit?: number | null): Observable<any> {
    if (offset == null && limit == null) {
      return this.http
        .get(`${this.baseUrl}/get-employees`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    } else {
      return this.http
        .get(
          `${this.baseUrl}/get-employees/${offset}/${limit}`,
          this.httpOptions
        )
        .pipe(catchError(this.handleError<any>(this.err)));
    }
  }

  getEmp(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/get-employee/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  editEmp(id: number, data: any): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/edit-employee/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  delEmp(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/delete-employee/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T);
    };
  }
}
