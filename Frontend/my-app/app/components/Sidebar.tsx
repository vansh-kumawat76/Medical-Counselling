
import Link from "next/link"
export default function Sidebar() {
    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white p-6">
            <h1 className="text-2xl font-bold mb-8">medical counselling</h1>
            <nav className="flex flex-col gap-4">
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/dashboard/students">Students</Link>
            </nav>
        </aside>
    )
}