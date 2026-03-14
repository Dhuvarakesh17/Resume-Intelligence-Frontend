'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import gsap from 'gsap';
import { setUnauthorizedHandler } from '@/lib/api';

type TransitionMode =
  | 'page-transition-horizontal-left'
  | 'page-transition-horizontal-right'
  | 'page-transition-vertical-up'
  | 'page-transition-vertical-down'
  | 'page-transition-ml-expand'
  | 'page-transition-ml-collapse'
  | 'page-transition-fade';

type MlTransitionOrigin = {
  x: number;
  y: number;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const navbarRoutes = useMemo(
    () => new Set(['/dashboard', '/upload', '/score', '/recommend', '/profile', '/ml-tools']),
    []
  );

  const verticalOrder = useMemo(
    () => ['/', '/login', '/register', '/dashboard', '/upload', '/score', '/recommend', '/profile', '/ml-tools'],
    []
  );

  const isMlRoute = (path: string | null) => Boolean(path && path.startsWith('/ml/'));

  const transitionData = useMemo(() => {
    if (typeof window === 'undefined') {
      return { mode: 'page-transition-fade' as TransitionMode, origin: null as MlTransitionOrigin | null };
    }

    const prevPath = sessionStorage.getItem('prevPath');
    let mode: TransitionMode = 'page-transition-fade';
    let origin: MlTransitionOrigin | null = null;

    const prevIsNavbar = Boolean(prevPath && navbarRoutes.has(prevPath));
    const nextIsNavbar = navbarRoutes.has(pathname);

    if (isMlRoute(pathname)) {
      const rawOrigin = sessionStorage.getItem('mlTransitionOrigin');
      if (rawOrigin) {
        try {
          const parsed = JSON.parse(rawOrigin) as MlTransitionOrigin;
          origin = { x: parsed.x, y: parsed.y };
          if (typeof parsed.left === 'number') origin.left = parsed.left;
          if (typeof parsed.top === 'number') origin.top = parsed.top;
          if (typeof parsed.width === 'number') origin.width = parsed.width;
          if (typeof parsed.height === 'number') origin.height = parsed.height;
          mode = 'page-transition-ml-expand';
        } catch {
          mode = 'page-transition-fade';
        }
      }
    } else if (prevPath && isMlRoute(prevPath) && !isMlRoute(pathname)) {
      const rawOrigin = sessionStorage.getItem('mlTransitionOrigin');
      if (rawOrigin) {
        try {
          const parsed = JSON.parse(rawOrigin) as MlTransitionOrigin;
          origin = { x: parsed.x, y: parsed.y };
          if (typeof parsed.left === 'number') origin.left = parsed.left;
          if (typeof parsed.top === 'number') origin.top = parsed.top;
          if (typeof parsed.width === 'number') origin.width = parsed.width;
          if (typeof parsed.height === 'number') origin.height = parsed.height;
        } catch {
          origin = null;
        }
      }
      mode = 'page-transition-ml-collapse';
    } else if (prevPath && prevIsNavbar && nextIsNavbar) {
      const prevIndex = verticalOrder.indexOf(prevPath);
      const nextIndex = verticalOrder.indexOf(pathname);
      if (prevIndex >= 0 && nextIndex >= 0 && nextIndex > prevIndex) {
        mode = 'page-transition-horizontal-right';
      } else {
        mode = 'page-transition-horizontal-left';
      }
    } else if (prevPath) {
      const prevIndex = verticalOrder.indexOf(prevPath);
      const nextIndex = verticalOrder.indexOf(pathname);
      if (prevIndex >= 0 && nextIndex >= 0) {
        mode = nextIndex > prevIndex ? 'page-transition-vertical-up' : 'page-transition-vertical-down';
      }
    }

    return { mode, origin };
  }, [pathname, navbarRoutes, verticalOrder]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('prevPath', pathname);
    }
  }, [pathname]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (pathname !== '/login') {
        router.push('/login');
      }
    });

    return () => setUnauthorizedHandler(null);
  }, [router, pathname]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') {
      return;
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dx = transitionData.origin ? (transitionData.origin.x - centerX) * 0.12 : 0;
    const dy = transitionData.origin ? (transitionData.origin.y - centerY) * 0.12 : 0;
    const originLeft = transitionData.origin?.left ?? (transitionData.origin ? transitionData.origin.x - 70 : centerX - 70);
    const originTop = transitionData.origin?.top ?? (transitionData.origin ? transitionData.origin.y - 35 : centerY - 35);
    const originWidth = transitionData.origin?.width ?? 140;
    const originHeight = transitionData.origin?.height ?? 70;

    const main = root.querySelector('main');
    const header = root.querySelector('header');

    gsap.killTweensOf([root, main, header]);

    const commonTo = {
      x: 0,
      y: 0,
      scale: 1,
      autoAlpha: 1,
      filter: 'blur(0px)',
      duration: 0.55,
      ease: 'power3.out',
      clearProps: 'transform,opacity,filter',
    };

    const createMorphLayer = (startFromFull: boolean) => {
      const layer = document.createElement('div');
      layer.style.position = 'fixed';
      layer.style.left = '0';
      layer.style.top = '0';
      layer.style.width = '0';
      layer.style.height = '0';
      layer.style.pointerEvents = 'none';
      layer.style.zIndex = '9999';
      layer.style.background = 'linear-gradient(140deg, rgba(255,255,255,0.98), rgba(244,247,251,0.98))';
      layer.style.boxShadow = '0 24px 56px rgba(2, 6, 23, 0.18)';
      layer.style.borderRadius = '14px';
      layer.style.border = '1px solid rgba(148, 163, 184, 0.28)';
      document.body.appendChild(layer);

      const fromVars = startFromFull
        ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: 0, autoAlpha: 0.2 }
        : {
            left: originLeft,
            top: originTop,
            width: originWidth,
            height: originHeight,
            borderRadius: 14,
            autoAlpha: 0.38,
          };

      const toVars = startFromFull
        ? {
            left: originLeft,
            top: originTop,
            width: originWidth,
            height: originHeight,
            borderRadius: 14,
            autoAlpha: 0,
          }
        : {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            borderRadius: 0,
            autoAlpha: 0,
          };

      gsap.fromTo(layer, fromVars, {
        ...toVars,
        duration: 0.58,
        ease: 'power3.inOut',
        onComplete: () => {
          layer.remove();
        },
      });
    };

    switch (transitionData.mode) {
      case 'page-transition-horizontal-right':
        gsap.fromTo(root, { x: 28, autoAlpha: 0 }, commonTo);
        break;
      case 'page-transition-horizontal-left':
        gsap.fromTo(root, { x: -28, autoAlpha: 0 }, commonTo);
        break;
      case 'page-transition-vertical-up':
        gsap.fromTo(root, { y: 18, autoAlpha: 0 }, commonTo);
        break;
      case 'page-transition-vertical-down':
        gsap.fromTo(root, { y: -18, autoAlpha: 0 }, commonTo);
        break;
      case 'page-transition-ml-expand':
        createMorphLayer(false);
        gsap.fromTo(
          root,
          {
            x: dx,
            y: dy,
            scale: 0.93,
            autoAlpha: 0,
            filter: 'blur(8px)',
          },
          { ...commonTo, duration: 0.76, ease: 'power4.out' }
        );
        break;
      case 'page-transition-ml-collapse':
        createMorphLayer(true);
        gsap.fromTo(
          root,
          {
            x: -dx,
            y: -dy,
            scale: 1.03,
            autoAlpha: 0,
            filter: 'blur(6px)',
          },
          { ...commonTo, duration: 0.72, ease: 'power4.out' }
        );
        break;
      default:
        gsap.fromTo(root, { autoAlpha: 0 }, { ...commonTo, duration: 0.42, ease: 'power2.out' });
        break;
    }

    if (header) {
      gsap.fromTo(header, { y: -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out' });
    }
    if (main) {
      gsap.fromTo(main, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, delay: 0.08, ease: 'power2.out' });
    }
  }, [pathname, transitionData]);

  return (
    <div
      ref={rootRef}
      className="page-transition page-transition-fade"
    >
      {children}
    </div>
  );
}
