'use client';

export type ExportFormat = 'pdf' | 'docx';

interface FormatToggleProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
}

export default function FormatToggle({ value, onChange }: FormatToggleProps) {
  const options: Array<{ key: ExportFormat; label: string }> = [
    { key: 'pdf', label: 'PDF' },
    { key: 'docx', label: 'DOCX' },
  ];

  return (
    <div
      className="inline-flex rounded-lg overflow-hidden text-sm"
      style={{ border: '1px solid var(--border)' }}
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className="px-4 py-1.5 font-semibold transition-colors"
          style={{
            background: value === opt.key ? 'var(--drk)' : 'var(--bg-card)',
            color: value === opt.key ? '#fff' : 'var(--text)',
          }}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
