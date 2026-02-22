import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  inputSize?: 'sm' | 'md';
}

export function Input({
  label,
  error,
  inputSize = 'md',
  className = '',
  type,
  ...props
}: InputProps) {
  const sizeClass = inputSize === 'sm' ? 'input--sm' : '';
  const typeClass = type === 'number' ? 'input--number' : '';
  const errorClass = error ? 'input--error' : '';

  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <input
        type={type}
        className={`input ${sizeClass} ${typeClass} ${errorClass} ${className}`.trim()}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, className = '', ...props }, ref) {
    return (
      <div className="input-wrapper">
        {label && <label className="input-label">{label}</label>}
        <textarea ref={ref} className={`textarea ${className}`.trim()} {...props} />
      </div>
    );
  },
);
