import React from "react";

interface Props {
  date: string | Date;
  className?: string;
}

function toRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 2) return "kemarin";
  return `${diffDay} hari lalu`;
}

export default function RelativeTime({ date, className }: Props) {
  const d = typeof date === "string" ? new Date(date) : date;
  const iso = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  const title = !isNaN(d.getTime())
    ? d.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <time dateTime={iso} title={title} className={className}>
      {!isNaN(d.getTime()) ? toRelative(d) : "baru saja"}
    </time>
  );
}
