"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuctionStore } from '@/store/useAuctionStore';
import { Users, Hammer, Wallet } from 'lucide-react';

const formatIPL = (v) => v >= 100 ? `${(v/100).toFixed(2)} Cr` : `${v} L`;

export default function TeamDashboard() {
    const { activeTournament, currentAuction } = useAuctionStore();
    const [selectedTeam, setSelectedTeam] = useState(null);

    const player = currentAuction?.activePlayer;
    
    if (!activeTournament) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">
            Waiting for Tournament Broadcast...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans flex flex-col h-screen overflow-hidden">
            <nav className="flex justify-between items-center bg-[#0c0c0f] border border-white/5 px-8 py-4 rounded-3xl mb-6 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="bg-green-600/20 text-green-500 p-2 rounded-xl flex gap-2 font-black italic items-center">
                        <Users size={18}/> TEAM VIEW
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select Team Focus:</span>
                    <select 
                        className="bg-black border border-white/10 px-4 py-2 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-green-500 transition-colors"
                        onChange={(e) => setSelectedTeam(activeTournament.teams.find(t => t.id === e.target.value))}
                        defaultValue=""
                    >
                        <option value="" disabled>-- Select Your Team --</option>
                        {activeTournament.teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </nav>

            <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
                {/* Left Live Auction Block */}
                <div className="col-span-8 bg-[#0c0c0f] border border-white/5 rounded-3xl p-8 flex flex-col shadow-2xl relative overflow-hidden">
                    {/* Background glow based on status */}
                    <div className={`absolute top-0 right-0 w-96 h-96 blur-[120px] rounded-full pointer-events-none opacity-20 transition-all duration-1000 ${currentAuction?.status === 'SOLD' ? 'bg-yellow-500' : 'bg-blue-600'}`}/>
                    
                    <h2 className="text-sm font-black uppercase text-slate-500 mb-8 flex items-center gap-2 tracking-widest"><Hammer size={16}/> LIVE ON THE BLOCK</h2>
                    
                    {player ? (
                        <div className="flex-1 flex gap-8 items-center z-10">
                            <motion.div initial={{ x: -20, opacity:0 }} animate={{ x: 0, opacity:1 }} className="h-64 w-64 rounded-[40px] overflow-hidden border border-white/10 shrink-0 shadow-2xl bg-black">
                                <img src={player.imageUrl} className="w-full h-full object-cover" alt={player.name} />
                            </motion.div>
                            <div className="flex-1">
                                <h3 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-2">{player.name}</h3>
                                <p className="text-blue-500 font-bold tracking-[0.3em] uppercase text-sm mb-6">{player.category}</p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-1">Base Price</p>
                                        <p className="text-2xl font-black">{formatIPL(player.basePrice)}</p>
                                    </div>
                                    <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
                                        <p className="text-[10px] uppercase text-blue-400 font-black tracking-widest mb-1">Current Bid</p>
                                        <p className="text-3xl font-black italic text-blue-500">{formatIPL(currentAuction.currentBid)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center">
                            <Hammer size={80} className="mb-4 text-slate-500"/>
                            <p className="font-black italic text-4xl uppercase tracking-tighter">Awaiting Nomination</p>
                        </div>
                    )}
                </div>

                {/* Right Team Details Block */}
                <div className="col-span-4 bg-[#0c0c0f] border border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
                    {selectedTeam ? (() => {
                        const squad = (activeTournament.soldPlayers || []).filter(p => p.teamId === selectedTeam.id);
                        return (
                            <>
                                <div className="p-8 bg-gradient-to-b from-green-500/10 to-transparent border-b border-white/5 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shadow-lg text-2xl font-black uppercase italic mb-4">{selectedTeam.short || selectedTeam.name.substring(0, 2)}</div>
                                    <h3 className="font-black text-2xl uppercase tracking-tighter mb-4">{selectedTeam.name}</h3>
                                    <div className="w-full bg-slate-900 rounded-2xl p-4 border border-white/5">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1"><Wallet className="inline mb-1 mr-1" size={12}/> Remaining Purse</p>
                                        <p className="text-4xl font-black text-green-500 italic tabular-nums">{formatIPL(selectedTeam.purse)}</p>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <p className="text-[10px] font-black uppercase text-slate-500 mb-4 px-2">Squad ({squad.length}/15)</p>
                                    <div className="space-y-2">
                                        <AnimatePresence>
                                            {squad.map(p => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={p.id} className="bg-white/5 p-3 rounded-2xl border border-white/5 flex justify-between items-center text-sm font-bold group hover:border-green-500/30 transition-colors">
                                                    <span className="text-white uppercase truncate pr-4">{p.name}</span>
                                                    <span className="text-green-400 shrink-0 italic">{formatIPL(p.soldPrice)}</span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {squad.length === 0 && <p className="text-center text-slate-600 italic text-sm py-10 font-bold">No players in squad.</p>}
                                    </div>
                                </div>
                            </>
                        );
                    })() : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 p-8 text-center">
                            <Users size={64} className="mb-4 text-slate-500" />
                            <p className="font-black italic text-2xl uppercase tracking-tighter">Select a team above to view live stats</p>
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; } `}</style>
        </div>
    );
}
