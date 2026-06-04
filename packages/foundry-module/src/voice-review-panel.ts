// Voice review panel for Foundry VTT

interface VoiceStatePayload {
  commandId?: string;
  state: string;
  transcript?: string;
  provider?: string;
  latencyMs?: number;
  message?: string | null;
  error?: string | null;
  updatedAt?: string;
}

/**
 * Arcane Voice Review Panel
 * Floating panel above the hotbar showing voice command state + transcript.
 */
export class VoiceReviewPanel {
  private element: HTMLElement | null = null;
  private collapsed = true;
  private currentState: VoiceStatePayload = { state: 'idle' };

  constructor() {
    this.render();
  }

  private render(): void {
    const existing = document.getElementById('arcane-voice-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'arcane-voice-panel';
    panel.className = 'arcane-voice-panel collapsed';

    panel.innerHTML = `
      <div class="arcane-voice-handle" title="Click to expand/collapse">
        <span class="arcane-voice-indicator" id="arcane-voice-indicator"></span>
        <span class="arcane-voice-capsule" id="arcane-voice-capsule">Voice</span>
        <span class="arcane-voice-chevron">▲</span>
      </div>
      <div class="arcane-voice-body" id="arcane-voice-body">
        <div class="arcane-voice-meta" id="arcane-voice-meta"></div>
        <div class="arcane-voice-transcript" id="arcane-voice-transcript"></div>
        <div class="arcane-voice-message" id="arcane-voice-message"></div>
        <div class="arcane-voice-error" id="arcane-voice-error"></div>
      </div>
    `;

    document.body.appendChild(panel);
    this.element = panel;

    const handle = panel.querySelector('.arcane-voice-handle') as HTMLElement;
    handle.addEventListener('click', () => this.toggle());

    this.updateUI();
  }

  toggle(): void {
    if (!this.element) return;
    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      this.element.classList.add('collapsed');
    } else {
      this.element.classList.remove('collapsed');
    }
    const chevron = this.element.querySelector('.arcane-voice-chevron') as HTMLElement;
    if (chevron) chevron.textContent = this.collapsed ? '▲' : '▼';
  }

  update(payload: VoiceStatePayload): void {
    this.currentState = payload;
    this.updateUI();
  }

  private updateUI(): void {
    if (!this.element) return;
    const s = this.currentState;

    const indicator = this.element.querySelector('#arcane-voice-indicator') as HTMLElement;
    const capsule = this.element.querySelector('#arcane-voice-capsule') as HTMLElement;
    const meta = this.element.querySelector('#arcane-voice-meta') as HTMLElement;
    const transcript = this.element.querySelector('#arcane-voice-transcript') as HTMLElement;
    const message = this.element.querySelector('#arcane-voice-message') as HTMLElement;
    const errorEl = this.element.querySelector('#arcane-voice-error') as HTMLElement;

    if (indicator) {
      indicator.className = 'arcane-voice-indicator state-' + (s.state || 'idle');
    }

    if (capsule) {
      capsule.textContent = this.stateLabel(s.state);
    }

    if (meta) {
      meta.innerHTML = [
        s.state && `<span class="arcane-voice-tag state-${s.state}">${this.stateLabel(s.state)}</span>`,
        s.provider ? `<span class="arcane-voice-tag">${s.provider}</span>` : '',
        s.latencyMs ? `<span class="arcane-voice-tag">${s.latencyMs}ms</span>` : '',
      ].filter(Boolean).join('');
    }

    if (transcript) {
      transcript.textContent = s.transcript || '';
      transcript.style.display = s.transcript ? 'block' : 'none';
    }

    if (message) {
      message.textContent = s.message || '';
      message.style.display = s.message ? 'block' : 'none';
    }

    if (errorEl) {
      errorEl.textContent = s.error || '';
      errorEl.style.display = s.error ? 'block' : 'none';
    }

    // Auto-expand on important states
    if (['draft', 'executing', 'error', 'done'].includes(s.state) && this.collapsed) {
      this.toggle();
    }
  }

  private stateLabel(state: string): string {
    const labels: Record<string, string> = {
      idle: 'Voice',
      recording: 'Recording',
      transcribing: 'Transcribing',
      draft: 'Draft',
      executing: 'Executing',
      done: 'Done',
      error: 'Error',
    };
    return labels[state] || state;
  }

  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
