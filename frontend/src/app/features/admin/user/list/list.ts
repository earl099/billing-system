/**
 * @fileoverview Admin user list component
 * Displays a paginated, searchable table of user accounts
 * with view, edit, and delete actions. Logs delete operations for audit trail.
 */

import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Log } from '@services/log';
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
  templateUrl: './list.html',
  styleUrl: './list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List implements OnInit, OnDestroy {
  userService = inject(User)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)

  users = signal<any[]>([])
  loading = signal(true)
  pendingDeletion = signal<any | null>(null)
  deleting = signal(false)
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)

  /** Debounce timer for search input */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  columns = ['name', 'role', 'actions']

  constructor() {
    effect(() => {
      const value = this.searchInput()

      if (this.debounceTimer) clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.searchQuery.set(value)
        this.currentPage.set(1)
      }, 300)
    })
  }

  /** Computed filtered user list based on search query (name or role) */
  filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.users();

    return this.users().filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    )
  })

  /** Computed paginated subset of filtered users */
  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredUsers().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    await this.load()
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }

  /** Fetches all users from the API */
  async load() {
    this.loading.set(true)
    try {
      const userList = await this.userService.list()
      this.users.set(userList)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load users'
      toast.error(errorMessage)
    } finally {
      this.loading.set(false)
    }
  }

  /** Navigates to the user detail view */
  view(u: any) {
    if (!u?._id) {
      toast.error('Invalid user record')
      return
    }
    this.router.navigate(['/admin/user', u._id])
  }

  /** Navigates to the user edit form */
  edit(u: any) {
    if (!u?._id) {
      toast.error('Invalid user record')
      return
    }
    this.router.navigate(['/admin/user', u._id, 'edit'])
  }

  /** Opens the in-app confirmation dialog for a user deletion. */
  requestDelete(u: any): void {
    if (!u?._id) {
      toast.error('Invalid user record')
      return
    }

    this.pendingDeletion.set(u)
  }

  /** Dismisses the deletion confirmation without changing the account. */
  cancelDelete(): void {
    if (!this.deleting()) this.pendingDeletion.set(null)
  }

  /** Deletes the selected user after confirmation and records the action. */
  async confirmDelete(): Promise<void> {
    const user = this.pendingDeletion()
    if (!user?._id || this.deleting()) return

    this.deleting.set(true)
    try {
      await this.userService.delete(user._id)
      toast.success('User deleted successfully')

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Deleted User'
      }

      await this.logService.create(log)
      this.pendingDeletion.set(null)
      await this.load()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete user'
      toast.error(errorMessage)
    } finally {
      this.deleting.set(false)
    }
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
