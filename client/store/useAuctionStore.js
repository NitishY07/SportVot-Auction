import { create } from 'zustand';
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000');

export const useAuctionStore = create((set) => {
    // Listen for initial data
    socket.on('init_data', (data) => {
        const active = data.tournaments?.find(t => t.id === data.activeTournamentId) || null;
        set({ 
            tournaments: data.tournaments || [], 
            activeTournament: active,
            currentAuction: data.currentAuction 
        });
    });

    // Listen for general auction updates (nominations, bids, sold)
    socket.on('auction_update', (update) => set({ currentAuction: update }));

    // CRITICAL FIX: Listen specifically for the 1-second timer tick
    socket.on('timer_update', (time) => {
        set((state) => ({
            currentAuction: {
                ...state.currentAuction,
                timeLeft: time
            }
        }));
    });

    socket.on('trigger_anim', (anim) => { 
        set({ trigger: anim }); 
        setTimeout(() => set({ trigger: null }), 1000); 
    });

    return {
        activeTournament: null,
        currentAuction: null,
        trigger: null,
        createTournament: (name, budget) => socket.emit('create_tournament', { name, budget }),
        startPlayer: (id) => socket.emit('start_player', id),
        placeBid: (teamId, amount) => socket.emit('place_bid', { teamId, amount }),
        finalizeSold: () => socket.emit('finalize_sold'),
        undoBid: () => socket.emit('undo_bid'),
        togglePause: () => socket.emit('toggle_pause'),
        syncData: (data) => socket.emit('sync_tournament_data', data)
    };
});