import React from "react";
import { Bell, Check, Trash2, X, AlertTriangle, ShieldCheck, Share2, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    markNotificationRead,
    clearAllNotifications,
    addNotification,
    tr,
  } = useApp();

  if (!isOpen) return null;

  const requestBrowserPushPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          addNotification({
            title: "Push Notifications Enabled",
            message: "You will now receive urgent deadline and security alerts directly on your browser.",
            type: "security",
          });
        } else {
          addNotification({
            title: "Push Permission Denied",
            message: "Push notification permission was denied in browser settings.",
            type: "urgent",
          });
        }
      });
    } else {
      addNotification({
        title: "Push Not Supported",
        message: "Browser push notifications are not supported in this environment.",
        type: "urgent",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case "social":
        return <Share2 className="w-4 h-4 text-sky-500" />;
      case "sync":
        return <RefreshCw className="w-4 h-4 text-indigo-500" />;
      case "security":
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Urgent Alerts & Notifications</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Project deadlines, security logs & social mentions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Push Permission Banner */}
        <div className="my-4 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-indigo-900 dark:text-indigo-200">Enable Desktop Push Notifications</p>
            <p className="text-indigo-700 dark:text-indigo-400 text-[11px]">
              Receive real-time popups for deadline reminders
            </p>
          </div>
          <button
            onClick={requestBrowserPushPermission}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-colors"
          >
            Enable Push
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-3 my-2 pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold">No active notifications</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => markNotificationRead(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  !item.read
                    ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800/80"
                    : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getIcon(item.type)}</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        {item.timestamp}
                      </span>
                    </div>
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={() =>
              addNotification({
                title: "Test Urgent Alert",
                message: "Mock deadline reminder triggered manually by user.",
                type: "urgent",
              })
            }
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            + Trigger Test Alert
          </button>

          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
