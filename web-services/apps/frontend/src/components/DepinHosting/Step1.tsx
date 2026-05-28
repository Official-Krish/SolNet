import { useState, useMemo, useCallback } from "react";
import {
  IconCpu,
  IconDeviceDesktopAnalytics,
  IconDatabase,
  IconNetwork,
  IconLock,
  IconEye,
  IconEyeOff,
  IconChevronRight,
  IconAlertCircle,
  IconCircleCheck,
  IconArrowRight,
  IconLoader2,
} from "@tabler/icons-react";
import { operatingSystems, regions } from "@/lib/constants";

/* ── types ─────────────────────────────────────────────────────────── */
export interface Step1FormData {
  machineType: string;
  ipAddress: string;
  cpu: number;
  ram: number;
  diskSize: number;
  region: string;
  os: string;
  Key: string;
}

interface Step1Props {
  formData: Step1FormData;
  setFormData: React.Dispatch<React.SetStateAction<Step1FormData>>;
  isLoading: boolean;
  handleStep1Submit: () => void;
}

/* ── constants ──────────────────────────────────────────────────────── */
const MACHINE_TYPES = [
  {
    id: "cpu-node",
    name: "CPU Node",
    desc: "General-purpose compute for web services and APIs",
    Icon: IconCpu,
  },
  {
    id: "gpu-node",
    name: "GPU Node",
    desc: "High-throughput ML training and inference workloads",
    Icon: IconDeviceDesktopAnalytics,
  },
  {
    id: "storage-node",
    name: "Storage Node",
    desc: "High-capacity persistent storage for data-heavy apps",
    Icon: IconDatabase,
  },
];

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;

/* ── sub-components ─────────────────────────────────────────────────── */

/** Section card wrapper */
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#0F0F1C] border border-white/[0.07] rounded-[14px] ${className}`}
    >
      {children}
    </div>
  );
}

/** Section header row */
function SectionHeader({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-white/40">{subtitle}</p>
      </div>
    </div>
  );
}

/** Hardware slider */
function HardwareSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-widest text-white/40 uppercase">
          {label}
        </span>
        <span>
          <span className="text-base font-medium text-white tabular-nums">
            {value}
          </span>
          <span className="text-[13px] text-white/40 ml-1">{unit}</span>
        </span>
      </div>
      {/* Custom slider */}
      <div className="relative h-4 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-1 rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #6366F1, #38BDF8)",
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-x-0 w-full opacity-0 h-4 cursor-pointer"
          style={{ zIndex: 2 }}
        />
        {/* Thumb */}
        <div
          className="absolute w-[18px] h-[18px] rounded-full bg-white border-2 border-[#6366F1] pointer-events-none"
          style={{
            left: `calc(${pct}% - 9px)`,
            boxShadow: "0 0 0 4px rgba(99,102,241,0.2)",
          }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-white/25">
        <span>
          {min} {unit}
        </span>
        <span>
          {max >= 1000
            ? `${max / 1000} T${unit.replace("GB", "B")}`
            : `${max} ${unit}`}
        </span>
      </div>
    </div>
  );
}

/** Strength bar */
function StrengthBar({ value }: { value: string }) {
  const score = useMemo(() => {
    if (!value) return 0;
    let s = 0;
    if (value.length >= 8) s++;
    if (value.length >= 12) s++;
    if (/[A-Z]/.test(value)) s++;
    if (/[0-9]/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return s;
  }, [value]);

  if (!value) return null;

  const SEGS = [
    { color: "#EF4444" },
    { color: "#F59E0B" },
    { color: "#22C55E" },
    { color: "#6366F1" },
  ];
  const labels = ["", "Too short", "Weak", "Fair", "Strong", "Very strong"];
  const labelColors = [
    "",
    "#EF4444",
    "#F59E0B",
    "#22C55E",
    "#22C55E",
    "#6366F1",
  ];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {SEGS.map((seg, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full transition-colors duration-300"
            style={{
              background:
                i < Math.ceil(score / (5 / 4))
                  ? seg.color
                  : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
      <p
        className="text-[11px] font-medium"
        style={{ color: labelColors[score] || "#EF4444" }}
      >
        {labels[score]}
      </p>
    </div>
  );
}

/** Custom select */
function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 pr-8 rounded-[10px] text-sm appearance-none outline-none transition-all duration-150"
        style={{
          background: "#0D0D1A",
          border: `1px solid ${error ? "#EF4444" : "rgba(255,255,255,0.1)"}`,
          color: value ? "#fff" : "rgba(255,255,255,0.3)",
          boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.15)" : undefined,
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1px solid rgba(99,102,241,0.7)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = `1px solid ${error ? "#EF4444" : "rgba(255,255,255,0.1)"}`;
          e.currentTarget.style.boxShadow = error
            ? "0 0 0 3px rgba(239,68,68,0.15)"
            : "none";
        }}
      >
        <option
          value=""
          disabled
          style={{ color: "rgba(255,255,255,0.3)", background: "#0D0D1A" }}
        >
          {placeholder}
        </option>
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            style={{ background: "#0F0F1C", color: "#fff" }}
          >
            {o.label}
          </option>
        ))}
      </select>
      {/* Custom chevron */}
      <IconChevronRight
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-white/30"
      />
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────────── */
export function Step1({
  formData,
  setFormData,
  isLoading,
  handleStep1Submit,
}: Step1Props) {
  const [showKey, setShowKey] = useState(false);
  const [ipTouched, setIpTouched] = useState(false);
  const [regionError, setRegionError] = useState(false);
  const [osError, setOsError] = useState(false);
  const [machineError, setMachineError] = useState(false);

  const ipValid = IPV4_RE.test(formData.ipAddress);
  const ipError = ipTouched && formData.ipAddress.length > 0 && !ipValid;
  const ipSuccess = ipTouched && ipValid;

  const isFormReady =
    formData.machineType &&
    formData.ipAddress &&
    ipValid &&
    formData.region &&
    formData.os &&
    formData.Key.length >= 8;

  const handleSubmit = useCallback(() => {
    let hasError = false;
    if (!formData.region) {
      setRegionError(true);
      hasError = true;
    }
    if (!formData.os) {
      setOsError(true);
      hasError = true;
    }
    if (!formData.machineType) {
      setMachineError(true);
      hasError = true;
    }
    if (hasError) return;
    handleStep1Submit();
  }, [formData, handleStep1Submit]);

  const set = useCallback(
    <K extends keyof Step1FormData>(key: K, val: Step1FormData[K]) =>
      setFormData((p) => ({ ...p, [key]: val })),
    [setFormData],
  );

  return (
    <div className="space-y-4">
      {/* ── Machine Specs ─────────────────────────────────────────── */}
      <Card className="p-6">
        <SectionHeader
          icon={IconCpu}
          iconBg="rgba(99,102,241,0.12)"
          iconColor="#6366F1"
          title="Machine Specifications"
          subtitle="Define your hardware resources"
        />
        <div className="space-y-7">
          <HardwareSlider
            label="CPU Cores"
            value={formData.cpu}
            min={1}
            max={64}
            step={1}
            unit="cores"
            onChange={(v) => set("cpu", v)}
          />
          <HardwareSlider
            label="RAM"
            value={formData.ram}
            min={2}
            max={512}
            step={2}
            unit="GB"
            onChange={(v) => set("ram", v)}
          />
          <HardwareSlider
            label="Storage"
            value={formData.diskSize}
            min={10}
            max={2000}
            step={10}
            unit="GB"
            onChange={(v) => set("diskSize", v)}
          />
        </div>
      </Card>

      {/* ── Network Configuration ─────────────────────────────────── */}
      <Card className="p-6">
        <SectionHeader
          icon={IconNetwork}
          iconBg="rgba(56,189,248,0.12)"
          iconColor="#38BDF8"
          title="Network Configuration"
          subtitle="Machine type, IP, and location"
        />

        {/* Machine type card picker */}
        <div className="mb-5">
          <p className="text-[11px] font-medium tracking-widest text-white/40 uppercase mb-3">
            Machine Type
          </p>
          <div className="space-y-2">
            {MACHINE_TYPES.map((mt) => {
              const selected = formData.machineType === mt.id;
              return (
                <button
                  key={mt.id}
                  type="button"
                  onClick={() => {
                    set("machineType", mt.id);
                    setMachineError(false);
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-[12px] text-left transition-all duration-100"
                  style={{
                    background: selected ? "rgba(99,102,241,0.06)" : "#0D0D1A",
                    border: selected
                      ? "1px solid rgba(99,102,241,0.6)"
                      : machineError
                        ? "1px solid #EF4444"
                        : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: selected ? "inset 2px 0 0 #6366F1" : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.border =
                        "1px solid rgba(255,255,255,0.18)";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.border = machineError
                        ? "1px solid #EF4444"
                        : "1px solid rgba(255,255,255,0.08)";
                      e.currentTarget.style.background = "#0D0D1A";
                    }
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: selected
                        ? "rgba(99,102,241,0.2)"
                        : "rgba(99,102,241,0.12)",
                    }}
                  >
                    <mt.Icon size={18} color="#6366F1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{mt.name}</p>
                    <p className="text-xs text-white/40 truncate">{mt.desc}</p>
                  </div>
                  <IconChevronRight
                    size={14}
                    className="text-white/20 flex-shrink-0"
                  />
                </button>
              );
            })}
          </div>
          {machineError && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <IconAlertCircle size={12} /> Select a machine type
            </p>
          )}
        </div>

        {/* IP Address */}
        <div className="mb-5">
          <p className="text-[11px] font-medium tracking-widest text-white/40 uppercase mb-2">
            Public IP Address
          </p>
          <div className="relative">
            <input
              type="text"
              placeholder="203.0.113.1"
              value={formData.ipAddress}
              onChange={(e) => set("ipAddress", e.target.value)}
              onBlur={() => setIpTouched(true)}
              className="w-full h-10 px-3 rounded-[10px] text-sm font-mono outline-none transition-all duration-150 text-white placeholder:text-white/20"
              style={{
                background: "#0D0D1A",
                border: `1px solid ${ipError ? "#EF4444" : ipSuccess ? "#22C55E" : "rgba(255,255,255,0.1)"}`,
                boxShadow: ipError
                  ? "0 0 0 3px rgba(239,68,68,0.15)"
                  : ipSuccess
                    ? "0 0 0 3px rgba(34,197,94,0.12)"
                    : undefined,
                paddingRight: ipSuccess || ipError ? "2.5rem" : undefined,
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid rgba(99,102,241,0.7)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(99,102,241,0.15)";
              }}
            />
            {ipSuccess && (
              <IconCircleCheck
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
              />
            )}
            {ipError && (
              <IconAlertCircle
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400"
              />
            )}
          </div>
          {ipError && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <IconAlertCircle size={12} /> Enter a valid IPv4 address
            </p>
          )}
        </div>

        {/* Region + OS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-widest text-white/40 uppercase mb-2">
              Region
            </p>
            <NativeSelect
              value={formData.region}
              onChange={(v) => {
                set("region", v);
                setRegionError(false);
              }}
              options={regions}
              placeholder="Select region"
              error={regionError}
            />
            {regionError && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <IconAlertCircle size={12} /> Required
              </p>
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium tracking-widest text-white/40 uppercase mb-2">
              Operating System
            </p>
            <NativeSelect
              value={formData.os}
              onChange={(v) => {
                set("os", v);
                setOsError(false);
              }}
              options={operatingSystems}
              placeholder="Select OS"
              error={osError}
            />
            {osError && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <IconAlertCircle size={12} /> Required
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ── Authentication ────────────────────────────────────────── */}
      <Card className="p-6">
        <SectionHeader
          icon={IconLock}
          iconBg="rgba(251,191,36,0.10)"
          iconColor="#FBBF24"
          title="Authentication"
          subtitle="Secure your machine access"
        />
        <div>
          <p className="text-[11px] font-medium tracking-widest text-white/40 uppercase mb-2">
            Authentication Key
          </p>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              placeholder="Enter a secure key (min 8 characters)"
              value={formData.Key}
              onChange={(e) => set("Key", e.target.value)}
              className="w-full h-10 px-3 pr-10 rounded-[10px] text-sm font-mono outline-none transition-all duration-150 text-white placeholder:text-white/20"
              style={{
                background: "#0D0D1A",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid rgba(99,102,241,0.7)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(99,102,241,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border =
                  "1px solid rgba(255,255,255,0.1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showKey ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          </div>
          <StrengthBar value={formData.Key} />
        </div>
      </Card>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full h-12 rounded-[12px] flex items-center justify-center gap-2 text-[15px] font-medium text-white transition-all duration-120"
        style={{
          background: isFormReady
            ? "linear-gradient(135deg, #6366F1, #38BDF8)"
            : "linear-gradient(135deg, #6366F1, #38BDF8)",
          opacity: isFormReady && !isLoading ? 1 : 0.4,
          cursor: isFormReady && !isLoading ? "pointer" : "not-allowed",
          transform: "translateY(0)",
        }}
        onMouseEnter={(e) => {
          if (isFormReady && !isLoading) {
            e.currentTarget.style.opacity = "0.88";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity =
            isFormReady && !isLoading ? "1" : "0.4";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {isLoading ? (
          <IconLoader2 size={18} className="animate-spin" />
        ) : (
          <>
            Save & continue to verification
            <IconArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
