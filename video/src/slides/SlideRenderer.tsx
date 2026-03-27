// Dispatch slide visual type → component

import React from "react";
import type { SlideVisual } from "../data/script";
import type { PartId } from "../design";
import { SlideContainer } from "./SlideContainer";
import {
  TitleSlide,
  HeadlineSlide,
  BulletsSlide,
  TextSlide,
  ToolGridSlide,
  CodeBlockSlide,
  CalloutSlide,
  ChatSlide,
  ToolCallSlide,
  SceneSlide,
  InspirationSlide,
} from "./SlideComponents";
import { ArchDiagram } from "./ArchDiagram";
import { LifecycleDiagram } from "./LifecycleDiagram";

type Props = {
  visual: SlideVisual;
  partId: PartId;
};

export const SlideRenderer: React.FC<Props> = ({ visual, partId }) => {
  const inner = (() => {
    switch (visual.type) {
      case "title":
        return <TitleSlide title={visual.title} subtitle={visual.subtitle} partId={partId} />;
      case "headline":
        return <HeadlineSlide text={visual.text} partId={partId} />;
      case "bullets":
        return <BulletsSlide items={visual.items} partId={partId} />;
      case "text":
        return <TextSlide body={visual.body} partId={partId} />;
      case "tool-grid":
        return <ToolGridSlide tools={visual.tools} partId={partId} />;
      case "code-block":
        return (
          <CodeBlockSlide
            code={visual.code}
            language={visual.language}
            caption={visual.caption}
            partId={partId}
          />
        );
      case "callout":
        return (
          <CalloutSlide
            icon={visual.icon}
            heading={visual.heading}
            body={visual.body}
            partId={partId}
          />
        );
      case "chat":
        return <ChatSlide messages={visual.messages} partId={partId} />;
      case "tool-call":
        return (
          <ToolCallSlide
            tool={visual.tool}
            args={visual.args}
            result={visual.result}
            icon={visual.icon}
            partId={partId}
          />
        );
      case "scene":
        return (
          <SceneSlide
            leftLabel={visual.leftLabel}
            leftLines={visual.leftLines}
            rightLabel={visual.rightLabel}
            rightLines={visual.rightLines}
            partId={partId}
          />
        );
      case "inspiration":
        return (
          <InspirationSlide
            clips={visual.clips}
            tagline={visual.tagline}
            partId={partId}
          />
        );
      case "diagram-arch":
        return <ArchDiagram />;
      case "diagram-lifecycle":
        return <LifecycleDiagram />;
      default:
        return <div>Unknown visual type</div>;
    }
  })();

  return <SlideContainer partId={partId}>{inner}</SlideContainer>;
};
