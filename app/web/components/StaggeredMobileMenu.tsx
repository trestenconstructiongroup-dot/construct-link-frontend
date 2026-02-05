/**
 * Staggered mobile menu panel – same design/transitions as reactbits.dev staggered-menu.
 * Keeps app content, theme, company colors, and font family.
 */

import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './StaggeredMobileMenu.css';

export interface StaggeredMobileMenuItem {
  label: string;
  path: string;
  ariaLabel?: string;
}

export interface StaggeredMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  /** Colors for the staggered underlay layers (2–3). Uses theme background + shade. */
  prelayerColors?: string[];
  /** Accent color for hover and numbers (e.g. brand blue). */
  accentColor?: string;
  /** Text/foreground color. */
  textColor?: string;
  /** Background of the main panel. */
  panelBackground?: string;
  /** Font family (e.g. FreakTurbulenceBRK). */
  fontFamily?: string;
  items: StaggeredMobileMenuItem[];
  displayItemNumbering?: boolean;
  /** Auth section */
  isAuthenticated?: boolean;
  user?: { full_name?: string; email?: string } | null;
  /** Path for profile/account (e.g. /account on web). Used when clicking the user block in the dropdown. */
  profilePath?: string;
  onProfile?: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
  onSignUp?: () => void;
  onNavItemPress?: (path: string) => void;
  closeOnClickAway?: boolean;
}

export function StaggeredMobileMenu({
  isOpen,
  onClose,
  position: pos = 'right',
  prelayerColors = ['#1e1e22', '#35353c'],
  accentColor = 'rgb(0, 130, 201)',
  textColor = '#11181C',
  panelBackground = '#ffffff',
  fontFamily = 'FreakTurbulenceBRK, sans-serif',
  items = [],
  displayItemNumbering = true,
  isAuthenticated = false,
  user,
  profilePath = '/account',
  onProfile,
  onLogout,
  onLogin,
  onSignUp,
  onNavItemPress,
  closeOnClickAway = true,
}: StaggeredMobileMenuProps) {
  const openRef = useRef(isOpen);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  openRef.current = isOpen;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      if (!panel) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = pos === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen });
    });
    return () => ctx.revert();
  }, [pos]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    closeTweenRef.current = null;

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
    ) as HTMLElement[];
    const authSection = panel.querySelector('.sm-auth-section') as HTMLElement | null;
    const authLinks = Array.from(panel.querySelectorAll('.sm-auth-link')) as HTMLElement[];

    const layerStates = layers.map((el) => ({ el, start: Number(gsap.getProperty(el, 'xPercent')) }));
    const panelStart = Number(gsap.getProperty(panel, 'xPercent'));

    gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });
    if (authSection) gsap.set(authSection, { opacity: 0 });
    if (authLinks.length) gsap.set(authLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(
        ls.el,
        { xPercent: ls.start },
        { xPercent: 0, duration: 0.5, ease: 'power4.out' },
        i * 0.07
      );
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.1, from: 'start' },
        },
        itemsStart
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.08, from: 'start' },
          },
          itemsStart + 0.1
        );
      }
    }

    if (authSection || authLinks.length) {
      const authStart = panelInsertTime + panelDuration * 0.4;
      if (authSection) {
        tl.to(authSection, { opacity: 1, duration: 0.5, ease: 'power2.out' }, authStart);
      }
      if (authLinks.length) {
        tl.to(
          authLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => gsap.set(authLinks, { clearProps: 'opacity' }),
          },
          authStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [pos]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = pos === 'left' ? -100 : 100;
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
        gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        const numberEls = Array.from(
          panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
        ) as HTMLElement[];
        if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });
        const authSection = panel.querySelector('.sm-auth-section') as HTMLElement | null;
        const authLinks = Array.from(panel.querySelectorAll('.sm-auth-link')) as HTMLElement[];
        if (authSection) gsap.set(authSection, { opacity: 0 });
        if (authLinks.length) gsap.set(authLinks, { y: 25, opacity: 0 });
        busyRef.current = false;
        onClose();
      },
    });
  }, [pos, onClose]);

  // Sync open/close with animation
  const prevOpenRef = useRef(isOpen);
  useLayoutEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      playOpen();
    } else if (!isOpen && prevOpenRef.current) {
      playClose();
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, playOpen, playClose]);

  // Click outside to close
  React.useEffect(() => {
    if (!closeOnClickAway || !isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !(e.target as Element).closest?.('[data-sm-toggle]')
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeOnClickAway, isOpen, onClose]);

  const handleNavClick = (path: string) => {
    onNavItemPress?.(path);
    onClose();
  };

  const rawColors = prelayerColors?.length ? prelayerColors.slice(0, 4) : ['#1e1e22', '#35353c'];
  let layerColors = [...rawColors];
  if (layerColors.length >= 3) {
    const mid = Math.floor(layerColors.length / 2);
    layerColors.splice(mid, 1);
  }

  return (
    <div
      className="staggered-mobile-wrapper"
      data-position={pos}
      data-open={isOpen || undefined}
      style={
        {
          '--sm-accent': accentColor,
          '--sm-text': textColor,
          '--sm-panel-bg': panelBackground,
          '--sm-font': fontFamily,
        } as React.CSSProperties
      }
      aria-hidden={!isOpen}
    >
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {layerColors.map((c, i) => (
          <div key={i} className="sm-prelayer" style={{ background: c }} />
        ))}
      </div>

      <aside
        ref={panelRef}
        className="staggered-mobile-panel"
        id="staggered-mobile-panel"
        aria-hidden={!isOpen}
      >
        <div className="sm-panel-inner">
          <ul
            className="sm-panel-list"
            role="list"
            data-numbering={displayItemNumbering || undefined}
          >
            {items.length
              ? items.map((it, idx) => (
                  <li className="sm-panel-itemWrap" key={it.path + idx}>
                    <button
                      type="button"
                      className="sm-panel-item"
                      aria-label={it.ariaLabel || it.label}
                      data-index={idx + 1}
                      onClick={() => handleNavClick(it.path)}
                    >
                      <span className="sm-panel-itemLabel">{it.label}</span>
                    </button>
                  </li>
                ))
              : null}
          </ul>

          <div className="sm-auth-section" aria-label="Account">
            {isAuthenticated && user ? (
              <>
                <button
                  type="button"
                  className="sm-auth-user sm-auth-user-btn"
                  onClick={() => {
                    onProfile?.();
                    onClose();
                  }}
                  aria-label="Go to profile"
                >
                  <div className="sm-auth-avatar" style={{ backgroundColor: accentColor }} />
                  <div className="sm-auth-info">
                    <span className="sm-auth-name">{user.full_name || user.email || 'User'}</span>
                    {user.email && (
                      <span className="sm-auth-email">{user.email}</span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  className="sm-auth-link sm-auth-link-danger"
                  onClick={() => {
                    onLogout?.();
                    onClose();
                  }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="sm-auth-link"
                  onClick={() => {
                    onLogin?.();
                    onClose();
                  }}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className="sm-auth-link sm-auth-link-cta"
                  onClick={() => {
                    onSignUp?.();
                    onClose();
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default StaggeredMobileMenu;
