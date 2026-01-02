import { Component, signal } from '@angular/core';
import {VinListComponent} from './components/vin-list/vin-list';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {VinFormComponent} from './components/form-creation-vin/form-creation-vin';

@Component({
  selector: 'app-root',
  imports: [VinListComponent, CommonModule, VinListComponent, ReactiveFormsModule, VinFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Gestion de cave à vin');
}
