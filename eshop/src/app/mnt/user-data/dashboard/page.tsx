// src/app/mnt/user-data/dashboard/page.tsx
import pool from "@/lib/db";
import Link from "next/link";

// 1. Define the TypeScript interface matching your MySQL table
interface Category {
  category_id: string;
  name: string;
  icon: string;
  color_class: string;
}

export default async function UserDashboard() {
  // 2. Fetch data directly from MySQL
  const [rows] = await pool.query('SELECT * FROM Categories');
  const categories = rows as Category[];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans">
        {/* ... Sidebar code ... */}

        <section className="mb-10">
          <h2 className="text-xl font-bold text-zinc-900 mb-4 px-2">Browse Categories</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            
            {/* 3. Map over the database results */}
            {categories.map((cat) => (
              <Link
                key={cat.category_id}
                href={`/category/${cat.category_id}`}
                className={`min-w-[160px] snap-start rounded-2xl border p-5 ${cat.color_class} hover:shadow-md transition-all flex flex-col items-center text-center`}
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-zinc-900 text-sm">{cat.name}</h3>
              </Link>
            ))}

          </div>
        </section>
    </div>
  );
}