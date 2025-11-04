import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// T6 This lightweight component shows a friendly message when a page is missing.
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css'
})
export class NotFound {}
