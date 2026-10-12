import { useId } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 'decimal' shows a keypad with a decimal point; 'numeric' is digits only. */
  inputMode?: 'decimal' | 'numeric';
  suffix?: string;
  error?: string;
  placeholder?: string;
}

export function NumberField({ label, value, onChange, inputMode = 'decimal', suffix, error, placeholder }: Props) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="label">{label}{suffix && ` (${suffix})`}</label>
      <input
        id={id}
        className={`input ${error ? 'border-protein' : ''}`}
        inputMode={inputMode}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}
