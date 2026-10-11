import { useState, useMemo } from "react";
import { Order } from "../../api";

interface CakeChartProps {
  orders: Order[];
}

interface MonthData {
  key: string;
  label: string;
  shortLabel: string;
  sales: number;
  isCurrentMonth: boolean;
}

const DRIPS = [10, 22, 14, 26, 12, 20, 16, 28, 12, 22, 15, 24, 11, 20];
const SPR_COLS = ["#FFF7EC", "#FFB3C7", "#3DB88C", "#FFB482"];

export default function CakeChart({ orders }: CakeChartProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const defaultNote =
    "Each tier is one month. Tap or hover a tier to see its share of your sales.";

  const { months, totalSales, maxSales } = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      if (order.status === "Pending" && order.payment_status === "Not Paid") return acc;
      const d = new Date(order.order_date);
      const year = d.getFullYear();
      const monthNum = d.getMonth();
      const key = `${year}-${String(monthNum + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-IN", { month: "short", year: "numeric" });
      const shortLabel = d.toLocaleString("en-IN", { month: "short" });

      if (!acc[key]) {
        acc[key] = {
          key,
          label,
          shortLabel,
          sales: 0,
          isCurrentMonth: false,
        };
      }
      acc[key].sales += order.price;
      return acc;
    }, {} as Record<string, MonthData>);

    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Ensure at least current month is represented if nothing exists
    if (!grouped[currentKey]) {
      const curLabel = now.toLocaleString("en-IN", { month: "short", year: "numeric" });
      const curShort = now.toLocaleString("en-IN", { month: "short" });
      grouped[currentKey] = {
        key: currentKey,
        label: curLabel,
        shortLabel: curShort,
        sales: 0,
        isCurrentMonth: true,
      };
    } else {
      grouped[currentKey].isCurrentMonth = true;
    }

    // Sort chronologically and take latest 2-3 months
    const sorted = Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));
    const latest = sorted.slice(-3); // latest 2 or 3 months

    const total = latest.reduce((sum, m) => sum + m.sales, 0) || 1;
    const max = Math.max(...latest.map((m) => m.sales), 1);

    return { months: latest, totalSales: total, maxSales: max };
  }, [orders]);

  const W = 260;
  const cx = 150;

  // Layout geometries based on number of tiers (1, 2, or 3)
  const tierConfigs = useMemo(() => {
    const count = months.length;
    if (count === 1) {
      return [
        {
          cls: "t1",
          y: 160,
          hgt: 130,
          fill: "var(--hero)",
          textFill: "#FFFFFF",
          amtSize: 24,
        },
      ];
    }
    if (count === 2) {
      return [
        {
          cls: "t1",
          y: 190,
          hgt: 100,
          fill: "var(--hero-alt)",
          textFill: "#FFFFFF",
          amtSize: 24,
        },
        {
          cls: "t2",
          y: 110,
          hgt: 80,
          fill: "var(--petal)",
          textFill: "#4A0D26",
          amtSize: 18,
        },
      ];
    }
    // 3 tiers
    return [
      {
        cls: "t1",
        y: 210,
        hgt: 80,
        fill: "var(--hero)",
        textFill: "#FFFFFF",
        amtSize: 20,
      },
      {
        cls: "t2",
        y: 145,
        hgt: 65,
        fill: "var(--hero-alt)",
        textFill: "#FFFFFF",
        amtSize: 18,
      },
      {
        cls: "t3",
        y: 90,
        hgt: 55,
        fill: "var(--petal)",
        textFill: "#4A0D26",
        amtSize: 16,
      },
    ];
  }, [months.length]);

  const topTierY = tierConfigs[tierConfigs.length - 1]?.y ?? 110;
  const cherryY = topTierY - 12;

  const pct = (val: number) => Math.round((val / totalSales) * 100);

  // Seeded sprinkles inside tier body for visual delight
  const tierSprinkles = useMemo(() => {
    let seed = 19;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: 14 }).map((_, k) => {
      const side = k % 2 ? 1 : -1;
      const sx = cx + side * (60 + rnd() * (W / 2 - 70));
      const syOffset = 38 + rnd() * 32;
      const col = SPR_COLS[k % SPR_COLS.length];
      const rot = Math.round(rnd() * 180);
      return { sx, syOffset, col, rot };
    });
  }, []);

  return (
    <section className="card cake">
      <h3>Sales by month</h3>
      <p className="hint">Your sales, stacked like a cake</p>

      <div className="cake-art">
        <svg
          id="cake"
          viewBox="0 0 300 320"
          role="group"
          aria-label="Stacked sales cake chart"
        >
          {/* Plate */}
          <ellipse cx={cx} cy={296} rx={142} ry={14} fill="var(--plate)" />
          <rect
            x={cx - 14}
            y={300}
            width={28}
            height={8}
            rx={3}
            fill="var(--plate)"
          />

          {/* Tiers */}
          {months.map((m, idx) => {
            const cfg = tierConfigs[idx];
            if (!cfg) return null;
            const w = Math.max(70, Math.round(W * (m.sales / maxSales)));
            const x = cx - w / 2;
            const nDrips = Math.max(4, Math.round(w / 16));
            const step = w / nDrips;
            const labelStr = `${m.label}, ${Math.round(m.sales).toLocaleString(
              "en-IN"
            )} rupees`;
            const noteStr = `${m.label}${
              m.isCurrentMonth ? " so far" : ""
            }: ₹${Math.round(m.sales).toLocaleString("en-IN")}, which is ${pct(
              m.sales
            )}% of all sales shown.`;

            return (
              <g
                key={m.key}
                className={`t ${cfg.cls}`}
                tabIndex={0}
                role="img"
                aria-label={labelStr}
                onMouseEnter={() => setActiveNote(noteStr)}
                onMouseLeave={() => setActiveNote(null)}
                onFocus={() => setActiveNote(noteStr)}
                onBlur={() => setActiveNote(null)}
                onClick={() => setActiveNote(noteStr)}
              >
                {/* Tier Body */}
                <rect
                  x={x}
                  y={cfg.y}
                  width={w}
                  height={cfg.hgt}
                  rx={14}
                  fill={cfg.fill}
                />

                {/* Frosting top ribbon */}
                <rect
                  x={x}
                  y={cfg.y}
                  width={w}
                  height={12}
                  rx={6}
                  fill="var(--frost)"
                />

                {/* Frosting drips */}
                {Array.from({ length: nDrips }).map((_, i) => {
                  const dh = DRIPS[i % DRIPS.length] * 0.8;
                  return (
                    <rect
                      key={i}
                      x={x + i * step + step * 0.2}
                      y={cfg.y + 6}
                      width={step * 0.6}
                      height={12 + dh}
                      rx={step * 0.3}
                      fill="var(--frost)"
                    />
                  );
                })}

                {/* Sprinkles on taller tier */}
                {cfg.hgt > 75 &&
                  tierSprinkles.map((sp, k) => (
                    <rect
                      key={k}
                      x={sp.sx}
                      y={cfg.y + sp.syOffset}
                      width={4}
                      height={11}
                      rx={2}
                      fill={sp.col}
                      transform={`rotate(${sp.rot} ${sp.sx} ${cfg.y + sp.syOffset})`}
                    />
                  ))}

                {/* Month text label */}
                <text
                  x={cx}
                  y={cfg.y + cfg.hgt - (cfg.hgt > 75 ? 46 : 30)}
                  textAnchor="middle"
                  fontSize={cfg.hgt > 75 ? 14 : 12}
                  fill={cfg.textFill}
                  opacity={0.92}
                >
                  {cfg.hgt > 75 ? m.label : m.shortLabel}
                </text>

                {/* Month amount */}
                <text
                  x={cx}
                  y={cfg.y + cfg.hgt - (cfg.hgt > 75 ? 18 : 12)}
                  textAnchor="middle"
                  fontSize={cfg.amtSize}
                  fill={cfg.textFill}
                >
                  ₹{Math.round(m.sales).toLocaleString("en-IN")}
                </text>
              </g>
            );
          })}

          {/* Cherry on top of the uppermost tier */}
          <g className="cherry">
            <path
              d={`M150 ${cherryY + 2}c2-14 8-20 18-24`}
              fill="none"
              stroke="#4A0D26"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <circle cx={150} cy={cherryY + 8} r={11} fill="#C0123F" />
            <circle cx={146} cy={cherryY + 4} r={3} fill="#fff" opacity={0.55} />
          </g>
        </svg>
      </div>

      {/* Legend */}
      <ul className="legend">
        {months.map((m, idx) => {
          const cfg = tierConfigs[idx];
          return (
            <li key={m.key}>
              <span
                className="sw"
                style={{ background: cfg ? cfg.fill : "var(--petal)" }}
              />
              {m.label} {m.isCurrentMonth && <em>so far</em>}
              <b>₹{Math.round(m.sales).toLocaleString("en-IN")}</b>
            </li>
          );
        })}
      </ul>

      <p className="cake-note" id="readout" aria-live="polite">
        {activeNote || defaultNote}
      </p>
    </section>
  );
}
