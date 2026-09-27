import './StatusBadge.css';

const STATUS_CONFIG = {
  DONE: { label: 'Done', className: 'status-done' },
  ONGOING: { label: 'Ongoing', className: 'status-ongoing' },
  PLANNED: { label: 'Planned', className: 'status-planned' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PLANNED;

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
