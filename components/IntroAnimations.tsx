'use client';

import { useEffect } from 'react';
import { initAnimations } from './animations';

export function IntroAnimations() {
  useEffect(() => {
    initAnimations();
  }, []);

  return null;
}
