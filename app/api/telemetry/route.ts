
import { NextResponse } from "next/server";

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

let latestTelemetry: Telemetry | null = null;

export async function GET() {
  return NextResponse.json({
    device: latestTelemetry,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const requiredNumbers = [
      body.distance_cm,
      body.water_depth_cm,
      body.rise_rate_cm_min,
      body.wifi_rssi,
    ];

    if (
      !requiredNumbers.every(
        (value) => typeof value === "number" && Number.isFinite(value)
      ) ||
      typeof body.sensor_ok !== "boolean" ||
      typeof body.firmware_version !== "string" ||
      !["normal", "attention", "alert", "danger", "critical", "sensor_fault"].includes(body.alert) ||
      !["stable", "rising", "rising_fast", "falling"].includes(body.trend)
    ) {
      return NextResponse.json(
        { error: "Dados de telemetria inválidos." },
        { status: 400 }
      );
    }

    latestTelemetry = {
      distance_cm: body.distance_cm,
      water_depth_cm: body.water_depth_cm,
      rise_rate_cm_min: body.rise_rate_cm_min,
      alert: body.alert,
      trend: body.trend,
      sensor_ok: body.sensor_ok,
      wifi_rssi: body.wifi_rssi,
      firmware_version: body.firmware_version,
      last_seen_at: Date.now(),
    };

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ler o JSON enviado." },
      { status: 400 }
    );
  }
}
