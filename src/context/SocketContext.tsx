"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useWallet } from "./WalletContext";
import { useAuth } from "./AuthContext";

interface SocketContextProps {
    socket: Socket | null;
    isConnected: boolean;
    pauseBalanceUpdates: () => void;
    resumeBalanceUpdates: () => void;
}

const SocketContext = createContext<SocketContextProps>({
    socket: null,
    isConnected: false,
    pauseBalanceUpdates: () => {},
    resumeBalanceUpdates: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();
    const { setBalance, setBonusBalance } = useWallet();

    const isPaused = useRef(false);
    const pendingBalance = useRef<{ balance?: number; bonusBalance?: number } | null>(null);

    const pauseBalanceUpdates = useCallback(() => {
        isPaused.current = true;
        pendingBalance.current = null;
    }, []);

    const resumeBalanceUpdates = useCallback(() => {
        isPaused.current = false;
        if (pendingBalance.current) {
            if (pendingBalance.current.balance !== undefined) setBalance(pendingBalance.current.balance);
            if (pendingBalance.current.bonusBalance !== undefined) setBonusBalance(pendingBalance.current.bonusBalance);
            pendingBalance.current = null;
        }
    }, [setBalance, setBonusBalance]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');

        if (!user || !token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        const socketInstance = io(SOCKET_URL, {
            auth: {
                token: token
            },
            transports: ["websocket"],
            withCredentials: true
        });

        socketInstance.on('connect', () => {
            console.log("Connected to WebSocket Server:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log("Disconnected from WebSocket Server");
            setIsConnected(false);
        });

        // Global Event Listeners
        socketInstance.on('balance_update', (data: { balance: number, bonusBalance: number }) => {
            if (isPaused.current) {
                // Store for later when animations finish
                pendingBalance.current = data;
                return;
            }
            if (data.balance !== undefined) setBalance(data.balance);
            if (data.bonusBalance !== undefined) setBonusBalance(data.bonusBalance);
        });

        socketInstance.on('connect_error', (err) => {
            console.error("Socket Connection Error:", err.message);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, pauseBalanceUpdates, resumeBalanceUpdates }}>
            {children}
        </SocketContext.Provider>
    );
};
