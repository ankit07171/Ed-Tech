import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "../utils/axiosConfig.js";
import socket from "../socket/socket.js";

const NotificationContext = createContext();

// Per-account "last seen" cursor, so the unread badge/alert clears once the
// user actually opens the Notifications page — like Zoom's unread badge on
// the chat icon — but a different user on the same browser doesn't inherit
// someone else's read state.
const seenKey = (userId) => `notif_seen_at_${userId || "anon"}`;

export const NotificationProvider = ({ children }) => {
  const userId = localStorage.getItem("userId");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenAtRef = useRef(localStorage.getItem(seenKey(userId)) || null);

  const recomputeUnread = useCallback((list) => {
    const lastSeen = lastSeenAtRef.current ? new Date(lastSeenAtRef.current).getTime() : 0;
    const count = list.filter((n) => new Date(n.createdAt).getTime() > lastSeen).length;
    setUnreadCount(count);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await axios.get("/api/notifications/all");
      setNotifications(res.data || []);
      recomputeUnread(res.data || []);
    } catch {
      // Silently ignore — the notifications page itself will surface errors.
    }
  }, [recomputeUnread]);

  // Mark everything read up to "now" — called when the user opens the
  // Notifications page. The badge/alert disappears immediately.
  const markAllSeen = useCallback(() => {
    const now = new Date().toISOString();
    lastSeenAtRef.current = now;
    localStorage.setItem(seenKey(userId), now);
    setUnreadCount(0);
  }, [userId]);

  useEffect(() => {
    refresh();

    const onNew = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.info(`📢 ${notif.title}`, { autoClose: 6000 });
    };

    socket.on("new-notification", onNew);
    return () => socket.off("new-notification", onNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markAllSeen }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
