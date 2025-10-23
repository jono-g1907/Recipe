import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '../../auth/auth';
import { InventoryItem } from '../inventory.model';
import { InventoryForm, InventoryFormValue } from '../inventory-form/inventory-form';
import { InventoryPayload, InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-edit',
  standalone: true,
  imports: [InventoryForm],
  templateUrl: './inventory-edit.html',
  styleUrl: './inventory-edit.css'
})
export class InventoryEdit implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inventoryService = inject(InventoryService);
  private readonly auth = inject(Auth);

  private subscription?: Subscription;

  readonly loading = this.inventoryService.loading;
  readonly currentUser = computed(() => this.auth.currentUser);
  readonly item = signal<InventoryItem | null>(null);
  readonly error = signal('');
  readonly success = signal('');

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const inventoryId = params.get('inventoryId');
      if (!inventoryId) {
        this.error.set('Inventory item not found.');
        return;
      }
      this.fetchInventory(inventoryId);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  handleSubmit(value: InventoryFormValue): void {
    const current = this.item();
    const user = this.auth.currentUser;
    if (!current || !user) {
      this.error.set('Please log in to update inventory records.');
      return;
    }

    const payload: Partial<InventoryPayload> = {
      ...value,
      userId: user.userId
    };

    this.error.set('');
    this.success.set('');

    this.inventoryService.update(current.inventoryId, payload).subscribe({
      next: (item) => {
        this.item.set(item);
        this.success.set('Inventory item updated successfully.');
      },
      error: (err) => {
        this.error.set(err.message || 'Unable to update inventory item.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/inventory-dashboard-31477046']);
  }

  private fetchInventory(inventoryId: string): void {
    this.error.set('');
    this.inventoryService.get(inventoryId).subscribe({
      next: (item) => {
        this.item.set(item);
      },
      error: (err) => {
        this.error.set(err.message || 'Unable to load inventory item.');
      }
    });
  }
}
