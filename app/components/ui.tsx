import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Copy, LoaderCircle } from "lucide-react";

export type ButtonKind = "primary" | "secondary" | "ghost";

export function TableRow({
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props}>{children}</tr>;
}

export function Button({
  children,
  kind = "secondary",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: ButtonKind;
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`button ${kind} ${className}`}
    >
      {loading && (
        <LoaderCircle size={16} className="spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export function Badge({ tier }: { tier: string }) {
  return (
    <span className={`badge ${tier.toLowerCase()}`}>
      <span aria-hidden="true" />
      {tier}
    </span>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input(props, ref) {
  return <input {...props} ref={ref} />;
});

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="skeleton-table"
      role="status"
      aria-label="Data sedang dimuat"
    >
      <span className="sr-only">Data sedang dimuat</span>
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton-row" key={i} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function CodeBlock({
  code,
  onCopy,
  label = "Contoh kode",
}: {
  code: string;
  onCopy: () => void;
  label?: string;
}) {
  return (
    <Card className="code-panel">
      <div className="code-block-heading">
        <span>{label}</span>
        <Button kind="ghost" aria-label={`Salin ${label}`} onClick={onCopy}>
          <Copy size={16} />
          Salin
        </Button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </Card>
  );
}

export default Button;
