import { DatePipe, NgClass, CurrencyPipe, CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../auth/auth';
import { InventoryItem, InventoryValueBreakdown } from '../inventory.model';
import { InventoryFilters, InventoryService } from '../inventory.service';

interface PaginationState {
  page: number;
  total: number;
  limit: number;
}

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, DatePipe, CurrencyPipe, NgClass],
  templateUrl: './inventory-list.html',
  styleUrl: './inventory-list.css'
})
export class InventoryList implements OnInit {
  private readonly auth = inject(Auth);
  private readonly inventoryService = inject(InventoryService);
  private readonly fb = inject(FormBuilder);

  readonly currentUser = computed(() => this.auth.currentUser);

  readonly filtersForm = this.fb.group({
    q: [''],
    category: [''],
    location: [''],
    unit: [''],
    sort: ['-expirationDate'],
    expiringBy: [''],
    lowStockBelow: [null as number | null],
    groupBy: ['none']
  });

  readonly loading = signal(false);
  readonly error = signal('');
  readonly deleteError = signal('');
  readonly items = signal<InventoryItem[]>([]);
  readonly pagination = signal<PaginationState>({ page: 1, total: 0, limit: 10 });
  readonly valueTotal = signal(0);
  readonly valueBreakdown = signal<InventoryValueBreakdown[]>([]);
  readonly valueGroup = signal<'category' | 'location' | null>(null);
  readonly deleteTarget = signal<InventoryItem | null>(null);

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
  readonly unitOptions = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.error.set('Log in with an authorised account to view inventory.');
      return;
    }
    this.loadInventory(1);
  }

  applyFilters(): void {
    this.loadInventory(1);
  }

  resetFilters(): void {
    this.filtersForm.reset({
      q: '',
      category: '',
      location: '',
      unit: '',
      sort: '-expirationDate',
      expiringBy: '',
      lowStockBelow: null,
      groupBy: 'none'
    });
    this.loadInventory(1);
  }

  goToPage(page: number): void {
    if (page < 1) {
      return;
    }
    const totalPages = this.totalPages();
    if (page > totalPages) {
      return;
    }
    this.loadInventory(page);
  }

  openDeleteModal(item: InventoryItem): void {
    this.deleteTarget.set(item);
    this.deleteError.set('');
  }

  closeDeleteModal(): void {
    this.deleteTarget.set(null);
    this.deleteError.set('');
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) {
      return;
    }
    this.deleteError.set('');
    this.inventoryService.delete(target.inventoryId).subscribe({
      next: () => {
        this.items.update((list) => list.filter((item) => item.inventoryId !== target.inventoryId));
        this.pagination.update((state) => ({
          ...state,
          total: Math.max(0, state.total - 1)
        }));
        this.closeDeleteModal();
        this.loadValueSummary();
      },
      error: (err) => {
        this.deleteError.set(err.message || 'Failed to delete inventory item.');
      }
    });
  }

  trackByInventoryId(_: number, item: InventoryItem): string {
    return item.inventoryId;
  }

  get lowStockItems(): InventoryItem[] {
    const limit = this.lowStockLimit();
    return this.items().filter((item) => (item.quantity || 0) <= limit);
  }

  lowStockLimit(): number {
    const threshold = this.filtersForm.value.lowStockBelow;
    if (typeof threshold === 'number' && !isNaN(threshold)) {
      return threshold;
    }
    return 3;
  }

  private loadInventory(page: number): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.error.set('Log in with an authorised account to view inventory.');
      this.items.set([]);
      return;
    }

    const filters = this.buildFilters(page);

    this.loading.set(true);
    this.error.set('');

    this.inventoryService.list(filters).subscribe({
      next: (response) => {
        this.items.set(response.items || []);
        this.pagination.set({ page: response.page, total: response.total, limit: response.limit });
        this.loading.set(false);
        this.loadValueSummary();
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load inventory.');
        this.items.set([]);
        this.loading.set(false);
      }
    });
  }

  private loadValueSummary(): void {
    const groupSetting = this.filtersForm.value.groupBy;
    const groupBy = groupSetting === 'category' || groupSetting === 'location' ? groupSetting : undefined;

    this.inventoryService.value(groupBy).subscribe({
      next: (value) => {
        this.valueTotal.set(value.totalValue || 0);
        this.valueGroup.set(value.groupBy || null);
        this.valueBreakdown.set(value.breakdown || []);
      },
      error: () => {
        this.valueTotal.set(0);
        this.valueGroup.set(null);
        this.valueBreakdown.set([]);
      }
    });
  }

  private buildFilters(page: number): InventoryFilters {
    const raw = this.filtersForm.value;
    const filters: InventoryFilters = {
      page,
      limit: this.pagination().limit,
      sort: raw.sort || undefined
    };

    if (raw.q) {
      filters.q = raw.q.trim();
    }
    if (raw.category) {
      filters.category = raw.category;
    }
    if (raw.location) {
      filters.location = raw.location;
    }
    if (raw.unit) {
      filters.unit = raw.unit;
    }
    if (raw.expiringBy) {
      filters.expiringBy = raw.expiringBy;
    }
    if (typeof raw.lowStockBelow === 'number' && !Number.isNaN(raw.lowStockBelow)) {
      filters.lowStockBelow = raw.lowStockBelow;
    }

    return filters;
  }

  totalPages(): number {
    const { total, limit } = this.pagination();
    if (!limit) {
      return 1;
    }
    return Math.max(1, Math.ceil(total / limit));
  }
}
