export default function Header() {
    return (
        <header className="fixed top-0 right-0 left-0 h-16 bg-gray-800 shadow flex items-center justify-center justify-between px-8">
         <h1 className="text-xl font-semibold">
            Admin Panel
         </h1>

         <div className="flex items-center gap-4">
            <span>Admin</span>
            <button className="rounded-full bg-gray-200 px-4 py-2">Profile</button>
         </div>
        </header>
    )
}