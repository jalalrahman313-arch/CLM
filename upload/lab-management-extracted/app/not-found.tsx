import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-col gap-4 text-center w-full h-full flex items-center justify-center">
      <h2 className="text-xl font-bold">Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-accent text-white rounded-xl">
        Return Home
      </Link>
    </div>
  );
}
