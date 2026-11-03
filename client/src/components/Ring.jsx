export default function Ring({ value, color = '#0E7C86', caption = '', size = 'h-32 w-32' }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 120 120" className={size}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#E3E8EF" strokeWidth="12" />
      <circle
        cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 60 60)"
      />
      <text x="60" y={caption ? 64 : 68} textAnchor="middle" fontSize="30" fontWeight="700" fill="#0f172a">
        {value}
      </text>
      {caption && (
        <text x="60" y="84" textAnchor="middle" fontSize="11" fill="#64748b">{caption}</text>
      )}
    </svg>
  )
}