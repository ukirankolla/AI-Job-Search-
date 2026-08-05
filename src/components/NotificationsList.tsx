"use client";

import { useTransition } from "react";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";
import type { Notification } from "@/lib/types";

export function NotificationsList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [pending, startTransition] = useTransition();

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        <p>No alerts yet. Your tracker agent will nudge you here.</p>
      </div>
    );
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </span>
        {unread > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => markAllNotificationsRead())}
            className="text-xs font-medium text-slate-500 underline hover:text-slate-900 disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`rounded-lg border p-3 ${
              n.read
                ? "border-slate-200 bg-white"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    n.read ? "text-slate-500" : "text-slate-900"
                  }`}
                >
                  {n.title}
                </p>
                {n.body && (
                  <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {!n.read && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(() => markNotificationRead(n.id))}
                    className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Mark read
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => deleteNotification(n.id))}
                  aria-label={`Dismiss ${n.title}`}
                  className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:text-rose-600 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
