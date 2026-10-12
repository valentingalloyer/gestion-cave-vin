import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it("affiche l'écran de connexion quand on n'est pas connecté", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('app-login')).toBeTruthy();
    expect(page.querySelector('h1')?.textContent).toContain('La cave à Jack');
  });

  it('bascule entre clair et sombre et mémorise le choix', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const bouton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.theme-bascule')!;
    const depart = document.documentElement.dataset['theme'];

    bouton.click();
    await fixture.whenStable();
    const apres = document.documentElement.dataset['theme'];

    expect(['clair', 'sombre']).toContain(apres);
    expect(apres).not.toBe(depart);
    expect(localStorage.getItem('theme')).toBe(apres);
  });
});
