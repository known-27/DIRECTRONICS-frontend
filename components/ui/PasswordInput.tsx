'use client';

import React, { useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showStrength?: boolean;
  /** Extra props forwarded to <input> (e.g. react-hook-form register spread) */
  [key: string]: unknown;
}

function getStrength(password: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' };
  if (password.length < 8)  return { level: 1, label: 'Weak',   color: '#EF4444' };
  if (password.length < 12) return { level: 2, label: 'Fair',   color: '#F59E0B' };
  return                           { level: 3, label: 'Strong', color: '#10B981' };
}

export function PasswordInput({
  id: externalId,
  value,
  onChange,
  placeholder = 'Enter password',
  className = '',
  disabled = false,
  showStrength = false,
  ...rest
}: PasswordInputProps): React.ReactElement {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = externalId ?? generatedId;

  const strength = showStrength ? getStrength(value) : null;

  return (
    <div className="w-full">
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input pr-10 ${className}`}
          autoComplete="current-password"
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-controls={inputId}
          style={{
            position:   'absolute',
            right:       '10px',
            top:         '50%',
            transform:   'translateY(-50%)',
            background:  'transparent',
            border:      'none',
            cursor:      disabled ? 'not-allowed' : 'pointer',
            padding:     '4px',
            color:       'var(--text-muted)',
            display:     'flex',
            alignItems:  'center',
            transition:  'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Strength indicator */}
      {showStrength && strength && strength.level > 0 && (
        <div className="mt-1.5">
          <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
            {[1, 2, 3].map((seg) => (
              <div
                key={seg}
                style={{
                  flex:         1,
                  height:       '3px',
                  borderRadius: '2px',
                  background:   seg <= strength.level ? strength.color : 'var(--border-subtle)',
                  transition:   'background 0.2s',
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: '11px', color: strength.color }}>{strength.label}</p>
        </div>
      )}
    </div>
  );
}
