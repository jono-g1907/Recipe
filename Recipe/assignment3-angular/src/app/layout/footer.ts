// T5 Importing Component and Input lets this footer receive data from the main application shell.
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
  // T5 The title arrives from the parent so the footer always matches the displayed app name.
  @Input() appTitle = '';
  // T5 Capturing the year once keeps the copyright notice current without extra work.
  readonly currentYear = new Date().getFullYear();
}
