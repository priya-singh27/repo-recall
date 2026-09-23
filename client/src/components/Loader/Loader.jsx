import "./Loader.css";

export default function Loader({ label }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader__spin" aria-hidden="true" />
      {label ? <span className="loader__label">{label}</span> : null}
    </div>
  );
}
