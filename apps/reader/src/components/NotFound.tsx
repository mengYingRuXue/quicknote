export function NotFound({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
