import { Plus, Disc, LayoutDashboard, User, LogOut, ShoppingBag } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { NavButton } from './UIComponents'

export function Sidebar({ account, activeTab, setActiveTab, connectWallet, disconnectWallet }) {
    return (
        <aside className="w-64 bg-slate-950 border-r border-slate-800 hidden md:flex flex-col">
            <div className="p-8">
                <div className="flex items-center gap-3 group cursor-default">
                    <div className="p-2 bg-indigo-600 rounded-xl">
                        <Disc className="text-white" size={22} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white leading-none">SmartRoyalty</h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Besu Protocol</p>
                        </div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                <NavButton
                    icon={<LayoutDashboard size={18} />}
                    label="Dashboard"
                    active={activeTab === "dashboard"}
                    onClick={() => setActiveTab("dashboard")}
                />
                <NavButton
                    icon={<ShoppingBag size={18} />}
                    label="Marketplace"
                    active={activeTab === "marketplace"}
                    onClick={() => setActiveTab("marketplace")}
                />

                <div className="pt-6 pb-2 px-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Studio</p>
                </div>

                <NavButton
                    icon={<Plus size={18} />}
                    label="Create Release"
                    active={activeTab === "create"}
                    onClick={() => setActiveTab("create")}
                />

                <div className="pt-6 pb-2 px-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Account</p>
                </div>

                <NavButton
                    icon={<User size={18} />}
                    label="Royalties"
                    active={activeTab === "royalties"}
                    onClick={() => setActiveTab("royalties")}
                />
            </nav>

            <div className="p-4">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                    {account ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Wallet</p>
                                <div className="text-xs font-mono text-indigo-400 break-all">
                                    {account.slice(0, 8)}...{account.slice(-6)}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-9 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                onClick={disconnectWallet}
                            >
                                <LogOut size={14} className="mr-2" /> Disconnect
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={connectWallet}
                            className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm"
                        >
                            Connect Wallet
                        </Button>
                    )}
                </div>
            </div>
        </aside>
    );
}
