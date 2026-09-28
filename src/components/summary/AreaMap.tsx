/**
 * แผนผังพื้นที่รับผิดชอบ — ER อยู่กลาง แตกเส้นประไปแต่ละตำบล
 * วงกลมโตตามจำนวนเคส (ไม่ใช่แผนที่ตามพิกัดจริง เป็นผังความสัมพันธ์)
 */
const PALETTE = [
  "#146aa8",
  "#5c9a1e",
  "#e08a2c",
  "#7b3fa0",
  "#c0392b",
  "#16a085",
  "#2f8fd1",
  "#b8590f",
  "#8bd13c",
  "#a561c9",
  "#e74c3c",
];

export default function AreaMap({
  areas,
  counts,
}: {
  areas: string[];
  counts: Record<string, number>;
}) {
  if (areas.length === 0) return null;

  const cx = 320;
  const cy = 320;
  const radius = 205;
  const max = Math.max(1, ...areas.map((a) => counts[a] ?? 0));

  const points = areas.map((area, i) => {
    const angle = ((-90 + (360 / areas.length) * i) * Math.PI) / 180;
    const count = counts[area] ?? 0;
    return {
      area,
      count,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      r: 21 + (count / max) * 19,
      color: PALETTE[i % PALETTE.length],
    };
  });

  return (
    <svg
      viewBox="0 0 640 620"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="จำนวนเคสแยกตามตำบล"
      className="mx-auto block h-auto w-full max-w-[520px]"
    >
      {points.map((p) => (
        <line
          key={`l-${p.area}`}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="#c3ceda"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
      ))}

      <circle cx={cx} cy={cy} r={44} fill="#0a2e4d" />
      <text
        x={cx}
        y={cy - 3}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fill="#fff"
      >
        🚑 ER
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" fontSize={10.5} fill="#cfe3f5">
        รพ.นครไทย
      </text>

      {points.map((p) => (
        <g key={p.area}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={p.color}
            opacity={0.93}
            stroke="#fff"
            strokeWidth={2}
          />
          <text
            x={p.x}
            y={p.y + 5}
            textAnchor="middle"
            fontSize={15}
            fontWeight={800}
            fill="#fff"
          >
            {p.count}
          </text>
          <text
            x={p.x}
            y={p.y < cy - 5 ? p.y - p.r - 10 : p.y + p.r + 17}
            textAnchor="middle"
            fontSize={12.5}
            fontWeight={600}
            fill="#1f2430"
          >
            {p.area}
          </text>
        </g>
      ))}
    </svg>
  );
}
