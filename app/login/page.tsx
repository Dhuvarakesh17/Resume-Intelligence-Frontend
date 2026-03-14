'use client';

import { useState, FormEvent, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type?: 'standard' | 'icon';
          theme?: 'outline' | 'filled_blue' | 'filled_black';
          size?: 'large' | 'medium' | 'small';
          width?: number;
          text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
          shape?: 'rectangular' | 'pill' | 'circle' | 'square';
        }
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(false);
  const [isGoogleButtonRendered, setIsGoogleButtonRendered] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError((err as Error).message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeGoogleSignIn = useCallback(() => {
    if (!GOOGLE_CLIENT_ID || !window.google || !googleButtonRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: GoogleCredentialResponse) => {
        if (!response.credential) {
          setError('Google sign-in did not return a token. Please try again.');
          return;
        }

        setError('');
        setIsGoogleLoading(true);

        try {
          await loginWithGoogle({ idToken: response.credential });
          router.push('/');
        } catch (err) {
          setError((err as Error).message || 'Google login failed');
        } finally {
          setIsGoogleLoading(false);
        }
      },
    });

    googleButtonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 320,
    });

    requestAnimationFrame(() => {
      setIsGoogleButtonRendered(Boolean(googleButtonRef.current?.childElementCount));
    });
  }, [loginWithGoogle, router]);

  const handleGoogleFallbackClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google login.');
      return;
    }

    if (!isGoogleScriptReady) {
      setError('Google script is still loading. Please try again in a moment.');
      return;
    }

    setError('Google button could not render. Check Google OAuth Authorized JavaScript origins and disable blockers, then refresh.');
  };

  return (
    <div className="min-h-screen bg-[#e7efe9] p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1400px] grid-cols-1 overflow-hidden rounded-[28px] border border-[#c8d3cc] bg-[#edf3ef] shadow-xl lg:grid-cols-2">
        <div className="hidden items-center p-4 lg:flex">
          <div className="w-full rounded-[24px] border border-[#c8d3cc] bg-[#dfe8e2] p-4">
            <div className="relative mx-auto aspect-[16/10] w-full">
              <Image
                src="/job_vacancy.jpg"
                alt="Resume screening illustration"
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-10 lg:p-12">
          <div className="w-full max-w-[560px] space-y-8 rounded-3xl border border-[#c8d3cc] bg-[#f3f7f4] p-10 shadow-sm md:p-12 lg:min-h-[520px] lg:flex lg:flex-col lg:justify-center">
            <div>
              <h2 className="text-center text-4xl font-black tracking-tight text-slate-900">Resume AI</h2>
              <p className="mt-2 text-center text-sm font-medium text-slate-600">Sign in to your account</p>
            </div>

            <>
              <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => {
                  setIsGoogleScriptReady(true);
                  initializeGoogleSignIn();
                }}
                onError={() => setError('Failed to load Google script. Check network/ad blocker and refresh.')}
              />
              <div className="flex flex-col items-center gap-3">
                <div ref={googleButtonRef} className="min-h-[44px]" />
                {!isGoogleButtonRendered && (
                  <button
                    type="button"
                    onClick={handleGoogleFallbackClick}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#d4d4d4] bg-white px-4 py-2 text-sm font-medium text-slate-600"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.4-.2-2.1H12z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 22c2.5 0 4.6-.8 6.2-2.2l-3.1-2.4c-.9.6-2 .9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H3.7v2.5C5.3 20.1 8.4 22 12 22z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M6.9 14.5c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V8.2H3.7C3.2 9.3 3 10.4 3 11.6s.2 2.3.7 3.4l3.2-2.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M12 6.9c1.3 0 2.5.5 3.4 1.3l2.5-2.5C16.5 4.4 14.4 3.5 12 3.5c-3.6 0-6.7 1.9-8.3 4.7l3.2 2.5c.7-2.2 2.7-3.8 5.1-3.8z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                )}
                {!isGoogleButtonRendered && (
                  <p className="text-xs text-slate-500">
                    {!GOOGLE_CLIENT_ID
                      ? 'Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google login.'
                      : 'Google button is loading. If it stays hidden, click the button above for troubleshooting.'}
                  </p>
                )}
                {isGoogleLoading && <p className="text-xs text-slate-500">Signing in with Google...</p>}
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#c8d3cc]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#f3f7f4] px-3 text-slate-500">Or sign in with email</span>
                </div>
              </div>
            </>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-[#bcc8c1] bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-slate-700"
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-[#bcc8c1] bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-slate-700"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
