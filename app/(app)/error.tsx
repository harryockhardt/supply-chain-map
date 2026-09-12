"use client";
export default function AppError() {
  return <section role="alert" className="p-6"><h1 className="text-xl font-semibold">This page could not load</h1><p className="mt-2">Please check your connection and try again.</p><button className="mt-4 rounded bg-slate-900 px-4 py-2 text-white" onClick={() => window.location.reload()}>Retry</button></section>;
}
