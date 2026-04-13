'use client';

import { useState, useCallback } from 'react';
import HilfeDrawer from './HilfeDrawer';
import GuidedTour from './GuidedTour';

export default function HilfeSystem() {
  const [tourRequested, setTourRequested] = useState(false);

  const handleStartTour = useCallback(() => {
    setTourRequested(true);
  }, []);

  const handleTourStarted = useCallback(() => {
    setTourRequested(false);
  }, []);

  return (
    <>
      <HilfeDrawer onStartTour={handleStartTour} />
      <GuidedTour externalTrigger={tourRequested} onTriggerConsumed={handleTourStarted} />
    </>
  );
}
