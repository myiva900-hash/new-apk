import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity, ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import { ConnectionStatus } from '../types/vpn';
import { LiveTunnelStats } from '../services/vpnBridge';

export interface ThroughputSample {
  seq: number;
  timestampMs: number;
  rxSpeed: number; // bytes per second
  txSpeed: number; // bytes per second
}

interface ThroughputChartProps {
  status: ConnectionStatus;
  stats: LiveTunnelStats;
}

const MAX_SAMPLES = 30;

function formatSpeed(bytesPerSec: number): string {
  if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return '0 B/s';
  if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
}

export const ThroughputChart: React.FC<ThroughputChartProps> = ({ status, stats }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [samples, setSamples] = useState<ThroughputSample[]>([]);
  const [chartWidth, setChartWidth] = useState<number>(380);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const seqRef = useRef(0);
  const prevStatusRef = useRef<ConnectionStatus>(status);
  const lastTotalsRef = useRef<{ rxBytes: number; txBytes: number; ts: number }>({
    rxBytes: stats.rxBytes,
    txBytes: stats.txBytes,
    ts: Date.now(),
  });
  const latestStatsRef = useRef(stats);
  latestStatsRef.current = stats;

  // Responsive width observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const next = Math.max(240, Math.floor(el.clientWidth));
      setChartWidth(next);
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Start fresh trace when entering a new active tunnel session
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (status === 'connected' && prev !== 'connected') {
      seqRef.current = 0;
      lastTotalsRef.current = {
        rxBytes: stats.rxBytes,
        txBytes: stats.txBytes,
        ts: Date.now(),
      };
      setSamples([
        {
          seq: 0,
          timestampMs: Date.now(),
          rxSpeed: Math.max(0, stats.rxSpeed || 0),
          txSpeed: Math.max(0, stats.txSpeed || 0),
        },
      ]);
      setHoverIndex(null);
    }
    prevStatusRef.current = status;
  }, [status, stats.rxBytes, stats.txBytes, stats.rxSpeed, stats.txSpeed]);

  // Sample real throughput once per second while tunnel is connected
  useEffect(() => {
    if (status !== 'connected') return;

    const tick = () => {
      const current = latestStatsRef.current;
      const now = Date.now();
      const prevTotals = lastTotalsRef.current;
      const elapsedSec = Math.max(0.25, (now - prevTotals.ts) / 1000);

      // Prefer GoBackend per-second speed; fallback to cumulative byte delta
      const deltaRx = Math.max(0, current.rxBytes - prevTotals.rxBytes) / elapsedSec;
      const deltaTx = Math.max(0, current.txBytes - prevTotals.txBytes) / elapsedSec;

      const rxSpeed = current.rxSpeed > 0 ? current.rxSpeed : deltaRx;
      const txSpeed = current.txSpeed > 0 ? current.txSpeed : deltaTx;

      lastTotalsRef.current = {
        rxBytes: current.rxBytes,
        txBytes: current.txBytes,
        ts: now,
      };

      seqRef.current += 1;
      const point: ThroughputSample = {
        seq: seqRef.current,
        timestampMs: now,
        rxSpeed: Math.max(0, rxSpeed),
        txSpeed: Math.max(0, txSpeed),
      };

      setSamples(prev => [...prev.slice(-(MAX_SAMPLES - 1)), point]);
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const isConnected = status === 'connected';
  const latestSample = samples.length > 0 ? samples[samples.length - 1] : null;
  const activeSample =
    hoverIndex !== null && samples[hoverIndex] ? samples[hoverIndex] : latestSample;

  const peakRx = samples.reduce((m, s) => Math.max(m, s.rxSpeed), 0);
  const peakTx = samples.reduce((m, s) => Math.max(m, s.txSpeed), 0);

  // D3.js rendering pipeline
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = chartWidth;
    const height = 148;
    const margin = { top: 12, right: 10, bottom: 22, left: 48 };
    const innerWidth = Math.max(120, width - margin.left - margin.right);
    const innerHeight = Math.max(60, height - margin.top - margin.bottom);

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'none');

    const defs = svg.append('defs');

    const rxGrad = defs
      .append('linearGradient')
      .attr('id', 'myv-rx-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    rxGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10B981').attr('stop-opacity', 0.36);
    rxGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10B981').attr('stop-opacity', 0.02);

    const txGrad = defs
      .append('linearGradient')
      .attr('id', 'myv-tx-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    txGrad.append('stop').attr('offset', '0%').attr('stop-color', '#06B6D4').attr('stop-opacity', 0.28);
    txGrad.append('stop').attr('offset', '100%').attr('stop-color', '#06B6D4').attr('stop-opacity', 0.02);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const plotData: ThroughputSample[] =
      samples.length >= 2
        ? samples
        : samples.length === 1
        ? [
            { ...samples[0], seq: Math.max(0, samples[0].seq - 1), rxSpeed: 0, txSpeed: 0 },
            samples[0],
          ]
        : [
            { seq: 0, timestampMs: Date.now() - 1000, rxSpeed: 0, txSpeed: 0 },
            { seq: 1, timestampMs: Date.now(), rxSpeed: 0, txSpeed: 0 },
          ];

    const minSeq = plotData[0].seq;
    const maxSeq = Math.max(minSeq + 1, plotData[plotData.length - 1].seq);
    const maxObserved = d3.max(plotData, d => Math.max(d.rxSpeed, d.txSpeed)) || 0;
    const yMax = Math.max(1024, maxObserved * 1.25);

    const xScale = d3.scaleLinear().domain([minSeq, maxSeq]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, yMax]).nice(3).range([innerHeight, 0]);

    // Horizontal subtle gridlines
    const yTicks = yScale.ticks(3);
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yTicks)
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.14)
      .attr('stroke-dasharray', '3 3');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(3)
      .tickSize(0)
      .tickPadding(6)
      .tickFormat(d => {
        const val = Number(d);
        if (val === 0) return '0';
        if (val < 1024) return `${Math.round(val)}B`;
        if (val < 1024 * 1024) return `${Math.round(val / 1024)}K`;
        return `${(val / (1024 * 1024)).toFixed(1)}M`;
      });

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup
      .selectAll('text')
      .attr('fill', 'currentColor')
      .attr('opacity', 0.65)
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace');

    // X Axis time offsets (-30s .. Now)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(4)
      .tickSize(0)
      .tickPadding(6)
      .tickFormat(d => {
        const delta = Math.round(Number(d) - maxSeq);
        return delta === 0 ? 'Now' : `${delta}s`;
      });

    const xAxisGroup = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(xAxis);
    xAxisGroup.select('.domain').attr('stroke', 'currentColor').attr('stroke-opacity', 0.18);
    xAxisGroup
      .selectAll('text')
      .attr('fill', 'currentColor')
      .attr('opacity', 0.6)
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace');

    if (samples.length > 0) {
      const rxArea = d3
        .area<ThroughputSample>()
        .x(d => xScale(d.seq))
        .y0(innerHeight)
        .y1(d => yScale(d.rxSpeed))
        .curve(d3.curveMonotoneX);

      const txArea = d3
        .area<ThroughputSample>()
        .x(d => xScale(d.seq))
        .y0(innerHeight)
        .y1(d => yScale(d.txSpeed))
        .curve(d3.curveMonotoneX);

      const rxLine = d3
        .line<ThroughputSample>()
        .x(d => xScale(d.seq))
        .y(d => yScale(d.rxSpeed))
        .curve(d3.curveMonotoneX);

      const txLine = d3
        .line<ThroughputSample>()
        .x(d => xScale(d.seq))
        .y(d => yScale(d.txSpeed))
        .curve(d3.curveMonotoneX);

      g.append('path').datum(plotData).attr('fill', 'url(#myv-rx-gradient)').attr('d', rxArea);
      g.append('path').datum(plotData).attr('fill', 'url(#myv-tx-gradient)').attr('d', txArea);

      g.append('path')
        .datum(plotData)
        .attr('fill', 'none')
        .attr('stroke', '#10B981')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('d', rxLine);

      g.append('path')
        .datum(plotData)
        .attr('fill', 'none')
        .attr('stroke', '#06B6D4')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('d', txLine);

      // Latest or hovered sample highlight markers
      const focusIdx =
        hoverIndex !== null && hoverIndex >= 0 && hoverIndex < samples.length
          ? hoverIndex
          : samples.length - 1;
      const focusPoint = samples[focusIdx];

      if (focusPoint) {
        const fx = xScale(focusPoint.seq);

        if (hoverIndex !== null) {
          g.append('line')
            .attr('x1', fx)
            .attr('x2', fx)
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', '#FBBF24')
            .attr('stroke-opacity', 0.55)
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2 2');
        }

        g.append('circle')
          .attr('cx', fx)
          .attr('cy', yScale(focusPoint.rxSpeed))
          .attr('r', 3.5)
          .attr('fill', '#10B981')
          .attr('stroke', '#050B1A')
          .attr('stroke-width', 1.5);

        g.append('circle')
          .attr('cx', fx)
          .attr('cy', yScale(focusPoint.txSpeed))
          .attr('r', 3.5)
          .attr('fill', '#06B6D4')
          .attr('stroke', '#050B1A')
          .attr('stroke-width', 1.5);
      }

      // Interactive pointer overlay for scrubbing exact throughput values
      const bisect = d3.bisector<ThroughputSample, number>(d => d.seq).center;
      g.append('rect')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .style('cursor', 'crosshair')
        .on('pointermove', (event: PointerEvent) => {
          const [px] = d3.pointer(event);
          const targetSeq = xScale.invert(px);
          const idx = bisect(samples, targetSeq);
          setHoverIndex(Math.max(0, Math.min(samples.length - 1, idx)));
        })
        .on('pointerleave', () => setHoverIndex(null));
    }
  }, [samples, chartWidth, hoverIndex]);

  return (
    <div className="mt-2.5 pt-3 border-t border-slate-100 dark:border-blue-500/20 select-none">
      {/* Header Row: Title + Live/Idle State + Legend */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Activity className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
          <span className="text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-200 truncate">
            Live Tunnel Throughput
          </span>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
            · {isConnected ? 'Streaming' : samples.length > 0 ? 'Last Session' : 'Standby'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[10px] font-mono tabular-nums shrink-0">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-[#10B981] font-bold">
            <ArrowDown className="w-3 h-3" />
            {formatSpeed(activeSample?.rxSpeed ?? 0)}
          </span>
          <span className="flex items-center gap-1 text-cyan-600 dark:text-[#06B6D4] font-bold">
            <ArrowUp className="w-3 h-3" />
            {formatSpeed(activeSample?.txSpeed ?? 0)}
          </span>
          {!isConnected && samples.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSamples([]);
                setHoverIndex(null);
              }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
              title="Clear throughput trace"
              aria-label="Clear throughput trace"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* D3 SVG Viewport */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl bg-slate-50/90 dark:bg-[#030712]/80 border border-slate-200/80 dark:border-blue-500/25 px-1.5 pt-1.5 pb-1 text-slate-600 dark:text-slate-300"
      >
        <svg ref={svgRef} className="w-full h-[148px] block overflow-visible" role="img" aria-label="WireGuard upload and download throughput chart" />

        {samples.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center pointer-events-none">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Waiting for active WireGuard tunnel
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Connect WireGuard to plot real-time RX / TX speeds
            </span>
          </div>
        )}
      </div>

      {/* Quiet Sub-Legend & Peak Telemetry Row */}
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 px-0.5">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 rounded bg-[#10B981] inline-block" />
            <span>Download (RX)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 rounded bg-[#06B6D4] inline-block" />
            <span>Upload (TX)</span>
          </span>
        </div>

        <div>
          Peak: {formatSpeed(peakRx)} ↓ / {formatSpeed(peakTx)} ↑
        </div>
      </div>
    </div>
  );
};
