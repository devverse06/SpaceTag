import type { SpaceAnnotations } from "@/lib/types";
import { TagList } from "./TagList";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">{title}</h3>
      {children}
    </section>
  );
}

export function AnnotationPanel({ annotations }: { annotations: SpaceAnnotations }) {
  return (
    <div className="space-y-6">
      <Section title="Room type">
        <TagList tags={[annotations.roomType]} variant="outline" />
      </Section>
      <Section title="Furniture">
        <TagList tags={annotations.furniture} />
      </Section>
      <Section title="Materials">
        <TagList tags={annotations.materials} />
      </Section>
      <Section title="Lighting">
        <p className="text-sm leading-relaxed text-stone-700">{annotations.lightingStyle}</p>
      </Section>
      <Section title="Color palette">
        <TagList tags={annotations.colorPalette} variant="outline" />
      </Section>
    </div>
  );
}
