interface ErrorScreenProps {
  message: string;
}

export function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 p-6 text-center min-h-screen">
      <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
        <svg
          className="size-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-red-600">เกิดข้อผิดพลาด</h1>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
