import { ValidatorFn, AbstractControl, ValidationErrors } from "@angular/forms"

export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')
    const confirmPass = control.get('confirmPass')

    if(password && confirmPass && password.value !== confirmPass.value) {
      return { passwordsDoNotMatch: true }
    }

    return null
  }
}
