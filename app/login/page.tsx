'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const { login } = useAuth();
  const [passwordValue, setPasswordValue] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm): Promise<void> => {
    setApiError(null);
    try {
      const user = await login(data.email, data.password);
      if (user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/employee/dashboard');
      }
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setApiError(error.response?.data?.message ?? 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(37,99,235,0.08), transparent 60%)' }} />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 glow-blue" style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpeg"
              alt="DIRECTRONICS Logo"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>DIRECTRONICS</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>ServiceFlow ERP — Sign In</p>
        </div>

        {/* Card */}
        <div className="card border-slate-800/80">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* API Error */}
            {apiError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 animate-fade-in">
                {apiError}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="label">Password</label>
              <PasswordInput
                id="login-password"
                value={passwordValue}
                onChange={(e) => {
                  setPasswordValue(e.target.value);
                  setValue('password', e.target.value, { shouldValidate: true });
                }}
                placeholder="password"
                className={errors.password ? 'input-error' : ''}
                disabled={isSubmitting}
              />
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full btn-lg mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-faint)' }}>
          DIRECTRONICS ServiceFlow ERP &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
