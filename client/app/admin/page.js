"use client"
import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Hammer, Users, Play, Pause, RotateCcw, Upload, Trophy, Download, Shield, UserX, RefreshCcw, Bell, CheckCircle } from 'lucide-react';
import { useAuctionStore } from '@/store/useAuctionStore';

const formatIPL = (v) => v >= 100 ? `${(v/100).toFixed(2)} Cr` : `${v} L`;

// Sound synthesis utility
const playSound = (type) => {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gainNode = actx.createGain();
    osc.connect(gainNode);
    gainNode.connect(actx.destination);
    
    if (type === 'bid') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, actx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, actx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.1);
        osc.start(); osc.stop(actx.currentTime + 0.1);
    } else if (type === 'sold') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, actx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.3, actx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.5);
        osc.start(); osc.stop(actx.currentTime + 0.5);
    }
};

export default function Admin() {
    const { activeTournament, currentAuction, startPlayer, placeBid, finalizeSold, undoBid, togglePause, createTournament, syncData } = useAuctionStore();
    const [tab, setTab] = useState('control');
    const [filter, setFilter] = useState('All');
    const [selT, setSelT] = useState(null);
    const [tourIn, setTourIn] = useState({ name: '', budget: 10000 });
    const [newPlayer, setNewPlayer] = useState({ name: '', category: 'Batsman', basePrice: 50, imageUrl: '' });
    const [newTeam, setNewTeam] = useState({ name: '', short: '' });
    const prevBidRef = useRef(0);
    const prevStatusRef = useRef('IDLE');

    // Effect for sound triggers
    useEffect(() => {
        if (!currentAuction) return;
        if (currentAuction.currentBid > prevBidRef.current && currentAuction.currentBid > (currentAuction.activePlayer?.basePrice || 0)) {
            playSound('bid');
        }
        if (currentAuction.status === 'SOLD' && prevStatusRef.current !== 'SOLD') {
            playSound('sold');
        }
        prevBidRef.current = currentAuction.currentBid;
        prevStatusRef.current = currentAuction.status;
    }, [currentAuction]);

    const nextBidVal = () => {
        const cur = currentAuction?.currentBid || 0;
        if (cur < 50) return cur + 2;
        if (cur < 200) return cur + 5;
        if (cur < 500) return cur + 10;
        return cur + 25;
    };

    const handleCSV = (e) => {
        Papa.parse(e.target.files[0], {
            header: true, skipEmptyLines: true,
            complete: (res) => {
                const players = res.data.map((r, i) => ({
                    id: `p-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
                    name: r.Name || r.name, category: r.Category || r.category, 
                    basePrice: parseInt(r.BasePrice || r.baseprice),
                    imageUrl: r.ImageURL || r.imageurl,
                    stats: { Matches: r.Matches, SR: r.SR, AVG: r.AVG }
                }));
                syncData({ players });
            }
        });
    };

    // Professional Feature: CSV EXPORT
    const exportCSV = () => {
        if (!activeTournament) return;
        const rows = [["Player Name", "Category", "Status", "Sold Price", "Team Name"]];
        
        // Add Sold Players
        (activeTournament.soldPlayers || []).forEach(p => {
            const team = activeTournament.teams.find(t => t.id === p.teamId);
            rows.push([p.name, p.category, "SOLD", p.soldPrice, team ? team.name : "Unknown"]);
        });
        
        // Add Unsold Players
        (activeTournament.unsoldPlayers || []).forEach(p => {
            rows.push([p.name, p.category, "UNSOLD", p.basePrice, "None"]);
        });

        const csvContent = rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${activeTournament.name.replace(/\s+/g, '_')}_Report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renominate = (player) => {
        const updatedUnsold = activeTournament.unsoldPlayers.filter(p => p.id !== player.id);
        const updatedPool = [...activeTournament.players, player];
        syncData({ players: updatedPool, unsoldPlayers: updatedUnsold });
        alert(`${player.name} moved back to Available Pool!`);
    };

    if (!activeTournament) return (
        <div className="h-screen bg-[#050505] flex items-center justify-center p-10 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
            <div className="bg-[#0c0c0f] p-12 rounded-[40px] border border-white/10 w-full max-w-md shadow-2xl text-center relative z-10 backdrop-blur-xl">
                <Trophy className="text-blue-500 mx-auto mb-6" size={48} />
                <h1 className="text-3xl font-black text-white uppercase italic mb-2">Initialize League</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Professional Control Center</p>
                <input placeholder="League Name" className="w-full bg-black border border-white/10 p-4 rounded-2xl mb-4 text-white font-bold transition-all focus:border-blue-500 outline-none" onChange={e => setTourIn({...tourIn, name: e.target.value})} />
                <input type="number" placeholder="Budget (Lakhs)" className="w-full bg-black border border-white/10 p-4 rounded-2xl mb-6 text-white font-bold transition-all focus:border-blue-500 outline-none" onChange={e => setTourIn({...tourIn, budget: parseInt(e.target.value)})} />
                <button onClick={() => createTournament(tourIn.name, tourIn.budget)} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-white uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all">Start Season</button>
            </div>
        </div>
    );

    const availablePlayers = activeTournament.players.filter(p => filter === 'All' || p.category === filter);
    const upcomingPlayers = availablePlayers.slice(0, 3);

    return (
        <div className="h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
            <nav className="flex justify-between items-center px-8 py-4 bg-[#0a0a0f] border-b border-white/5 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl text-white font-black italic flex gap-2 shadow-lg"><Shield size={18}/> ADMIN HUB</div>
                    <h2 className="font-bold text-lg">{activeTournament.name}</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className={`px-4 py-2 rounded-xl text-xs font-black border flex items-center gap-2 ${currentAuction?.timeLeft < 10 && currentAuction?.status === 'BIDDING' ? 'bg-red-600/20 text-red-500 border-red-500/50 animate-pulse' : 'bg-white/5 border-white/5 text-slate-300'}`}>
                        <Bell size={14}/> {currentAuction?.timeLeft}s
                    </div>
                    <button onClick={togglePause} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                        {currentAuction?.isPaused ? <Play size={18} className="text-yellow-500"/> : <Pause size={18} className="text-slate-300"/>}
                    </button>
                    <div className="flex bg-[#0f0f13] p-1.5 rounded-2xl border border-white/5 shadow-inner">
                        {['setup', 'control', 'squads', 'unsold'].map(t => (
                            <button key={t} onClick={() => setTab(t)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{t}</button>
                        ))}
                    </div>
                </div>
            </nav>

            <div className="flex-1 p-6 overflow-hidden">
                {/* SETUP TAB */}
                {tab === 'setup' && (
                    <div className="grid grid-cols-2 gap-8 h-full overflow-y-auto custom-scrollbar">
                        {/* Manage Players Section */}
                        <div className="bg-[#0c0c0f] p-8 rounded-[40px] border border-white/5 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none" />
                            <div className="flex items-center gap-4 relative z-10">
                                <Upload className="text-blue-500" size={32} />
                                <h2 className="text-2xl font-black uppercase text-white italic tracking-tighter">Player Pool</h2>
                            </div>
                            
                            {/* CSV Upload */}
                            <div className="relative z-10 bg-white/5 p-6 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Bulk Import</p>
                                <label className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-2xl font-black uppercase text-white cursor-pointer shadow-lg transition-all flex items-center justify-center">
                                    Upload CSV Sheet
                                    <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
                                </label>
                            </div>

                            {/* Manual Add Player */}
                            <div className="relative z-10 bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Manual Entry</p>
                                <input type="text" placeholder="Player Name" className="bg-black border border-white/10 px-4 py-3 rounded-xl text-sm font-bold text-white focus:border-blue-500 outline-none w-full" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} />
                                <div className="flex gap-4">
                                    <select className="bg-black border border-white/10 px-4 py-3 rounded-xl text-sm font-bold text-white focus:border-blue-500 outline-none w-full" value={newPlayer.category} onChange={e => setNewPlayer({...newPlayer, category: e.target.value})}>
                                        <option value="Batsman">Batsman</option>
                                        <option value="Bowler">Bowler</option>
                                        <option value="AllRounder">AllRounder</option>
                                        <option value="WicketKeeper">WicketKeeper</option>
                                    </select>
                                    <input type="number" placeholder="Base (L)" className="bg-black border border-white/10 px-4 py-3 rounded-xl text-sm font-bold text-white focus:border-blue-500 outline-none w-full" value={newPlayer.basePrice} onChange={e => setNewPlayer({...newPlayer, basePrice: Number(e.target.value)})} />
                                </div>
                                <input type="text" placeholder="Image URL (Optional)" className="bg-black border border-white/10 px-4 py-3 rounded-xl text-sm font-bold text-white focus:border-blue-500 outline-none w-full" value={newPlayer.imageUrl} onChange={e => setNewPlayer({...newPlayer, imageUrl: e.target.value})} />
                                <button onClick={() => {
                                    if(newPlayer.name) {
                                        syncData({ players: [...activeTournament.players, { ...newPlayer, id: `p-${Date.now()}` }] });
                                        setNewPlayer({ name: '', category: 'Batsman', basePrice: 50, imageUrl: '' });
                                        alert("Player manually added!");
                                    }
                                }} className="bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-black uppercase text-white shadow-lg transition-all text-xs tracking-widest">Add Player</button>
                            </div>
                        </div>

                        {/* Manage Teams Section */}
                        <div className="bg-[#0c0c0f] p-8 rounded-[40px] border border-white/5 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent pointer-events-none" />
                            <div className="flex items-center gap-4 relative z-10">
                                <Users className="text-green-500" size={32} />
                                <h2 className="text-2xl font-black uppercase text-white italic tracking-tighter">Franchises</h2>
                            </div>

                            <div className="relative z-10 bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Register New Team</p>
                                <input type="text" placeholder="Full Team Name (e.g. Mumbai Indians)" className="bg-black border border-white/10 px-4 py-3 rounded-xl text-sm font-bold text-white focus:border-green-500 outline-none w-full" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} />
                                <input type="text" placeholder="Short Code (e.g. MI)" className="bg-black border border-white/10 px-4 py-3 rounded-xl text-sm font-bold text-white focus:border-green-500 outline-none w-full uppercase" value={newTeam.short} onChange={e => setNewTeam({...newTeam, short: e.target.value.toUpperCase()})} />
                                <button onClick={() => {
                                    if(newTeam.name && newTeam.short) {
                                        syncData({ teams: [...activeTournament.teams, { id: `t-${Date.now()}`, name: newTeam.name, short: newTeam.short, purse: activeTournament.budget, logo: '' }] });
                                        setNewTeam({ name: '', short: '' });
                                    }
                                }} className="bg-green-600 hover:bg-green-500 py-3 rounded-xl font-black uppercase text-white shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all text-xs tracking-widest mt-2">Create Franchise</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTROL TAB */}
                {tab === 'control' && (
                    <div className="grid grid-cols-12 gap-6 h-full">
                        <div className="col-span-3 bg-[#0c0c0f] rounded-3xl border border-white/5 flex flex-col overflow-hidden shadow-2xl">
                            <div className="p-4 bg-[#111] flex gap-2 overflow-x-auto scrollbar-hide border-b border-white/5">
                                {['All', 'Batsman', 'Bowler', 'AllRounder', 'WicketKeeper'].map(f => (
                                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex-shrink-0 transition-all ${filter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-white/5 text-slate-500 hover:text-white'}`}>{f}</button>
                                ))}
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                {availablePlayers.map(p => (
                                    <div key={p.id} className="p-4 bg-[#111115] rounded-2xl flex justify-between items-center group mb-2 hover:border-blue-500/50 border border-transparent transition-colors">
                                        <div className="truncate pr-2">
                                            <p className="font-bold text-white uppercase text-xs truncate">{p.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-black">{formatIPL(p.basePrice)}</p>
                                        </div>
                                        <button onClick={() => startPlayer(p.id)} className="p-2 bg-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Play size={14} fill="white"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-6 flex flex-col gap-6">
                            {/* Live Player Top Bar */}
                            <div className="bg-gradient-to-r from-[#111118] to-[#0c0c0f] rounded-[40px] p-8 border border-white/5 shadow-2xl flex justify-between items-center relative overflow-hidden">
                                {currentAuction?.status === 'SOLD' && <div className="absolute inset-0 bg-yellow-500/10 z-0"/>}
                                {currentAuction?.activePlayer ? (
                                    <div className="relative z-10 w-full flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-red-500 animate-pulse w-2 h-2 rounded-full"></span>
                                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{currentAuction.status}</span>
                                            </div>
                                            <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter leading-none">{currentAuction.activePlayer.name}</h2>
                                            <p className="text-blue-500 font-bold mt-2 uppercase text-[10px] tracking-widest">{currentAuction.activePlayer.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest leading-none">Leading Bid</p>
                                            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 italic mt-1 leading-none shadow-blue-500/20">{formatIPL(currentAuction.currentBid)}</p>
                                        </div>
                                    </div>
                                ) : <div className="text-center italic py-4 font-bold text-slate-600 w-full text-2xl uppercase tracking-tighter">AWAITING NOMINATION</div>}
                            </div>

                            <div className="bg-[#0c0c0f] rounded-[40px] p-8 border border-white/5 flex-1 flex flex-col gap-8 shadow-2xl">
                                <div className="grid grid-cols-4 gap-3">
                                    {activeTournament.teams.map(t => (
                                        <button key={t.id} onClick={() => setSelT(t.id)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${selT === t.id ? 'border-blue-500 bg-blue-600/10 shadow-[0_0_20px_rgba(37,99,235,0.15)] scale-[1.02]' : 'border-white/5 hover:bg-white/5 hover:border-white/10'}`}>
                                            <p className="text-[10px] font-black uppercase text-white truncate w-full text-center">{t.short || t.name}</p>
                                            <p className="text-[10px] font-bold text-blue-500">{formatIPL(t.purse)}</p>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex-1 flex flex-col justify-center items-center gap-4">
                                    <button disabled={!selT || !currentAuction?.activePlayer || currentAuction.status === 'SOLD'} onClick={() => placeBid(selT, nextBidVal())} className="w-full max-w-md py-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-[30px] font-black text-4xl italic tracking-tighter shadow-[0_10px_40px_rgba(37,99,235,0.3)] hover:shadow-[0_10px_60px_rgba(37,99,235,0.5)] active:scale-95 transition-all text-center">
                                        PLACE BID <br/><span className="text-xl text-blue-200">({formatIPL(nextBidVal())})</span>
                                    </button>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={finalizeSold} disabled={!currentAuction?.activePlayer || currentAuction.status === 'SOLD' || currentAuction.status === 'UNSOLD'} className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-30 py-6 rounded-3xl font-black text-black italic text-2xl uppercase tracking-tighter shadow-lg flex items-center justify-center gap-2 transition-all">
                                        <Hammer size={24}/> Hammer Action
                                    </button>
                                    <button onClick={undoBid} disabled={currentAuction?.bidHistory?.length === 0} className="px-8 bg-[#15151a] disabled:opacity-30 rounded-3xl border border-white/5 hover:bg-red-600/20 hover:text-red-500 hover:border-red-500/50 transition-all">
                                        <RotateCcw/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Bid History & Next Up */}
                        <div className="col-span-3 flex flex-col gap-6 h-full">
                            {/* NEW: Upcoming Queue Widget */}
                            <div className="bg-[#0c0c0f] rounded-3xl border border-white/5 p-5 shadow-2xl flex-shrink-0">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest flex items-center gap-2"><Play size={12}/> Next in Line</p>
                                <div className="space-y-3">
                                    {upcomingPlayers.map((p, i) => (
                                        <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-[#111] rounded-xl border border-white/5 border-l-2 border-l-slate-700">
                                            <span className="text-white font-bold uppercase truncate">{i+1}. {p.name}</span>
                                            <span className="text-slate-500 font-bold">{p.category.substring(0,3)}</span>
                                        </div>
                                    ))}
                                    {upcomingPlayers.length === 0 && <p className="text-[10px] text-slate-600 italic">No players remaining.</p>}
                                </div>
                            </div>

                            <div className="bg-[#0c0c0f] rounded-3xl border border-white/5 p-5 shadow-2xl flex-1 flex flex-col overflow-hidden">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">History Log</p>
                                <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1">
                                    {currentAuction?.bidHistory?.slice().reverse().map((h, i) => (
                                        <div key={i} className={`flex justify-between p-3 rounded-xl border opacity-80 text-xs font-bold ${i===0?'bg-blue-600/10 border-blue-500/30 text-white':'bg-[#111] border-white/5 text-slate-400'}`}>
                                            <span>{activeTournament.teams.find(t => t.id === h.bidderId)?.short || '--'}</span>
                                            <span className={i===0?'text-blue-500 font-black':'text-slate-500'}>{formatIPL(h.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SQUADS TAB - unchanged mostly, just polished UI */}
                {tab === 'squads' && (
                    <div className="h-full flex flex-col overflow-hidden">
                        <div className="flex justify-end mb-4">
                            <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"><Download size={16}/> Export Report</button>
                        </div>
                        <div className="grid grid-cols-4 gap-6 flex-1 overflow-y-auto custom-scrollbar">
                            {activeTournament.teams.map(team => {
                                const sq = (activeTournament.soldPlayers || []).filter(p => p.teamId === team.id);
                                return (
                                    <div key={team.id} className="bg-[#0c0c0f] rounded-3xl border border-white/5 flex flex-col h-[400px] shadow-2xl overflow-hidden">
                                        <div className="p-5 bg-[#15151a] flex justify-between items-center border-b border-white/5">
                                            <h3 className="font-black uppercase italic text-white truncate tracking-tighter">{team.name}</h3>
                                            <span className="bg-blue-600/20 text-blue-500 px-3 py-1 rounded-full text-[10px] font-black border border-blue-500/20">{sq.length}/15</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[#08080a]">
                                            {sq.map(p => (
                                                <div key={p.id} className="p-3 bg-[#111] rounded-xl border border-white/5 flex justify-between items-center text-[10px] font-bold hover:border-white/10 transition-colors">
                                                    <span className="text-slate-300 uppercase truncate pr-4">{p.name}</span>
                                                    <span className="text-blue-500 font-black italic">{formatIPL(p.soldPrice)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-5 bg-[#0a0a0f] border-t border-white/5">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Remaining Purse</p>
                                            <p className="font-black text-green-500 italic text-2xl tracking-tighter">{formatIPL(team.purse)}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* UNSOLD PLAYER LIST TAB */}
                {tab === 'unsold' && (
                    <div className="h-full bg-[#0c0c0f] rounded-[40px] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-8 bg-[#111] border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-3 tracking-tighter"><UserX className="text-red-500"/> Unsold Players Pool</h2>
                            <span className="bg-red-600/20 border border-red-500/20 text-red-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{activeTournament.unsoldPlayers?.length || 0} Listed</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-4 gap-6 custom-scrollbar bg-[#08080a]">
                            {activeTournament.unsoldPlayers?.map(p => (
                                <div key={p.id} className="bg-[#111] p-6 rounded-3xl border border-white/5 flex flex-col justify-between group hover:border-blue-500/50 transition-all shadow-lg hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)]">
                                    <div>
                                        <p className="text-xl font-black text-white uppercase italic leading-none">{p.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest bg-white/5 inline-block px-2 py-1 rounded-md">{p.category}</p>
                                        <div className="mt-4 border-t border-white/5 pt-4">
                                            <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-1">Base Price</p>
                                            <p className="text-blue-500 font-black text-lg">{formatIPL(p.basePrice)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => renominate(p)} className="mt-6 flex items-center justify-center gap-2 bg-slate-800 hover:bg-blue-600 text-white py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all">
                                        <RefreshCcw size={14}/> Re-Nominate
                                    </button>
                                </div>
                            ))}
                            {(!activeTournament.unsoldPlayers || activeTournament.unsoldPlayers.length === 0) && (
                                <div className="col-span-4 flex flex-col items-center justify-center h-full py-20 opacity-30">
                                    <CheckCircle size={64} className="mb-4 text-emerald-500"/>
                                    <h3 className="font-black uppercase text-3xl italic tracking-tighter">Pool is Empty</h3>
                                    <p className="text-slate-400 font-bold">No unsold players remaining.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; } `}</style>
        </div>
    );
}