import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import type {Project, Timeline} from './types';
import {SceneRenderer} from './scenes/SceneRenderer';
import {ERAS} from './era/eras';
import {eraTransition} from './era/transitions';
import {C} from './theme/tokens';
import {SoundLayer} from './audio/SoundLayer';
import {FormatContext, formatOf, ImagesContext} from './format';

export type MainProps = {project: Project; timeline: Timeline | null; showSubs: boolean; withAudio: boolean};

export const transitionFrames = (p: Project, i: number) => {
  if (i === 0) return 0;
  return p.scenes[i].era !== p.scenes[i - 1].era ? 20 : 12;
};

export const Main: React.FC<MainProps> = ({project, timeline, showSubs, withAudio}) => {
  if (!timeline) return null;
  // เฟรมเริ่มจริงของแต่ละซีน (TransitionSeries ซ้อนซีนกันตามความยาว transition)
  const starts: number[] = [];
  let acc = 0;
  project.scenes.forEach((_, i) => {
    starts.push(acc);
    acc += timeline.scenes[i].dur - (i + 1 < project.scenes.length ? transitionFrames(project, i + 1) : 0);
  });
  return (
    <FormatContext.Provider value={formatOf(project)}>
    <ImagesContext.Provider value={project.images ?? {}}>
    <AbsoluteFill style={{background: C.bgDeep}}>
      <SoundLayer project={project} timeline={timeline} starts={starts} total={acc} withVo={withAudio} />
      <TransitionSeries>
        {project.scenes.map((s, i) => {
          const tm = timeline.scenes[i];
          const kind = s.era !== project.scenes[i - 1]?.era ? ERAS[s.era].transitionIn : 'zoom';
          return (
            <React.Fragment key={s.id}>
              {i > 0 && <TransitionSeries.Transition presentation={eraTransition(kind)} timing={linearTiming({durationInFrames: transitionFrames(project, i)})} />}
              <TransitionSeries.Sequence durationInFrames={tm.dur} name={`${s.id} · ${s.beat} · ${s.era}`}>
                <SceneRenderer scene={s} timing={tm} sources={project.sources} showSubs={showSubs} subMode={project.settings?.subtitles ?? 'th'} />
                {withAudio && (
                  <Sequence from={6}>
                    <Audio src={staticFile(`${project.meta.slug}/${s.voFile}`)} />
                  </Sequence>
                )}
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
    </ImagesContext.Provider>
    </FormatContext.Provider>
  );
};
