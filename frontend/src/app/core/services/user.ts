import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment.prod';
import { UserDTO } from '@models/user';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class User {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  async list() {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/user`))
    return res.users
  }

  async get(id: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/user/${id}`))
    return res.user
  }

  async create(payload: UserDTO) {
    const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/user`, payload))
    return res.user
  }

  async update(id: string, payload: Partial<UserDTO>) {
    const res: any = await firstValueFrom(this.http.put(`${this.apiUrl}/user/${id}`, payload))
    return res.user
  }

  async delete(id: string) {
    const res: any = await firstValueFrom(this.http.delete(`${this.apiUrl}/user/${id}`))
    return res
  }
}
