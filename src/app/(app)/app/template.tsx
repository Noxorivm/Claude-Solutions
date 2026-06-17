// Transición de entrada del main entre rutas (R2a): template.tsx se
// re-monta en cada navegación, así que el fade (220ms, motion-safe)
// corre una vez por ruta. View Transitions API queda fuera: en Next 16
// requiere flag experimental (docs/06 §Movimiento).
export default function AppTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="route-fade">{children}</div>;
}
