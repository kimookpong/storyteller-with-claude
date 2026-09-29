import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import type {Scene, SceneTiming} from '../types';
import {ShotRenderer} from '../shots/ShotRenderer';
import type {SubMode} from '../text/subchunks';

export const SceneRenderer: React.FC<{scene: Scene; timing: SceneTiming; sources: Record<string, string>; showSubs: boolean; subMode?: SubMode}> = ({scene, timing, sources, showSubs, subMode}) => (
  <AbsoluteFill>
    {timing.shots.map((st) => {
      const shot = scene.shots.find((s) => s.id === st.id);
      if (!shot) return null;
      return (
        <Sequence key={st.id} from={st.from} durationInFrames={st.dur} name={`${st.id} · ${shot.kind}`}>
          <ShotRenderer shot={shot} era={scene.era} dur={st.dur} subtitle={st.subtitle} subtitleEn={st.subtitleEn} subMode={subMode} sources={sources} showSubs={showSubs} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
