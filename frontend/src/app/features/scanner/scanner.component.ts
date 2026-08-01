import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Html5Qrcode } from 'html5-qrcode';
import { AuthService } from '../../core/auth.service';
import { PointageService } from '../../core/pointage.service';
import { Chantier, Pointage, ScanResult } from '../../core/models';

type Mode = 'camera' | 'douchette';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './scanner.component.html',
  styleUrl: './scanner.component.scss',
})
export class ScannerComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private api = inject(PointageService);

  @ViewChild('douchetteInput') douchetteInput?: ElementRef<HTMLInputElement>;

  private readonly qrRegionId = 'qr-reader';
  private scanner?: Html5Qrcode;
  private lastCode = '';
  private lastAt = 0;

  chantiers = signal<Chantier[]>([]);
  chantierId = signal<number | null>(null);
  mode = signal<Mode>('camera');
  scanning = signal(false);
  feedback = signal<ScanResult | null>(null);
  errorMsg = signal<string | null>(null);
  liste = signal<Pointage[]>([]);
  codeManuel = '';

  get userName(): string {
    return this.auth.user()?.name ?? 'Opérateur';
  }

  ngOnInit(): void {
    this.api.chantiers().subscribe((res) => {
      this.chantiers.set(res.data);
      const saved = Number(localStorage.getItem('paiejour_chantier'));
      const initial = res.data.find((c) => c.id === saved) ?? res.data[0];
      if (initial) {
        this.onChantierChange(initial.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  onChantierChange(id: number): void {
    this.chantierId.set(id);
    localStorage.setItem('paiejour_chantier', String(id));
    this.rafraichirListe();
    if (this.mode() === 'camera') {
      this.startCamera();
    } else {
      this.focusDouchette();
    }
  }

  setMode(mode: Mode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    if (mode === 'camera') {
      this.startCamera();
    } else {
      this.stopCamera();
      this.focusDouchette();
    }
  }

  private async startCamera(): Promise<void> {
    if (!this.chantierId()) return;
    await this.stopCamera();
    try {
      this.scanner = new Html5Qrcode(this.qrRegionId, { verbose: false });
      this.scanning.set(true);
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => this.onDecoded(text, 'camera'),
        () => {},
      );
    } catch (e) {
      this.scanning.set(false);
      this.errorMsg.set("Caméra indisponible. Utilisez le mode douchette ou vérifiez les autorisations.");
    }
  }

  private async stopCamera(): Promise<void> {
    if (this.scanner) {
      try {
        await this.scanner.stop();
        this.scanner.clear();
      } catch {
        /* déjà arrêté */
      }
      this.scanner = undefined;
    }
    this.scanning.set(false);
  }

  private focusDouchette(): void {
    setTimeout(() => this.douchetteInput?.nativeElement.focus(), 50);
  }

  onDouchetteEnter(): void {
    const code = this.codeManuel.trim();
    this.codeManuel = '';
    if (code) {
      this.onDecoded(code, 'douchette');
    }
    this.focusDouchette();
  }

  /**
   * Anti-doublon : on ignore le même code scanné deux fois en moins de 3 s.
   */
  private onDecoded(code: string, source: Mode): void {
    const now = Date.now();
    if (code === this.lastCode && now - this.lastAt < 3000) {
      return;
    }
    this.lastCode = code;
    this.lastAt = now;
    this.envoyer(code, source);
  }

  private envoyer(code: string, source: Mode): void {
    const chantierId = this.chantierId();
    if (!chantierId) return;
    this.errorMsg.set(null);

    this.api.scan(code, chantierId, source).subscribe({
      next: (res) => {
        this.feedback.set(res);
        this.beep(res.action !== 'deja_complet');
        this.rafraichirListe();
      },
      error: (err) => {
        this.feedback.set(null);
        this.errorMsg.set(err?.error?.errors?.code?.[0] ?? err?.error?.message ?? 'Scan refusé.');
        this.beep(false);
      },
    });
  }

  private rafraichirListe(): void {
    const id = this.chantierId();
    if (!id) return;
    this.api.pointagesDuJour(id).subscribe((res) => this.liste.set(res.data));
  }

  /** Retour sonore simple (WebAudio) : aigu = OK, grave = erreur. */
  private beep(ok: boolean): void {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = ok ? 880 : 220;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      /* audio non dispo */
    }
  }

  logout(): void {
    this.stopCamera();
    this.auth.logout();
    location.href = '/login';
  }
}
