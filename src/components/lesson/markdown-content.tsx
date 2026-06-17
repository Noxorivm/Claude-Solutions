import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

// Markdown GFM sanitizado (docs/04 §Seguridad: defensa en profundidad
// aunque el contenido lo cree el admin). El schema por defecto de
// rehype-sanitize sigue el modelo de GitHub: tablas y checkboxes de
// listas de tareas ya están permitidos; scripts y handlers, fuera.
export function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <div className="lesson-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
