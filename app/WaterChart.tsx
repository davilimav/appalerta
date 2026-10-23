
"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Reading = {
  time: string;
  level: number;
  timestamp: number;
};

export default function WaterChart() {
  const [readings, setReadings] = useState<Reading[]>([]);

  useEffect(() => {
    let active = true;

    async function getReading() {
      try {
        const response = await fetch("/api/telemetry", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();
        if (!active || !data.device) return;

        const level = Number(data.device.water_depth_cm);
        const timestamp = Number(data.device.last_seen_at);

        if (
          !Number.isFinite(level) ||
          !Number.isFinite(timestamp) ||
          timestamp <= 0
        ) {
          return;
        }

        const reading: Reading = {
          time: new Date(timestamp).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          level,
          timestamp,
        };

        setReadings((previous) => {
          // Ignora uma leitura que já foi registrada.
          if (previous.some((item) => item.timestamp === timestamp)) {
            return previous;
          }

          // Mantém somente as 30 leituras mais recentes.
          return [...previous, reading].slice(-30);
        });
      } catch (error) {
        console.error("Erro ao buscar leitura:", error);
      }
    }

    void getReading();

    const interval = window.setInterval(() => {
      void getReading();
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="text-lg font-semibold text-white">
        Histórico do nível da água
      </h2>

      <p className="mb-5 mt-1 text-sm text-slate-400">
        Últimas 30 leituras recebidas do dispositivo
      </p>

      {readings.length < 2 ? (
        <div className="flex h-72 items-center justify-center text-center text-slate-400">
          Aguardando uma nova leitura do dispositivo...
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={readings}>
              <CartesianGrid
                stroke="#334155"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                minTickGap={25}
              />

              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                width={55}
                unit=" cm"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#07111f",
                  border: "1px solid #334155",
                  borderRadius: 10,
                  color: "#fff",
                }}
                formatter={(value) => [
                  `${String(value)} cm`,
                  "Nível da água",
                ]}
              />

              <Line
                type="monotone"
                dataKey="level"
                name="Nível da água"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: "#38bdf8" }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}