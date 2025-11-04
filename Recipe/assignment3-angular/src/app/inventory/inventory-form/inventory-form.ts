import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { InventoryItem } from '../inventory.model';
import { InventoryPayload } from '../inventory.service';

// T4 Shared form component handles validation for both create and edit screens.

export type InventoryFormValue = Omit<InventoryPayload, 'userId'>;

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventory-form.html',
  styleUrl: './inventory-form.css'
})
export class InventoryForm implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() initialValue: InventoryItem | null = null;
  @Input() submitLabel = 'Save Item';
  @Input() loading = false;
  @Input() errorMessage = '';
  @Output() submitted = new EventEmitter<InventoryFormValue>();

  // T4 These option arrays populate the dropdowns with consistent measurement choices.
  readonly unitOptions = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];
  readonly categoryOptions = [
    'Vegetables',
    'Fruits',
    'Meat',
    'Dairy',
    'Grains',
    'Spices',
    'Beverages',
    'Frozen',
    'Canned',
    'Other'
  ];
  readonly locationOptions = ['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'];

  // T4 FormBuilder defines validation rules to keep inventory data clean before submission.
  readonly form: FormGroup = this.fb.group({
    inventoryId: this.fb.control('', {
      validators: [Validators.required, Validators.pattern(/^I-\d{5}$/)]
    }),
    ingredientName: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)]
    }),
    quantity: this.fb.control(1, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(9999)]
    }),
    unit: this.fb.control('', { validators: [Validators.required] }),
    category: this.fb.control('', { validators: [Validators.required] }),
    purchaseDate: this.fb.control(this.today(), { validators: [Validators.required] }),
    expirationDate: this.fb.control(this.today(), { validators: [Validators.required] }),
    location: this.fb.control('', { validators: [Validators.required] }),
    cost: this.fb.control(1, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(999.99)]
    }),
    createdDate: this.fb.control(this.today(), { validators: [Validators.required] })
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      // T4 Whenever we receive new item data, populate the form for editing.
      this.populateForm(this.initialValue);
    }
  }

  submit(): void {
    // T4 Before sending values we confirm the expiration date falls after purchase.
    this.validateDateRange();

    if (this.form.invalid) {
      // T4 Marking all fields touched exposes validation hints for the user.
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const value: InventoryFormValue = {
      inventoryId: String(raw.inventoryId || '').trim().toUpperCase(),
      ingredientName: String(raw.ingredientName || '').trim(),
      quantity: Number(raw.quantity || 0),
      unit: String(raw.unit || '').trim(),
      category: String(raw.category || '').trim(),
      purchaseDate: this.toDateOnlyIso(raw.purchaseDate),
      expirationDate: this.toDateOnlyIso(raw.expirationDate),
      location: String(raw.location || '').trim(),
      cost: Number(raw.cost || 0),
      createdDate: this.toDateOnlyIso(raw.createdDate)
    };

    this.submitted.emit(value);
  }

  trackByValue(_: number, option: string): string {
    return option;
  }

  resetToInitial(): void {
    // T4 Reset button restores the form to the original record or blank template.
    this.populateForm(this.initialValue);
  }

  private populateForm(item: InventoryItem | null): void {
    if (!item) {
      this.form.reset({
        inventoryId: '',
        ingredientName: '',
        quantity: 1,
        unit: '',
        category: '',
        purchaseDate: this.today(),
        expirationDate: this.today(),
        location: '',
        cost: 1,
        createdDate: this.today()
      });
      return;
    }

    this.form.patchValue({
      // T4 Patching copies server values into controls so edits start with accurate data.
      inventoryId: item.inventoryId,
      ingredientName: item.ingredientName,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      purchaseDate: this.toInputDate(item.purchaseDate),
      expirationDate: this.toInputDate(item.expirationDate),
      location: item.location,
      cost: item.cost,
      createdDate: this.toInputDate(item.createdDate)
    });
  }

  private today(): string {
    const now = new Date();
    return this.formatDateInput(now);
  }

  private toInputDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const parsed = this.parseDateValue(value);
    if (!parsed) {
      return '';
    }
    return this.formatDateInput(parsed);
  }

  private toDateOnlyIso(value: unknown): string {
    const parsed = this.parseDateValue(value);
    if (!parsed) {
      return this.todayIsoDate();
    }
    return this.formatDateInput(parsed);
  }

  private parseDateValue(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : new Date(value.getTime());
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      // when the browser sends YYYY-MM-DD we need to interpret it in the local timezone
      const simpleDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (simpleDateMatch) {
        const year = Number(simpleDateMatch[1]);
        const month = Number(simpleDateMatch[2]);
        const day = Number(simpleDateMatch[3]);
        const localDate = new Date(year, month - 1, day);
        return isNaN(localDate.getTime()) ? null : localDate;
      }

      const parsed = new Date(trimmed);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private formatDateInput(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private todayIsoDate(): string {
    return this.formatDateInput(new Date());
  }

  private validateDateRange(): void {
    const purchase = this.parseDateValue(this.form.get('purchaseDate')?.value);
    const expiration = this.parseDateValue(this.form.get('expirationDate')?.value);

    this.setControlError('expirationDate', 'afterPurchase', false);

    if (!purchase || !expiration) {
      return;
    }

    if (expiration.getTime() <= purchase.getTime()) {
      // T4 Custom error flag surfaces a helpful message when dates are invalid.
      this.setControlError('expirationDate', 'afterPurchase', true);
      this.form.get('expirationDate')?.markAsTouched();
    }
  }

  private setControlError(controlName: string, errorKey: string, enabled: boolean): void {
    const control = this.form.get(controlName);
    if (!control) {
      return;
    }

    const currentErrors = control.errors || {};
    if (enabled) {
      if (!currentErrors[errorKey]) {
        control.setErrors({ ...currentErrors, [errorKey]: true });
      }
      return;
    }

    if (currentErrors[errorKey]) {
      const { [errorKey]: _removed, ...remaining } = currentErrors;
      control.setErrors(Object.keys(remaining).length ? remaining : null);
    }
  }
}
