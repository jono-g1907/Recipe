import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../auth/auth';
import { InventoryForm, InventoryFormValue } from '../inventory-form/inventory-form';
import { InventoryPayload, InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-create',
  standalone: true,
  imports: [CommonModule, InventoryForm, RouterLink],
  templateUrl: './inventory-create.html',
  styleUrl: './inventory-create.css'
})
export class InventoryCreate {
  private readonly auth = inject(Auth);
  private readonly inventoryService = inject(InventoryService);
  private readonly router = inject(Router);

  readonly currentUser = computed(() => this.auth.currentUser);
  readonly loading = this.inventoryService.loading;

  readonly error = signal('');
  readonly success = signal('');

  handleSubmit(value: InventoryFormValue): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.error.set('Please log in to manage inventory items.');
      return;
    }

    const payload: InventoryPayload = {
      ...value,
      userId: user.userId
    };

    this.error.set('');
    this.success.set('');

    this.inventoryService.create(payload).subscribe({
      next: () => {
        this.success.set('Inventory item added successfully.');
        this.router.navigate(['/inventory-dashboard-31477046']);
      },
      error: (err) => {
        this.error.set(err.message || 'Unable to add inventory item.');
      }
    });
  }
}
