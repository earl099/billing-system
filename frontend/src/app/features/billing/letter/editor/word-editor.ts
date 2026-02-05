import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Word } from '@services/word';

@Component({
  selector: 'app-editor',
  imports: [...MATERIAL_MODULES],
  templateUrl: './word-editor.html',
  styleUrl: './word-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordEditor implements OnInit {
  templates = signal<any[]>([])
  selectedTemplate = signal<string | null>(null)
  _url = signal<string | null>(null)
  wordService = inject(Word)
  sanitizer = inject(DomSanitizer)
  router = inject(Router)
  route = inject(ActivatedRoute)

  safeUrl = computed<SafeResourceUrl | null>(() =>
    this._url()
      ? this.sanitizer.bypassSecurityTrustResourceUrl(this._url()!)
      : null
  )

  async ngOnInit() {
    this.loadTemplates()
  }

  async loadTemplates() {
    const templateList = await this.wordService.getTemplates()
    this.templates.set(templateList)
  }

  async createBillingLetter() {
    const bLetter = await this.wordService.createDocument(this.selectedTemplate()!)
    window.open(bLetter.editUrl, '_blank')
    this.router.navigate([ 'billing', this.route.snapshot.paramMap.get('code')!.toLowerCase(), 'generate'])
  }
}
