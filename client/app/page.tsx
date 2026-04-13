"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, MonitorPlay, Users, Shield, Sparkles, Copy, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const CopyButton = ({ path }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e) => {
      e.preventDefault(); e.stopPropagation();
      const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : `http://localhost:3000${path}`;
      navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    };
    return (
      <button onClick={handleCopy} className="mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest border border-white/10 bg-black/50 hover:bg-white/10 transition-colors px-4 py-2 rounded-xl group-hover:border-white/30 z-20">
        {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />} {copied ? 'Copied Link' : 'Copy Direct Link'}
      </button>
    );
  };
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header */}
      <header className="p-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white font-black italic flex gap-2">
            <Hammer size={24} /> PRO
          </div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter">SportVot <span className="text-slate-500">Auction Tool</span></h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 md:mb-16 w-full max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-blue-400 mb-6">
            <Sparkles size={14} /> Professional Grade
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter leading-[1.1] mb-6">
            Command <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">The Block</span>
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg px-4">
            Broadcast-ready real-time auction management powered by SportVot.
          </p>
        </motion.div>

        {/* Portals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-4">
          <Link href="/admin" className="h-full">
            <motion.div whileHover={{ y: -5, scale: 1.02 }} className="h-full bg-gradient-to-b from-white/5 to-transparent p-[1px] rounded-3xl">
              <div className="bg-[#0c0c0f] h-full p-6 md:p-8 rounded-[23px] flex flex-col items-center justify-between text-center gap-4 md:gap-6 border border-white/5 hover:border-blue-500/50 transition-colors group">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-blue-500/10 p-5 rounded-full text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <Shield size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-2">Control Room</h3>
                    <p className="text-xs md:text-sm text-slate-500 font-medium px-2">Manage imports, trigger bids, and oversee the entire auction engine.</p>
                  </div>
                </div>
                <CopyButton path="/admin" />
              </div>
            </motion.div>
          </Link>

          <Link href="/presentation" className="h-full">
            <motion.div whileHover={{ y: -5, scale: 1.02 }} className="h-full bg-gradient-to-b from-white/5 to-transparent p-[1px] rounded-3xl">
              <div className="bg-[#0c0c0f] h-full p-6 md:p-8 rounded-[23px] flex flex-col items-center justify-between text-center gap-4 md:gap-6 border border-white/5 hover:border-purple-500/50 transition-colors group">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-purple-500/10 p-5 rounded-full text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                    <MonitorPlay size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-2">Live Display</h3>
                    <p className="text-xs md:text-sm text-slate-500 font-medium px-2">Cast robust 3D stats and real-time graphics to the projector or stream.</p>
                  </div>
                </div>
                <CopyButton path="/presentation" />
              </div>
            </motion.div>
          </Link>

          <Link href="/team" className="h-full">
            <motion.div whileHover={{ y: -5, scale: 1.02 }} className="h-full bg-gradient-to-b from-white/5 to-transparent p-[1px] rounded-3xl">
              <div className="bg-[#0c0c0f] h-full p-6 md:p-8 rounded-[23px] flex flex-col items-center justify-between text-center gap-4 md:gap-6 border border-white/5 hover:border-green-500/50 transition-colors group">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-green-500/10 p-5 rounded-full text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all">
                    <Users size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-2">Team Portal</h3>
                    <p className="text-xs md:text-sm text-slate-500 font-medium px-2">Isolated dashboard for bidders to track purses and active rosters.</p>
                  </div>
                </div>
                <CopyButton path="/team" />
              </div>
            </motion.div>
          </Link>
        </div>
      </main>
    </div>
  );
}
