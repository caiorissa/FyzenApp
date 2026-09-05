export default function Navbar({
  items = [],
  active,
  onSelect,
  className = "",
}) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="Navegação principal"
      className={`sidebar-nav ${className}`}
    >
      {items.map(({ icon: Icon, ...item }) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onSelect?.(item.value)}
          aria-current={active === item.value ? "page" : undefined}
          className={`nav-item ${active === item.value ? "is-active" : ""}`}
        >
          {Icon && <Icon size={19} aria-hidden="true" />}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
