import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="">
        <nav className="color-green fixed top-0 left-0 right-0 z-50 space-x-4 p-4 gap-6 m-3 rounded rounded-lg font-bold text-white shadow-sm">
          <Link href="/" className="hover:text-brown transition-colors">Home</Link>
          <Link href="/new" className="hover:text-brown transition-colors">New Entry</Link>
          <Link href="/todo" className="hover:text-brown transition-colors">To-Do List</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}