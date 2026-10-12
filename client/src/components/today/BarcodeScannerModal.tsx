import { BarcodeParam, type Food } from '@fuellog/shared';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/apiClient';

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
const hasNative = () => 'BarcodeDetector' in window;
const canUseCamera = () => window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

/** Reads a barcode from a still photo: the native detector where it exists, ZXing everywhere else. */
async function decodePhoto(file: File): Promise<string | null> {
  if (hasNative()) {
    const bitmap = await createImageBitmap(file);
    const codes = await new BarcodeDetector({ formats: FORMATS }).detect(bitmap);
    bitmap.close();
    return codes[0]?.rawValue ?? null;
  }
  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  const url = URL.createObjectURL(file);
  try {
    return (await new BrowserMultiFormatReader().decodeFromImageUrl(url)).getText();
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

interface Props {
  onClose: () => void;
  onFood: (food: Food) => void;
  /** The barcode is not in Open Food Facts, so the caller opens the custom-food form. */
  onUnknown: () => void;
}

export function BarcodeScannerModal({ onClose, onFood, onUnknown }: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const busy = useRef(false);
  const [live, setLive] = useState(canUseCamera);
  const [digits, setDigits] = useState('');
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const lookup = useCallback(async (raw: string): Promise<'ok' | 'invalid' | 'failed'> => {
    const code = BarcodeParam.safeParse(raw.trim());
    if (!code.success) {
      setMessage('A barcode is 8 to 14 digits.');
      return 'invalid';
    }
    if (busy.current) return 'failed';
    busy.current = true;
    setMessage('Looking it up…');
    try {
      onFood(await api<Food>(`/foods/barcode/${code.data}`));
      return 'ok';
    } catch (error) {
      if (error instanceof ApiError && error.code === 'barcode_not_found') {
        onUnknown();
        return 'ok';
      }
      setMessage((error as Error).message);
      return 'failed';
    } finally {
      busy.current = false;
    }
  }, [onFood, onUnknown]);

  // Live camera scanning. Every path out of this effect stops the camera.
  useEffect(() => {
    const el = video.current;
    if (!live || !el) return;
    let stopped = false;
    let stop = () => {};
    // The camera sees the same barcode many times a second; retry only after ~3 seconds if lookup failed.
    let lastSeen = '';
    let retryTimer: number | undefined;
    const seen = async (code: string) => {
      if (code === lastSeen) return;
      lastSeen = code;
      window.clearTimeout(retryTimer);
      const res = await lookup(code);
      if (res === 'failed') {
        retryTimer = window.setTimeout(() => {
          if (lastSeen === code) lastSeen = '';
        }, 3000);
      }
    };
    const fail = () => {
      if (stopped) return;
      setLive(false);
      setMessage('The camera is not available. Take a photo of the barcode or type the digits.');
    };

    if (hasNative()) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(async (stream) => {
        try {
          const detector = new BarcodeDetector({ formats: FORMATS });
          const timer = window.setInterval(async () => {
            if (el.readyState < 2) return;
            const codes = await detector.detect(el).catch(() => []);
            if (codes[0]) seen(codes[0].rawValue);
          }, 300);
          stop = () => {
            window.clearInterval(timer);
            stream.getTracks().forEach((track) => track.stop());
          };
          if (stopped) return stop();
          el.srcObject = stream;
          await el.play().catch(() => {});
        } catch {
          stream.getTracks().forEach((track) => track.stop());
          fail();
        }
      }, fail);
    } else {
      import('@zxing/browser')
        .then(({ BrowserMultiFormatReader }) =>
          new BrowserMultiFormatReader().decodeFromConstraints({ video: { facingMode: 'environment' } }, el, (result) => {
            if (result) seen(result.getText());
          }))
        .then((controls) => {
          stop = () => controls.stop();
          if (stopped) stop();
        }, fail);
    }
    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      stop();
    };
  }, [live, lookup]);

  async function fromPhoto(file: File | undefined) {
    if (!file) return;
    setMessage('Reading the photo…');
    const code = await decodePhoto(file).catch(() => null);
    if (code) lookup(code);
    else setMessage('No barcode found in that photo. Fill the frame with the barcode, or type the digits.');
  }

  function submitDigits(e: FormEvent) {
    e.preventDefault();
    lookup(digits);
  }

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby={`${id}-title`}
      className="m-auto w-[calc(100%-2rem)] max-w-[480px] rounded-2xl border border-line bg-card p-4 text-text backdrop:bg-black/60">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id={`${id}-title`} className="text-lg">Scan a barcode</h2>
          <button type="button" className="btn" onClick={onClose}>Close</button>
        </div>

        {live && (
          <video ref={video} muted playsInline className="aspect-[4/3] w-full rounded-xl bg-black object-cover" aria-label="Camera preview. Point it at the barcode." />
        )}

        <label className="btn w-full cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
          Take a photo of the barcode
          <input type="file" accept="image/*" capture="environment" className="sr-only"
            onChange={(e) => {
              fromPhoto(e.target.files?.[0]);
              e.target.value = '';
            }} />
        </label>

        <form onSubmit={submitDigits} noValidate className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={`${id}-digits`} className="label">Or type the digits</label>
            <input id={`${id}-digits`} className="input" inputMode="numeric" autoComplete="off" maxLength={14} placeholder="8901234567890"
              value={digits} onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))} />
          </div>
          <button className="btn-primary">Look up</button>
        </form>

        <p role="status" className="min-h-[1.25rem] text-sm text-muted">{message}</p>
      </div>
    </dialog>
  );
}
