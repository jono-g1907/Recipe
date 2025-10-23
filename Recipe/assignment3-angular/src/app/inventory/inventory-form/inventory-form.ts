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
      this.populateForm(this.initialValue);
    }
  }

  submit(): void {
    if (this.form.invalid) {
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
      purchaseDate: this.toIsoDate(raw.purchaseDate),
      expirationDate: this.toIsoDate(raw.expirationDate),
      location: String(raw.location || '').trim(),
      cost: Number(raw.cost || 0),
      createdDate: this.toIsoDate(raw.createdDate)
    };

    this.submitted.emit(value);
  }

  trackByValue(_: number, option: string): string {
    return option;
  }

  resetToInitial(): void {
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
    return this.toInputDate(now.toISOString());
  }

  private toInputDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return '';
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private toIsoDate(value: unknown): string {
    if (!value) {
      return new Date().toISOString();
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return new Date().toISOString();
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return new Date().toISOString();
  }
}
