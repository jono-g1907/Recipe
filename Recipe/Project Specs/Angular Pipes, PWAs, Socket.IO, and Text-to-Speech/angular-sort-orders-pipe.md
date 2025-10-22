# Angular Pipes — Sort Orders by Date

![Pipe files in VS Code](sandbox:/mnt/data/12371687-bf14-48e9-877f-a291fa5150ff.png)

Angular **pipes** are functions used to transform data in templates. They accept input values, process them, and return a single output value.

This guide builds a `sortOrders` pipe that takes an array of `Order` objects and returns the array sorted by `orderDate`.

---

## Step 1 — Generate the Pipe

```bash
ng generate pipe sortOrders
# or
ng g p sortOrders
```

This creates two files (names may vary by CLI/version and your folder structure):

- `sort-orders-pipe.ts`
- `sort-orders-pipe.spec.ts`

---

## Step 2 — Implement the Pipe (`sort-orders-pipe.ts`)

```ts
import { Pipe, PipeTransform } from '@angular/core';
import { Order } from './models/order';

@Pipe({
  name: 'sortOrders',
  standalone: true,
})
export class SortOrdersPipe implements PipeTransform {
  transform(
    orders: Order[] | null | undefined,          // input array of orders (can be null/undefined while loading)
    direction: 'asc' | 'desc' = 'desc'           // optional parameter: sort ascending or descending (default = 'desc')
  ): Order[] {
    
    // If there are no orders OR only 1 order, just return the array as-is (nothing to sort)
    if (!orders || orders.length < 2) return orders ?? [];

    // Decide sorting direction: +1 for ascending, -1 for descending
    const dir = direction === 'asc' ? 1 : -1;

    // Make a copy of the orders array (to avoid mutating the original)
    // and sort it using a custom comparator
    return [...orders].sort((a, b) => {
      // Convert each orderDate into a numeric timestamp (milliseconds since 1970)
      const va = new Date(a.orderDate).getTime();
      const vb = new Date(b.orderDate).getTime();

      // Compare the two timestamps
      // If va < vb → negative result → 'a' comes before 'b'
      // If va > vb → positive result → 'b' comes before 'a'
      // Multiply by dir to flip the result for ascending/descending order
      return (va - vb) * dir;
    });
  }
}
```

---

## Step 3 — Import the Pipe in Your Component (`list-orders.ts`)

```ts
import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SortOrdersPipe } from './sort-orders-pipe'; // adjust path if needed

@Component({
  selector: 'app-list-orders',
  imports: [DatePipe, SortOrdersPipe],
  templateUrl: './list-orders.html',
  styleUrl: './list-orders.css'
})
export class ListOrdersComponent {}
```

> **Note:** `DatePipe` is the built-in Angular pipe used to format dates.

---

## Step 4 — Use the Pipe in the Template (`list-orders.html`)

```html
<h3>Customer Orders</h3>

@if(orders.length === 0){
  <h4>We have no order at the moment</h4>
}@else{
  <table>
    <tr>
      <th>Product</th>
      <th>Quantity</th>
      <th>Order Date</th>
    </tr>
    @for (order of orders | sortOrders; track order) {
      <tr>
        <td>{{ order.product }}</td>
        <td>{{ order.quantity }}</td>
        <td>{{ order.orderDate | date:'mediumDate' }}</td>
      </tr>
    }
  </table>
}
```

### Line 16 reminder
Use the built-in Angular **DatePipe** to format order dates (e.g., order placed date, delivery date) as shown above:
```html
{{ order.orderDate | date:'mediumDate' }}
```

---

## Optional — Ascending Sort
You can pass a second argument to the pipe to sort ascending:
```html
@for (order of orders | sortOrders:'asc'; track order) { ... }
```
