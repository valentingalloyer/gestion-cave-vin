import { Component, signal } from '@angular/core';
import {VinListComponent} from './components/vin-list/vin-list';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {VinFormComponent} from './components/form-creation-vin/form-creation-vin';
import {LoginComponent} from './components/login/login';
import {MotDePasseComponent} from './components/mot-de-passe/mot-de-passe';
import {JournalComponent} from './components/journal/journal';
import {AuthService} from './services/auth-service';
import {ToastService} from './services/toast';
import {Theme, ThemeService} from './services/theme';

@Component({
  selector: 'app-root',
  imports: [VinListComponent, CommonModule, ReactiveFormsModule, VinFormComponent, LoginComponent, MotDePasseComponent, JournalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Gestion de cave à vin');
  protected readonly motDePasseOuvert = signal(false);
  protected readonly vue = signal<'cave' | 'journal'>('cave');

  protected readonly themes: { valeur: Theme, libelle: string }[] = [
    { valeur: 'clair', libelle: 'Thème clair' },
    { valeur: 'auto', libelle: "Thème automatique (suit l'appareil)" },
    { valeur: 'sombre', libelle: 'Thème sombre' }
  ];

  constructor(protected authService: AuthService,
              protected toastService: ToastService,
              protected themeService: ThemeService) {}
}
