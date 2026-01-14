
import * as React from "react"
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const Toast = ({ message, type = "info", onClose, duration = 5000 }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, duration)
        return () => clearTimeout(timer)
    }, [duration, onClose])

    const icons = {
        success: <CheckCircle2 className="text-emerald-500" size={20} />,
        error: <AlertCircle className="text-red-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
        loading: <Loader2 className="text-indigo-500 animate-spin" size={20} />
    }

    const borderColors = {
        success: "border-emerald-100",
        error: "border-red-100",
        info: "border-blue-100",
        loading: "border-indigo-100"
    }

    return (
        <div className={cn(
            "flex items-center gap-3 p-4 min-w-[300px] bg-white dark:bg-gray-900 border shadow-2xl rounded-2xl animate-in slide-in-from-right-full duration-300",
            borderColors[type] || "border-slate-200"
        )}>
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {message}
            </div>
            <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    )
}

export { Toast }
