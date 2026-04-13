"use client"
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuctionStore } from '@/store/useAuctionStore';

const formatIPL = (v) => v >= 100 ? `₹${(v/100).toFixed(2)} Cr` : `₹${v} L`;

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
        gainNode.gain.setValueAtTime(0.5, actx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.5);
        osc.start(); osc.stop(actx.currentTime + 0.5);
    }
};

export default function Presentation() {
    const { activeTournament, currentAuction, trigger } = useAuctionStore();
    const prevBidRef = useRef(0);
    const prevStatusRef = useRef('IDLE');

    const player = currentAuction?.activePlayer;
    const currentTeam = activeTournament?.teams.find(t => t.id === currentAuction?.currentBidderId);

    // Audio effects effect
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

    if (!player) return (
        <div className="h-screen bg-[#050505] flex items-center justify-center text-blue-600 font-black text-4xl animate-pulse uppercase tracking-widest relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[200px]" />
            AWAITING NOMINATION
        </div>
    );

    return (
        <div className="h-screen w-full bg-[#020202] text-white p-12 font-sans overflow-hidden flex flex-col relative">
            {/* Dynamic Abstract Background Elements */}
            <div className={`absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 pointer-events-none transition-colors duration-1000 ${currentAuction.status === 'SOLD' ? 'bg-yellow-500' : 'bg-blue-600'}`} />
            <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-purple-600 rounded-full blur-[150px] opacity-20 pointer-events-none" />

            {/* Top Bar Navigation/Stats */}
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-between items-start pb-6 mb-12 relative z-10">
                <div className="flex items-center gap-12">
                    {/* ENHANCED LIVE TIMER */}
                    <div className="bg-[#0c0c0f] px-10 py-6 rounded-[30px] min-w-[200px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] pointer-events-none ${currentAuction.timeLeft < 10 ? 'bg-red-500/30 animate-pulse' : 'bg-blue-500/20'}`}/>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-2 relative z-10">Time Left</p>
                        <p className={`text-6xl font-black italic tabular-nums relative z-10 ${currentAuction.timeLeft < 10 && currentAuction.status === 'BIDDING' ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {currentAuction.timeLeft}s
                        </p>
                    </div>
                    {/* PLAYER TITLE */}
                    <div className="backdrop-blur-sm">
                        <motion.h2 
                            key={player.name}
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="text-7xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 leading-none tracking-tighter drop-shadow-2xl"
                        >
                            {player.name}
                        </motion.h2>
                        <p className="text-blue-500 font-black uppercase tracking-[0.4em] mt-4 text-xl">
                            {player.category}
                        </p>
                    </div>
                </div>
                
                {/* Stats Bar */}
                <div className="flex gap-10 bg-[#0c0c0f]/80 backdrop-blur-md p-6 rounded-[30px] border border-white/5 shadow-2xl">
                    {player.stats && Object.entries(player.stats).map(([k,v], i) => (
                        <motion.div 
                            key={k} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="text-right border-r border-white/10 pr-10 last:border-0 last:pr-0"
                        >
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{k}</p>
                            <p className="text-4xl font-black italic">{v || '0'}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <div className="grid grid-cols-12 gap-16 flex-1 items-center relative z-10">
                {/* Left Side: Trading Card Representation */}
                <motion.div 
                    key={`img-${player.id}`}
                    initial={{ scale: 0.9, opacity: 0, rotateY: 15 }} 
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }} 
                    transition={{ type: "spring", stiffness: 100 }}
                    className="col-span-4 h-[650px] relative perspective-1000"
                >
                    <div className="h-full w-full bg-[#111] rounded-[40px] overflow-hidden border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
                        {/* Premium Glossy Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 z-10 pointer-events-none" />
                        <img src={player.imageUrl} className="w-full h-full object-cover relative z-0" alt={player.name} />

                        <div className="absolute top-6 right-6 bg-red-600 px-4 py-1.5 rounded-full text-xs font-black uppercase shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 z-20 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white block"/> LIVE
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Bid Action Area */}
                <div className="col-span-8 flex flex-col items-center justify-center gap-12 mt-10">
                    <motion.div 
                        animate={trigger === 'bid_pulse' ? { scale: [1, 1.05, 1], rotateX: [0, 5, 0] } : {}} 
                        transition={{ duration: 0.4 }}
                        className="bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 p-12 rounded-[50px] w-full text-center shadow-[0_20px_80px_rgba(37,99,235,0.15)] backdrop-blur-xl relative flex flex-col items-center justify-center gap-8"
                    >
                        {/* Pulsing glow behind bid */}
                        <motion.div animate={trigger === 'bid_pulse' ? { opacity: [0.2, 0.5, 0.2] } : { opacity: 0.1 }} className="absolute inset-0 bg-blue-500 blur-[80px] rounded-[50px] pointer-events-none -z-10" />

                        {/* BASE PRICE TAG */}
                        <div className="bg-black/50 border border-white/10 px-8 py-3 rounded-full flex items-center gap-4 shadow-inner">
                             <span className="text-blue-500 uppercase font-black tracking-widest text-[10px]">Base Price</span>
                             <span className="text-white font-black text-3xl italic">{formatIPL(player.basePrice)}</span>
                        </div>

                        <div>
                            <p className="text-slate-400 uppercase tracking-[0.5em] text-sm font-black mb-4">Current Bid</p>
                            <h3 className="text-[7vw] font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-200 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                                {formatIPL(currentAuction.currentBid)}
                            </h3>
                        </div>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {currentTeam ? (
                            <motion.div 
                                key={currentTeam.id}
                                initial={{ y: 50, opacity: 0, scale: 0.9 }} 
                                animate={{ y: 0, opacity: 1, scale: 1 }} 
                                exit={{ y: -50, opacity: 0 }}
                                className="flex items-center gap-10 bg-[#0c0c0f] border border-white/10 px-16 py-8 rounded-[40px] shadow-2xl relative overflow-hidden w-full max-w-4xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 z-0 pointer-events-none opacity-50" />
                                <div className="h-24 w-24 bg-white/10 border border-white/20 rounded-full p-2 flex items-center justify-center shrink-0 shadow-lg relative z-10 backdrop-blur-md">
                                    {currentTeam.logo ? <img src={currentTeam.logo} className="object-contain max-h-full" alt="logo" /> : <span className="font-black italic text-3xl">{currentTeam.short || currentTeam.name.substring(0, 2)}</span>}
                                </div>
                                <div className="relative z-10">
                                    <p className="text-blue-400 uppercase text-xs font-black tracking-[0.3em] mb-2">Highest Bidder</p>
                                    <h4 className="text-5xl font-black uppercase italic tracking-tighter text-white">{currentTeam.name}</h4>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity:0 }} animate={{ opacity: 1 }} className="h-40 flex items-center text-slate-600 font-black italic text-3xl uppercase tracking-tighter">
                                Waiting for opening bid...
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* MASSIVE SOLD OVERLAY */}
            <AnimatePresence>
                {currentAuction.status === 'SOLD' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 1.2 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center overflow-hidden"
                    >
                        {/* Dramatic black backdrop with radial yellow glow */}
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-0" />
                        <motion.div 
                            initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                            className="absolute bg-yellow-500/20 w-full h-[500px] -skew-y-6 z-0 border-y-2 border-yellow-500/50" 
                        />

                        <div className="relative z-10 flex flex-col items-center w-full">
                            <motion.h2 
                                initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                                className="text-[18vw] font-black italic text-yellow-500 uppercase leading-[0.8] mb-8 drop-shadow-[0_20px_50px_rgba(234,179,8,0.5)]"
                            >
                                SOLD
                            </motion.h2>
                            
                            <motion.div 
                                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                                className="bg-[#0c0c0f] p-16 rounded-[60px] border border-yellow-500/30 min-w-[700px] shadow-[0_0_100px_rgba(234,179,8,0.2)] flex flex-col items-center"
                            >
                                <p className="text-xl font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Acquired By</p>
                                <p className="text-7xl font-black text-white uppercase tracking-tighter mb-8">{currentTeam?.name}</p>
                                <div className="h-1 w-32 bg-yellow-500/30 rounded-full mb-8" />
                                <p className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 italic leading-none drop-shadow-2xl">
                                    {formatIPL(currentAuction.currentBid)}
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}