import { Component, signal } from '@angular/core';
import {VinListComponent} from './components/vin-list/vin-list';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {VinFormComponent} from './components/form-creation-vin/form-creation-vin';
import {LoginComponent} from './components/login/login';
import {AuthService} from './services/auth-service';
import {ToastService} from './services/toast';

@Component({
  selector: 'app-root',
  imports: [VinListComponent, CommonModule, ReactiveFormsModule, VinFormComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Gestion de cave à vin');

  constructor(protected authService: AuthService,
              protected toastService: ToastService) {}
}
