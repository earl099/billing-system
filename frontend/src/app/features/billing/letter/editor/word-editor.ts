import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Word } from '@services/word';
import { A11yModule } from "@angular/cdk/a11y";

export const MY_FORMATS = {
  parse: {
    dateInput: 'd MMMM yyyy'
  },
  display: {
    dateInput: 'd MMMM yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'DDD',
    monthYearA11yLabel: 'MMM yyyy'
  }
}

@Component({
  selector: 'app-editor',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    A11yModule
],
  templateUrl: './word-editor.html',
  styleUrl: './word-editor.css',
  providers: [provideLuxonDateAdapter(MY_FORMATS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordEditor implements OnInit {
  templates = signal<any[]>([])
  selectedTemplate = signal<any>(null)
  isBlankSelected = signal(false)
  _url = signal<string | null>(null)
  step = signal(1)

  wordService = inject(Word)
  sanitizer = inject(DomSanitizer)
  router = inject(Router)
  route = inject(ActivatedRoute)
  fb = inject(FormBuilder)

  form = this.fb.group({
    soaNo: [''],
    billingDate: [''],
    addressedTo: [''],
    addressee: [''],
    clientName: [''],
    particulars: [''],
    client: [''],
    clientAddress: [''],
    appraisalAmt: [''],
    totalAmt: [''],
    bcuChiefName: [''],
    acidOicName: [''],
  })

  safeUrl = computed<SafeResourceUrl | null>(() =>
    this._url()
      ? this.sanitizer.bypassSecurityTrustResourceUrl(this._url()!)
      : null
  )

  async ngOnInit() {
    this.loadTemplates()
  }

  async loadTemplates() {
    const code = this.route.snapshot.paramMap.get('code')!
    const templateList = await this.wordService.getTemplates(code)
    this.templates.set(templateList)
  }

  selectTemplate(t: any) {
    this.selectedTemplate.set(t)

    if(t.name.toLowerCase().includes('blank')) {
      this.isBlankSelected.set(true)
      return
    }

    this.step.set(2)
  }

  async createBlank() {
    const doc = await this.wordService.createDocument(this.selectedTemplate().id, {}, true)

    window.open(doc.editUrl, '_blank')

    this.router.navigate([
      'billing',
      this.route.snapshot.paramMap.get('code')!.toLowerCase(),
      'generate'
    ])
  }

  async createBillingLetter() {
    const bLetter = await this.wordService.createDocument(this.selectedTemplate().id, this.form.value, false)

    window.open(bLetter.editUrl, '_blank')

    this.router.navigate([
      'billing',
      this.route.snapshot.paramMap.get('code')!.toLowerCase(),
      'generate'
    ])
  }
}
