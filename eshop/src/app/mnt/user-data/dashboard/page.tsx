// src/app/mnt/user-data/dashboard/page.tsx
import pool from "@/lib/db";
import Link from "next/link";

interface Category {
  category_id: string;
  name: string;
  icon: string;
  color_class: string;
}

export default async function UserDashboard() {
  let categories: Category[] = [];
  let dbError = false;

  // Added try-catch to prevent the app from crashing if DB is down
  try {
    const [rows] = await pool.query('SELECT * FROM Categories');
    categories = rows as Category[];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    dbError = true;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200 p-6 flex flex-col gap-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
          shop<span className="text-indigo-500">.</span>io
        </Link>
        <nav className="flex flex-col gap-2">
          <Link href="/mnt/user-data/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium">
            <span>🏠</span> Dashboard
          </Link>
          <Link href="/mnt/user-data/cart" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors">
            <span>🛒</span> My Cart
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-hidden">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-zinc-900 leading-tight">Welcome back!</h1>
          <p className="text-zinc-500 mt-1">Here is what is happening with your account today.</p>
        </header>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-bold text-zinc-900">Browse Categories</h2>
          </div>

          {/* Error Message UI */}
          {dbError ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
              Could not load categories. Check your database connection in the terminal.
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {categories.map((cat) => (
                <Link
                  key={cat.category_id}
                  href={`/mnt/user-data/category/${cat.category_id}`}
                  className={`min-w-[160px] snap-start rounded-2xl border p-5 ${cat.color_class} hover:shadow-md transition-all flex flex-col items-center text-center`}
                >
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <h3 className="font-bold text-zinc-900 text-sm">{cat.name}</h3>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}