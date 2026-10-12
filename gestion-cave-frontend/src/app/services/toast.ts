import { Injectable, signal } from '@angular/core';

/**
 * Message de confirmation affiché en bas de l'écran (voir app.html)
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  message = signal<string | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  show(msg: string) {
    this.message.set(msg);

    // Un nouveau message repart pour 6 secondes complètes
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.message.set(null);
    }, 6000);
  }

  fermer() {
    clearTimeout(this.timer);
    this.message.set(null);
  }
}
