export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh px-6 pt-14 pb-10">
      {children}
    </div>
  );
}
