export default function Empty({ title, text }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      <p className="muted">{text}</p>
    </div>
  );
}
