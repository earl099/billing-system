import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatTooltipModule,
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
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)

  private debounceTimer: any
  columns = ['name', 'role', 'actions']

  constructor() {
    effect(() => {
      const value = this.searchInput()

      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.searchQuery.set(value)
        this.currentPage.set(1)
      }, 300)
    })
  }

  filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.users();

    return this.users().filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })


  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredUsers().slice(start, start + this.pageSize())
  })

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

  totalPages() {
    return Math.ceil(this.filteredUsers().length / this.pageSize())
  }

  gotoPage(page: number) {
    this.currentPage.set(
      Math.min(Math.max(page, 1), this.totalPages())
    )
  }
}
