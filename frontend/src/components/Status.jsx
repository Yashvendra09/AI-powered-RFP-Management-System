import React from "react";
export default function Status({ text, type = "info" }) {
  if (!text) return null;
  const bg = type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800";
  return <div className={`${bg} border p-3 rounded-md text-sm`}>{text}</div>;
}
