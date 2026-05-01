import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { WEATHER_OPTIONS } from './constants';
import { useEcoSortStore } from './store';
import Level from './world/Level';
import Bins from './world/Bins';
import Conveyor from './world/Conveyor';
import EcoSortEffects from './world/Effects';
import Weather from './world/Weather';
import Player from './entities/Player';
import TrashSpawner from './entities/TrashSpawner';
import HUD from './ui/HUD';
import Menu from './ui/Menu';
import TouchControls from './ui/TouchControls';

export default function EcoSortGame() {
  const isBrowser = useIsBrowser();
  const setWeather = useEcoSortStore((state) => state.setWeather);
  const resetToken = useEcoSortStore((state) => state.resetToken);
  const setPointerLockTarget = useEcoSortStore((state) => state.setPointerLockTarget);
  const pointerLockTarget = useEcoSortStore((state) => state.pointerLockTarget);
  const setPointerLockPending = useEcoSortStore((state) => state.setPointerLockPending);
  const setPlaying = useEcoSortStore((state) => state.setPlaying);

  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const next = WEATHER_OPTIONS[Math.floor(Math.random() * WEATHER_OPTIONS.length)];
    setWeather(next);
  }, [setWeather, resetToken]); // regenerate weather on restart too

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!pointerLockTarget) return;
    const doc = pointerLockTarget.ownerDocument;

    const sync = () => {
      const coarse = typeof window !== 'undefined' ? (window.matchMedia?.('(pointer: coarse)')?.matches ?? false) : false;
      const locked = doc.pointerLockElement === pointerLockTarget;
      setPointerLockPending(false);
      if (!coarse) {
        setPlaying(locked);
      }
      pointerLockTarget.style.cursor = locked ? 'none' : 'auto';
    };

    doc.addEventListener('pointerlockchange', sync);
    doc.addEventListener('pointerlockerror', sync);
    sync();

    return () => {
      doc.removeEventListener('pointerlockchange', sync);
      doc.removeEventListener('pointerlockerror', sync);
    };
  }, [pointerLockTarget, setPlaying, setPointerLockPending]);

  if (!isBrowser) {
    return null;
  }

  return (
    <div style={styles.wrapper}>
      <Canvas
        shadows
        frameloop={tabVisible ? 'always' : 'never'}
        camera={{ position: [0, 2, 8], fov: 60 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = SRGBColorSpace;
          gl.domElement.style.touchAction = 'none';
          gl.domElement.style.cursor = 'auto';
          gl.domElement.tabIndex = 0;
          gl.domElement.style.outline = 'none';
          setPointerLockTarget(gl.domElement);
        }}
      >
        <group key={resetToken}>
          <Physics gravity={[0, -15, 0]} timeStep="vary">
            <Level />
            <Conveyor />
            <Bins />
            <TrashSpawner />
            <Player />
          </Physics>
          <Weather />
          <EcoSortEffects />
        </group>
      </Canvas>
      <HUD />
      <Menu />
      <TouchControls />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
};
