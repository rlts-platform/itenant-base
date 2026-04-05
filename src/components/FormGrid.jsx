export default function FormGrid({ children, className = "" }) {
  return (
    <div className={`form-grid-2col ${className}`}>
      {children}
    </div>
  );
}