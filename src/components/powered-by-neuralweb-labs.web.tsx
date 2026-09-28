import { NEURALWEB_LABS_URL } from '@/lib/env';

import './powered-by-neuralweb-labs.web.css';

export function PoweredByNeuralWebLabs({ surface = 'dark' }: { surface?: 'dark' | 'light' | 'warm' }) {
  return (
    <a
      aria-label="Powered by NeuralWeb Labs"
      className={`pf-mobile-powered-brand pf-mobile-powered-brand--${surface}`}
      href={NEURALWEB_LABS_URL || undefined}
      onClick={(event) => { if (!NEURALWEB_LABS_URL) event.preventDefault(); }}
      rel="noopener noreferrer"
      target="_blank"
    >
      Powered by <strong>NeuralWeb Labs</strong>
    </a>
  );
}
