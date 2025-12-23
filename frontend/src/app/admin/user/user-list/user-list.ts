import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { User } from '@services/user';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-user-list',
  imports: [
    ...MATERIAL_MODULES,
    MatTableModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList implements OnInit {
  userService = inject(User)
  router = inject(Router)

  users = signal<any[]>([])
  columns = ['name', 'role', 'actions']

  async ngOnInit() {
    await this.load()
  }

  async load() {
    const userList = await this.userService.list()
    this.users.set(userList)
  }

  view(u: any) {
    this.router.navigate(['/admin/user', u._id])
  }

  edit(u: any) {
    this.router.navigate(['/admin/user', u._id, 'edit'])
  }

  async deleteUser(u: any) {
    if(!confirm(`Delete ${u.name}'s account? This action is permanent.`)) return
    await this.userService.delete(u._id)
    toast.success('User deleted successfully')
    await this.load()

    //log creation function here
    
  }
}
