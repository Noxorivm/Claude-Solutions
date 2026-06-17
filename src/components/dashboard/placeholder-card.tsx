// Estado vacío honesto (docs/06 §microcopy): orienta sin datos falsos.
export function PlaceholderCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed bg-card/50 p-5">
      <h2 className="heading-eyebrow">{title}</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">{message}</p>
    </section>
  );
}
