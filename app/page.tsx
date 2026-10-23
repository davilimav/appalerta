
"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Cpu,
  Gauge,
  Radio,
  Waves,
  Wifi,
  WifiOff,
  CircleAlert,
} from "lucide-react";
import WaterChart from "./WaterChart";

type Telemetry = {
  distance_cm: number;
  water_depth_cm: number;
  rise_rate_cm_min: number;
  alert: "normal" | "attention" | "alert" | "danger" | "critical" | "sensor_fault";
  trend: "stable" | "rising" | "rising_fast" | "falling";
  sensor_ok: boolean;
  wifi_rssi: number;
  firmware_version: string;
  last_seen_at: number;
};

const alertLabels: Record<Telemetry["alert"], string> = {
  normal: "NORMAL",
  attention: "ATENÇÃO",
  alert: "ALERTA",
  danger: "PERIGO",
  critical: "CRÍTICO",
  sensor_fault: "FALHA NO SENSOR",
};

const trendLabels: Record<Telemetry["trend"], string> = {
  stable: "Estável",
  rising: "Subindo",
  rising_fast: "Subindo rapidamente",
  falling: "Descendo",
};

const alertColors: Record<Telemetry["alert"], string> = {
  normal: "#34d399",
  attention: "#facc15",
  alert: "#fb923c",
  danger: "#fb7185",
  critical: "#f43f5e",
  sensor_fault: "#c084fc",
};

const panel =
  "min-w-0 rounded-2xl border border-[#1e334b] bg-[#0d1b2d]/90 p-5 shadow-lg shadow-black/10 transition-all duration-300 hover:border-cyan-400/30 sm:p-6";

export default function Home() {
  const [device, setDevice] = useState<Telemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;

    async function loadTelemetry() {
      try {
        const response = await fetch("/api/telemetry", {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Falha na API");

        const data = await response.json();

        if (active) {
          setDevice(data.device);
          setApiError(false);
        }
      } catch {
        if (active) setApiError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTelemetry();
    const poll = window.setInterval(loadTelemetry, 2000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, []);

  const age = device
    ? Math.max(0, (now - device.last_seen_at) / 1000)
    : null;

  const online = age !== null && age < 15;
  const color = device ? alertColors[device.alert] : "#64748b";
  const status = device ? alertLabels[device.alert] : "SEM LEITURAS";

  const TrendIcon =
    device?.trend === "falling"
      ? ArrowDown
      : device?.trend === "stable"
        ? Activity
        : ArrowUp;

  const isCritical =
    device?.alert === "danger" || device?.alert === "critical";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] px-4 py-6 text-slate-100 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-500/[0.07] blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
              <Waves size={30} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300 sm:text-sm">
                Sistema de monitoramento IoT
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
                Monitor de Alagamento
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Acompanhe o nível da água e os alertas do dispositivo.
              </p>
            </div>
          </div>

          <div
            className={`flex w-fit shrink-0 items-center gap-3 rounded-xl border px-4 py-3 ${
              online
                ? "border-emerald-400/20 bg-emerald-400/[0.07]"
                : "border-slate-500/20 bg-slate-500/[0.07]"
            }`}
          >
            <span className="relative flex h-3 w-3">
              {online && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              )}
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${
                  online ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
            </span>

            {online ? (
              <Wifi size={18} className="text-emerald-300" />
            ) : (
              <WifiOff size={18} className="text-slate-400" />
            )}

            <div>
              <p className="text-xs text-slate-400">Conexão do dispositivo</p>
              <p
                className={`text-sm font-bold ${
                  online ? "text-emerald-300" : "text-slate-300"
                }`}
              >
                {online ? "ESP32 ONLINE" : "ESP32 OFFLINE"}
              </p>
            </div>
          </div>
        </header>

        {apiError && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
            <CircleAlert size={20} className="shrink-0" />
            Não foi possível consultar a API. Confira o terminal do VS Code.
          </div>
        )}

        <section className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Cartão do nível da água */}
          <article className={`${panel} ar-animate`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Nível da água
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Profundidade monitorada
                </p>
              </div>

              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                <Gauge size={23} />
              </div>
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="break-all text-5xl font-bold tracking-tight sm:text-6xl">
                {device ? device.water_depth_cm.toFixed(1) : "--"}
              </span>
              <span className="text-lg text-slate-400">cm</span>
            </div>

            <div
              className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-label="Nível relativo da água"
              aria-valuemin={0}
              aria-valuemax={30}
              aria-valuenow={
                device
                  ? Math.min(Math.max(device.water_depth_cm, 0), 30)
                  : 0
              }
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${
                    device
                      ? Math.min(
                          Math.max(device.water_depth_cm, 0) / 30 * 100,
                          100
                        )
                      : 0
                  }%`,
                  backgroundColor: color,
                  boxShadow: `0 0 14px ${color}55`,
                }}
              />
            </div>

            <div className="mt-3 flex justify-between text-xs text-slate-500">
              <span>0 cm</span>
              <span>15 cm</span>
              <span>30 cm</span>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
              <div
                className="rounded-lg p-2"
                style={{ color, backgroundColor: `${color}15` }}
              >
                <TrendIcon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200">
                  {device ? trendLabels[device.trend] : "Aguardando leitura"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Variação:{" "}
                  {device
                    ? `${device.rise_rate_cm_min >= 0 ? "+" : ""}${device.rise_rate_cm_min.toFixed(1)} cm/min`
                    : "--"}
                </p>
              </div>
            </div>
          </article>

          {/* Cartão de situação e risco */}
          <article
            className={`${panel} ar-animate`}
            style={{ animationDelay: "80ms" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Situação atual
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Estado informado pelo dispositivo
                </p>
              </div>

              <div
                className="rounded-xl p-3"
                style={{ color, backgroundColor: `${color}15` }}
              >
                {device?.alert === "normal" ? (
                  <CheckCircle2 size={23} />
                ) : device?.alert === "sensor_fault" ? (
                  <Cpu size={23} />
                ) : (
                  <AlertTriangle size={23} />
                )}
              </div>
            </div>

            <div
              className="mt-6 inline-flex max-w-full items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition-all duration-300"
              style={{
                color,
                backgroundColor: `${color}18`,
                borderColor: `${color}70`,
                boxShadow: isCritical ? `0 0 22px ${color}20` : "none",
              }}
              role="status"
              aria-live="polite"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  isCritical ? "animate-pulse" : ""
                }`}
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}90`,
                }}
              />
              {status}
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              {!device
                ? loading
                  ? "Consultando a API..."
                  : "Nenhum dado recebido. Verifique o dispositivo quando estiver pronto."
                : device.alert === "critical" || device.alert === "danger"
                  ? "Nível perigoso. Siga o plano de segurança local."
                  : device.alert === "sensor_fault"
                    ? "Falha detectada no sensor. Verifique o equipamento."
                    : device.alert === "alert" || device.alert === "attention"
                      ? "Atenção: acompanhe a evolução da água."
                      : "A última leitura indica nível normal."}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
              <span className="text-xs text-slate-500">
                Estado do sensor
              </span>
              <span
                className={`flex items-center gap-2 text-xs font-medium ${
                  device?.sensor_ok ? "text-emerald-300" : "text-slate-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    device?.sensor_ok ? "bg-emerald-400" : "bg-slate-500"
                  }`}
                />
                {device
                  ? device.sensor_ok
                    ? "Operacional"
                    : "Verificar sensor"
                  : "Sem leitura"}
              </span>
            </div>
          </article>

          {/* Detalhes técnicos */}
          <article
            className={`${panel} ar-animate md:col-span-2`}
            style={{ animationDelay: "160ms" }}
          >
            <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-300">
                  <Cpu size={22} />
                </div>
                <div>
                  <h2 className="font-semibold">
                    Detalhes do dispositivo
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Informações técnicas e comunicação
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                Firmware {device?.firmware_version ?? "--"}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {[
                [
                  "Distância do sensor",
                  device ? `${device.distance_cm.toFixed(1)} cm` : "--",
                ],
                [
                  "Sensor",
                  device
                    ? device.sensor_ok
                      ? "Funcionando"
                      : "Falha"
                    : "--",
                ],
                [
                  "Sinal Wi-Fi",
                  device ? `${device.wifi_rssi} dBm` : "--",
                ],
                ["Firmware", device?.firmware_version ?? "--"],
                [
                  "Última leitura",
                  age === null
                    ? "--"
                    : age < 60
                      ? `${Math.floor(age)} s atrás`
                      : `${Math.floor(age / 60)} min atrás`,
                ],
                [
                  "Horário recebido",
                  device
                    ? new Date(device.last_seen_at).toLocaleTimeString("pt-BR")
                    : "--",
                ],
                ["Estado da API", apiError ? "Erro" : "Respondendo"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex min-w-0 items-start justify-between gap-4 border-b border-white/[0.06] py-4 text-sm"
                >
                  <span className="text-slate-400">{label}</span>
                  <span className="break-words text-right font-medium text-slate-200">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* Gráfico original preservado */}
        <section className="mt-7 min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
              <Activity size={21} />
            </div>
            <div>
              <h2 className="font-semibold">
                Histórico do nível da água
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Evolução das leituras recebidas
              </p>
            </div>
          </div>

          <WaterChart />
        </section>

        <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-5 text-center text-xs text-slate-500 sm:flex-row">
          <span>AlertaRio · Monitoramento de alagamentos</span>
          <span className="flex items-center gap-2">
            <Radio size={14} />
            Leituras da API local
          </span>
        </footer>
      </div>
    </main>
  );
}
