import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
    A11yModule,
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
    soaNo: ['', Validators.required],
    billingDate: ['', Validators.required],
    addressedTo: ['', Validators.required],
    addressee: ['', Validators.required],
    clientName: ['', Validators.required],
    particulars: ['', Validators.required],
    client: ['', Validators.required],
    clientAddress: ['', Validators.required],
    appraisalAmt: ['', Validators.required],
    totalAmt: ['', Validators.required],
    bcuChiefName: ['', Validators.required],
    acidOicName: ['', Validators.required],
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
      this.step.set(1)
      this.form.markAsUntouched()
      return
    }
    else {
      this.isBlankSelected.set(false)
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
    const dateObj = new Date(this.form.get('billingDate')?.value!)
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }

    this.form.get('billingDate')?.setValue(dateObj.toLocaleDateString('en-GB', options))

    let appAmt = String(this.form.get('appraisalAmt')?.value)
    let appArr = appAmt.split('.')

    if(appAmt?.includes('.00') || !appAmt?.includes('.')) {
      this.form.get('appraisalAmt')?.setValue(appAmt + '.00')
    }
    else if(appArr.length === 2 && appArr[1].length === 1) {
      this.form.get('appraisalAmt')?.setValue(appAmt + '0')
    }

    let totalAppAmt = String(this.form.get('totalAmt')?.value)
    let totalAppArr = totalAppAmt.split('.')

    if(totalAppAmt?.includes('.00') || !totalAppAmt?.includes('.')) {
      this.form.get('totalAmt')?.setValue(totalAppAmt + '.00')
    }
    else if(totalAppAmt.length === 2 && totalAppAmt[1].length === 1) {
      this.form.get('totalAmt')?.setValue(totalAppAmt + '0')
    }

    const bLetter = await this.wordService.createDocument(this.selectedTemplate().id, this.form.value, false)

    window.open(bLetter.editUrl, '_blank')

    this.router.navigate([
      'billing',
      this.route.snapshot.paramMap.get('code')!.toLowerCase(),
      'generate'
    ])
  }

  decimalFilter(event: any) {
    const reg = /^-?\d*(\.\d{0,2})?$/;
    let input = event.target.value + String.fromCharCode(event.charCode);

    if (!reg.test(input)) {
        event.preventDefault();
    }
  }
}
