export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-2)] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[color:var(--border)] bg-[color:var(--bg)] p-6">
        {children}
      </div>
    </div>
  );
}