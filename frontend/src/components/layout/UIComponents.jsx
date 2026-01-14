import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Disc } from 'lucide-react'
import { cn } from "@/lib/utils"

export function NavButton({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all",
                active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
        >
            <span className={cn("transition-transform", active && "scale-110")}>
                {icon}
            </span>
            <span>{label}</span>
        </button>
    );
}

export function NavDivider({ label }) {
    return (
        <div className="pt-6 pb-2 px-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{label}</p>
        </div>
    );
}

export function StatsCard({ title, value, trend, icon }) {
    return (
        <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
                <span className="stat-label">{title}</span>
                <div className="p-2.5 bg-slate-800 rounded-lg text-indigo-400">
                    {icon}
                </div>
            </div>
            <div className="stat-value">{value}</div>
            {trend && (
                <div className="mt-3">
                    <span className="badge badge-success">{trend}</span>
                </div>
            )}
        </div>
    );
}

export function StepIndicator({ step, current, label }) {
    const isPast = current > step;
    const isActive = current === step;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all border",
                isPast ? "bg-emerald-600 border-emerald-600 text-white" :
                    isActive ? "border-indigo-500 text-indigo-400 bg-indigo-500/10" :
                        "border-slate-700 text-slate-500 bg-slate-800"
            )}>
                {isPast ? <CheckCircle2 size={18} /> : step}
            </div>
            <span className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                isActive ? "text-indigo-400" : "text-slate-500"
            )}>{label}</span>
        </div>
    );
}

export function EmptyState({ label, sub, action, icon }) {
    return (
        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-slate-800/50 border border-slate-700 border-dashed rounded-2xl">
            <div className="p-8 bg-slate-800 text-slate-500 rounded-2xl mb-6">
                {icon || <Disc size={48} />}
            </div>
            <h3 className="text-xl font-bold text-slate-200">{label}</h3>
            <p className="text-slate-400 mt-2 mb-8 max-w-sm text-sm">{sub}</p>
            {action && (
                <Button
                    onClick={action}
                    className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                    Launch Studio
                </Button>
            )}
        </div>
    );
}
