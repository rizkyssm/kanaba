export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-subtle)] px-4 py-10">
      <div className="w-full max-w-[380px] rounded-[var(--radius-xl)] border bg-[color:var(--bg-elev)] p-6 shadow-[var(--shadow-sm)]">
        {children}
      </div>
    </div>
  );
}