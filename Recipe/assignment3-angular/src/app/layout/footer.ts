import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
  @Input() appTitle = '';
  readonly currentYear = new Date().getFullYear();
}
