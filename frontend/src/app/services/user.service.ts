import { computed, inject, Injectable, signal } from '@angular/core';
import { User } from '@models/user';
import { Observable, catchError, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  private http = inject(HttpClient)
  private baseUrl = 'http://localhost:3000/api'
  //private baseUrl = 'https://billing-system-dolz.onrender.com/api';
  private err = 'An error occurred.';

  #userSignal = signal<User | null>(null)
  isAdmin = computed(() => this.#userSignal()?.role.includes('Admin'))

  user = this.#userSignal.asReadonly()

  setUser(user: User) {
    this.#userSignal.set(user)
  }

  clearUser() {
    this.#userSignal.set(null)
  }

  //** GET USERS FUNCTION **//
  getUsers(offset?: number | null, limit?: number | null): Observable<any> {
    if (
      (offset == undefined || offset == null) &&
      (limit == undefined || limit == null)
    ) {
      return this.http
        .get(`${this.baseUrl}/user/`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    } else {
      return this.http
        .get(`${this.baseUrl}/user/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    }
  }

  //** GET USER FUNCTION **//
  getUser(id: string | undefined): Observable<any> {
    return this.http
      .get<User>(`${this.baseUrl}/user/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //** UPDATE USER **//
  updateUser(id: string | undefined, user: User): Observable<any> {
    return this.http
      .put<User>(`${this.baseUrl}/user/${id}`, user, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //** DELETE USER **//
  deleteUser(id: string | undefined): Observable<any> {
    if(id == undefined) {
      return new Observable<false>
    }
    return this.http.delete(
      `${this.baseUrl}/user/${id}`,
      this.httpOptions
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T);
    };
  }
}
