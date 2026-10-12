import { Injectable, signal } from '@angular/core';

export type TypeToast = 'info' | 'erreur';

/**
 * Message affiché en bas de l'écran (voir app.html)
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  message = signal<string | null>(null);
  type = signal<TypeToast>('info');
  private timer?: ReturnType<typeof setTimeout>;

  show(msg: string, type: TypeToast = 'info') {
    this.message.set(msg);
    this.type.set(type);

    // Un nouveau message repart pour sa durée complète ; une erreur reste plus longtemps
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.message.set(null);
    }, type === 'erreur' ? 10000 : 6000);
  }

  fermer() {
    clearTimeout(this.timer);
    this.message.set(null);
  }
}
