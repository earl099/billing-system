import { effect, Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'dark-mode';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly darkMode = signal(this.load());

  constructor() {
    effect(() => {
      const enabled = this.darkMode();
      this.apply(enabled);
      this.save(enabled);
    });
  }

  toggle(): void {
    this.darkMode.update((value) => !value);
  }

  private apply(enabled: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.classList.toggle('dark', enabled);
  }

  private load(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  private save(enabled: boolean): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }
}
