import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { User } from '@services/user';

@Component({
  selector: 'app-user-view',
  imports: [...MATERIAL_MODULES],
  templateUrl: './user-view.html',
  styleUrl: './user-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserView implements OnInit {
  route = inject(ActivatedRoute)
  router = inject(Router)
  userService = inject(User)
  user = signal<any>({})

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!
    this.user.set(await this.userService.get(id))
  }

  edit() {
    this.router.navigate([`admin/user/${this.user()._id}/edit`])
  }
}
