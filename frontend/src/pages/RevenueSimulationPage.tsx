import { useMemo, useState } from "react";
import { Calculator, Users, Gem, Smartphone, TrendingUp } from "lucide-react";

interface Scenario {
  conversion: number;
  arppuMonthly: number;
  adArpdau: number;
  d30Retention: number;
}

const PRESETS: { key: string; label: string; scenario: Scenario }[] = [
  {
    key: "conservative",
    label: "Conservative",
    scenario: { conversion: 1.5, arppuMonthly: 6, adArpdau: 0.003, d30Retention: 8 },
  },
  {
    key: "moderate",
    label: "Moderate",
    scenario: { conversion: 3, arppuMonthly: 10, adArpdau: 0.006, d30Retention: 12 },
  },
  {
    key: "optimistic",
    label: "Optimistic",
    scenario: { conversion: 5, arppuMonthly: 16, adArpdau: 0.01, d30Retention: 18 },
  },
];

export default function RevenueSimulationPage() {
  const [downloads, setDownloads] = useState(50000);
  const [scenario, setScenario] = useState<Scenario>(PRESETS[1].scenario);
  const [selectedPreset, setSelectedPreset] = useState("moderate");

  const results = useMemo(() => {
    const payingUsers = downloads * (scenario.conversion / 100);
    const iapRevenue = payingUsers * scenario.arppuMonthly;
    const dau = downloads * (scenario.d30Retention / 100);
    const adRevenue = dau * 30 * scenario.adArpdau;
    const total = iapRevenue + adRevenue;
    const platformCut = total * 0.3;
    const net = total - platformCut;
    return {
      payingUsers: Math.round(payingUsers),
      iapRevenue,
      dau: Math.round(dau),
      adRevenue,
      total,
      net,
    };
  }, [downloads, scenario]);

  const applyPreset = (key: string) => {
    const p = PRESETS.find((x) => x.key === key)!;
    setSelectedPreset(key);
    setScenario(p.scenario);
  };

  const currency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto animate-slide-up space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-star-500/10">
              <Calculator className="w-6 h-6 text-star-400" />
            </div>
            <h1 className="text-xl font-bold text-white">50K Downloads Revenue Simulator</h1>
          </div>
          <p className="text-gray-400 text-sm">
            This is a planning tool, not a promise. Adjust conversion, ARPPU, ad revenue and retention to see possible monthly revenue at 50,000 downloads.
          </p>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Total downloads</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10000}
                max={200000}
                step={5000}
                value={downloads}
                onChange={(e) => setDownloads(Number(e.target.value))}
                className="flex-1 accent-star-400"
              />
              <span className="text-white font-semibold w-24 text-right">{downloads.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Scenario preset</label>
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    selectedPreset === p.key
                      ? "bg-star-500/20 text-star-400 border border-star-500/30"
                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Paying user conversion (%)</label>
              <input
                type="number"
                step="0.1"
                value={scenario.conversion}
                onChange={(e) => setScenario({ ...scenario, conversion: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">ARPPU / month ($)</label>
              <input
                type="number"
                step="1"
                value={scenario.arppuMonthly}
                onChange={(e) => setScenario({ ...scenario, arppuMonthly: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ad ARPDAU ($)</label>
              <input
                type="number"
                step="0.001"
                value={scenario.adArpdau}
                onChange={(e) => setScenario({ ...scenario, adArpdau: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">D30 retention (%)</label>
              <input
                type="number"
                step="0.5"
                value={scenario.d30Retention}
                onChange={(e) => setScenario({ ...scenario, d30Retention: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card icon={<Users className="w-5 h-5 text-cosmic-400" />} label="Paying users" value={results.payingUsers.toLocaleString()} />
          <Card icon={<Smartphone className="w-5 h-5 text-nebula-400" />} label="Estimated DAU" value={results.dau.toLocaleString()} />
          <Card icon={<Gem className="w-5 h-5 text-star-400" />} label="IAP revenue / month" value={currency(results.iapRevenue)} />
          <Card icon={<TrendingUp className="w-5 h-5 text-green-400" />} label="Ad revenue / month" value={currency(results.adRevenue)} />
        </div>

        <div className="card p-6 bg-gradient-to-br from-star-500/10 to-cosmic-500/10 border border-star-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Estimated gross monthly revenue</p>
              <p className="text-3xl font-bold text-white mt-1">{currency(results.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">After platform fees (~30%)</p>
              <p className="text-2xl font-bold text-star-400 mt-1">{currency(results.net)}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Assumes all downloads are monthly active for simplification. In reality, revenue is back-loaded: loyal users spend more over time. For reference, Bottled (5M+ users) is estimated under $1M/year; Slowly (9M+ users) iOS alone is around $20K/month with a much softer monetization layer.
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-white/5">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
