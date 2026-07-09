'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import './TradingDeskView.css';

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface PositionInfo {
  qty: number;
  avgPrice: number;
}

export interface TradingDeskViewProps {
  priceHistory: PriceHistoryPoint[];
  position: PositionInfo;
  cash: number;
  pnl: number;
  disabled?: boolean;
  buyDisabled?: boolean;
  sellDisabled?: boolean;
  onBuy?: (size: number) => void;
  onSell?: (size: number) => void;
}

const VBW = 1000;
const VBH = 340;
const PAD_L = 64;
const PAD_R = 18;
const PAD_T = 18;
const PAD_B = 30;
const INNER_W = VBW - PAD_L - PAD_R;
const INNER_H = VBH - PAD_T - PAD_B;

function fmt(n: number): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '--';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function AnimatedPnLDisplay({ pnl }: { pnl: number }) {
  const display = useAnimatedNumber(pnl, 450);
  const positive = display >= 0;
  const sign = positive ? '+' : '-';
  return (
    <div
      className={`tdv-mono tdv-pnl-value ${positive ? 'positive' : 'negative'}`}
      key={Math.sign(pnl) !== Math.sign(display) ? 'flip' : 'same'}
    >
      {sign}${fmt(Math.abs(display))}
    </div>
  );
}

export function TradingDeskView({
  priceHistory,
  position,
  cash,
  pnl,
  disabled = false,
  buyDisabled = false,
  sellDisabled = false,
  onBuy,
  onSell,
}: TradingDeskViewProps) {
  const [size, setSize] = useState(1);
  const [priceKey, setPriceKey] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [lineDrawKey, setLineDrawKey] = useState(0);

  const lastPrice = priceHistory.length
    ? priceHistory[priceHistory.length - 1].price
    : null;
  const prevLastPriceRef = useRef<number | null>(null);
  const prevHistoryLen = useRef(priceHistory.length);

  useEffect(() => {
    if (prevLastPriceRef.current !== lastPrice) {
      setPriceKey((k) => k + 1);
      prevLastPriceRef.current = lastPrice;
    }
  }, [lastPrice]);

  useEffect(() => {
    if (priceHistory.length !== prevHistoryLen.current) {
      setLineDrawKey((k) => k + 1);
      prevHistoryLen.current = priceHistory.length;
    }
  }, [priceHistory.length]);

  const chart = useMemo(() => {
    const n = priceHistory.length;
    const prices = priceHistory.map((d) => d.price);
    let min = n ? Math.min(...prices) : 0;
    let max = n ? Math.max(...prices) : 1;
    if (min === max) {
      min -= 1;
      max += 1;
    }

    const xAt = (i: number) =>
      n <= 1 ? PAD_L + INNER_W / 2 : PAD_L + (i / (n - 1)) * INNER_W;
    const yAt = (p: number) => PAD_T + (1 - (p - min) / (max - min)) * INNER_H;

    const pts = priceHistory.map((d, i) => ({ x: xAt(i), y: yAt(d.price) }));
    const linePoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaPoints = n
      ? `${PAD_L.toFixed(1)},${(PAD_T + INNER_H).toFixed(1)} ${linePoints} ${(PAD_L + INNER_W).toFixed(1)},${(PAD_T + INNER_H).toFixed(1)}`
      : '';

    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
      const frac = i / 4;
      const y = PAD_T + frac * INNER_H;
      const price = min + (max - min) * (1 - frac);
      gridLines.push({
        y: y.toFixed(1),
        ty: (y + 3.5).toFixed(1),
        label: fmt(price),
      });
    }

    const xTicks: { x: string; label: string }[] = [];
    if (n) {
      const seen: Record<number, number> = {};
      [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
        const idx = Math.round(f * (n - 1));
        if (seen[idx]) return;
        seen[idx] = 1;
        xTicks.push({
          x: xAt(idx).toFixed(1),
          label: priceHistory[idx].date,
        });
      });
    }

    return { n, pts, linePoints, areaPoints, gridLines, xTicks };
  }, [priceHistory]);

  const pnlPositive = pnl >= 0;
  const lineColor = pnlPositive ? '#4ade80' : '#f87171';
  const lineGlow = pnlPositive ? 'rgba(74,222,128,0.6)' : 'rgba(248,113,113,0.6)';
  const qty = position.qty || 0;

  let hi = hoverIndex;
  if (hi != null && (hi < 0 || hi >= chart.n)) hi = null;
  const hoverActive = hi != null && chart.n > 0;
  const hoverIdx = hoverActive ? hi : null;
  const hoverPt = hoverIdx != null ? chart.pts[hoverIdx] : null;

  const handlePlotMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chart.n) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const px = ((e.clientX - rect.left) / rect.width) * VBW;
    const frac = (px - PAD_L) / INNER_W;
    let idx = Math.round(frac * (chart.n - 1));
    idx = Math.max(0, Math.min(chart.n - 1, idx));
    setHoverIndex(idx);
  };

  const chipVals = [1, 5, 10, 25];

  return (
    <div className="tdv-root">
      <div className="tdv-scanlines" />
      <div className="tdv-scan-beam">
        <div />
      </div>

      <div className="tdv-inner">
        <div className="tdv-header">
          <div className="tdv-header-left">
            <div className="tdv-live-dot" />
            <div className="tdv-pixel tdv-title">TRADING DESK // LIVE FEED</div>
          </div>
          <div className="tdv-header-right">
            <span className="tdv-pixel tdv-last-label">LAST</span>
            {lastPrice !== null && (
              <span key={priceKey} className="tdv-mono tdv-last-price">
                {fmt(lastPrice)}
              </span>
            )}
          </div>
        </div>

        <div className="tdv-grid">
          <div className="tdv-panel">
            <div className="tdv-corner" style={{ top: -1, left: -1, borderTop: '2px solid', borderLeft: '2px solid' }} />
            <div className="tdv-corner" style={{ top: -1, right: -1, borderTop: '2px solid', borderRight: '2px solid' }} />
            <div className="tdv-corner" style={{ bottom: -1, left: -1, borderBottom: '2px solid', borderLeft: '2px solid' }} />
            <div className="tdv-corner" style={{ bottom: -1, right: -1, borderBottom: '2px solid', borderRight: '2px solid' }} />

            <div className="tdv-panel-header">
              <span className="tdv-pixel" style={{ fontSize: 10, color: '#67e8f9' }}>PRICE FEED</span>
              <span className="tdv-pixel" style={{ fontSize: 8, color: '#3f3f46' }}>
                {priceHistory.length} PTS
              </span>
            </div>

            <div className="tdv-chart-wrap">
              <svg
                viewBox={`0 0 ${VBW} ${VBH}`}
                preserveAspectRatio="none"
                className="tdv-chart-svg"
                onMouseMove={handlePlotMove}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {chart.gridLines.map((g, i) => (
                  <g key={i}>
                    <line
                      x1={64}
                      x2={982}
                      y1={g.y}
                      y2={g.y}
                      stroke="#164e63"
                      strokeOpacity={0.35}
                      strokeDasharray="2 6"
                    />
                    <text
                      x={58}
                      y={g.ty}
                      fill="#4b5563"
                      fontSize={11}
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="end"
                    >
                      {g.label}
                    </text>
                  </g>
                ))}
                {chart.xTicks.map((t, i) => (
                  <text
                    key={i}
                    x={t.x}
                    y={332}
                    fill="#4b5563"
                    fontSize={11}
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    {t.label}
                  </text>
                ))}
                {lastPrice !== null && (
                  <>
                    <polygon
                      key={`a${lineDrawKey}`}
                      points={chart.areaPoints}
                      fill={lineColor}
                      fillOpacity={0.06}
                      className="tdv-chart-area"
                    />
                    <polyline
                      key={`l${lineDrawKey}`}
                      points={chart.linePoints}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      className="tdv-chart-line"
                      pathLength={2600}
                      style={{ filter: `drop-shadow(0 0 4px ${lineGlow})` }}
                    />
                    <circle
                      cx={chart.pts[chart.n - 1].x.toFixed(1)}
                      cy={chart.pts[chart.n - 1].y.toFixed(1)}
                      r={3.5}
                      fill={lineColor}
                      stroke="#000"
                      strokeWidth={1}
                      style={{ filter: `drop-shadow(0 0 6px ${lineGlow})` }}
                    />
                  </>
                )}
                {hoverActive && hoverPt && (
                  <>
                    <line
                      x1={hoverPt.x.toFixed(1)}
                      x2={hoverPt.x.toFixed(1)}
                      y1={18}
                      y2={310}
                      stroke="#22d3ee"
                      strokeOpacity={0.5}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={64}
                      x2={982}
                      y1={hoverPt.y.toFixed(1)}
                      y2={hoverPt.y.toFixed(1)}
                      stroke="#22d3ee"
                      strokeOpacity={0.5}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={hoverPt.x.toFixed(1)}
                      cy={hoverPt.y.toFixed(1)}
                      r={4}
                      fill="#22d3ee"
                      stroke="#000"
                      strokeWidth={1}
                    />
                  </>
                )}
              </svg>
              {hoverActive && hoverIdx != null && (
                <div
                  className="tdv-tooltip tdv-mono"
                  style={{
                    left: `${((chart.pts[hoverIdx].x / VBW) * 100).toFixed(2)}%`,
                  }}
                >
                  <span style={{ color: '#67e8f9' }}>{priceHistory[hoverIdx].date}</span>
                  &nbsp;&nbsp;
                  <span style={{ color: lineColor }}>
                    ${fmt(priceHistory[hoverIdx].price)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="tdv-sidebar">
            <div className="tdv-panel">
              <div className="tdv-corner" style={{ top: -1, left: -1, borderTop: '2px solid', borderLeft: '2px solid' }} />
              <div className="tdv-corner" style={{ bottom: -1, right: -1, borderBottom: '2px solid', borderRight: '2px solid' }} />
              <div className="tdv-pixel" style={{ fontSize: 10, color: '#67e8f9', marginBottom: 12 }}>P&amp;L</div>
              <AnimatedPnLDisplay pnl={pnl} />
              <div className="tdv-pixel" style={{ fontSize: 8, color: '#52525b', marginTop: 8 }}>
                {pnlPositive ? 'UNREALIZED GAIN' : 'UNREALIZED LOSS'}
              </div>
            </div>

            <div className="tdv-stats-grid">
              <div className="tdv-stat-box">
                <div className="tdv-pixel tdv-stat-label">POSITION</div>
                <div className="tdv-mono tdv-stat-value">
                  {(qty > 0 ? '+' : '') + qty + ' SH'}
                </div>
                <div className="tdv-mono tdv-stat-sub">
                  AVG ${fmt(position.avgPrice || 0)}
                </div>
              </div>
              <div className="tdv-stat-box">
                <div className="tdv-pixel tdv-stat-label">CASH</div>
                <div className="tdv-mono tdv-stat-value">${fmt(cash)}</div>
                <div className="tdv-mono tdv-stat-sub">BUYING PWR</div>
              </div>
            </div>

            <div className="tdv-panel tdv-order-panel">
              <div className="tdv-corner" style={{ top: -1, left: -1, borderTop: '2px solid', borderLeft: '2px solid' }} />
              <div className="tdv-corner" style={{ top: -1, right: -1, borderTop: '2px solid', borderRight: '2px solid' }} />
              <div className="tdv-pixel" style={{ fontSize: 10, color: '#67e8f9' }}>ORDER TICKET</div>

              <div>
                <div className="tdv-pixel tdv-stat-label">SIZE</div>
                <input
                  className="tdv-size-input"
                  type="number"
                  min={0}
                  step={1}
                  value={size}
                  disabled={disabled}
                  onChange={(e) => setSize(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>

              <div className="tdv-size-chips">
                {chipVals.map((v) => (
                  <motion.button
                    key={v}
                    type="button"
                    className={`tdv-chip ${size === v ? 'active' : ''}`}
                    disabled={disabled}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSize(v)}
                  >
                    x{v}
                  </motion.button>
                ))}
              </div>

              <div className="tdv-trade-buttons">
                <motion.button
                  type="button"
                  className="tdv-btn-buy"
                  disabled={disabled || buyDisabled || size <= 0}
                  whileTap={disabled || buyDisabled || size <= 0 ? undefined : { scale: 0.93 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  onClick={() => onBuy?.(size)}
                >
                  BUY
                </motion.button>
                <motion.button
                  type="button"
                  className="tdv-btn-sell"
                  disabled={disabled || sellDisabled || size <= 0 || qty <= 0}
                  whileTap={
                    disabled || sellDisabled || size <= 0 || qty <= 0
                      ? undefined
                      : { scale: 0.93 }
                  }
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  onClick={() => onSell?.(size)}
                >
                  SELL
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
