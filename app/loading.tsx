export default function RootLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#EDE8E0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#2C1810] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#2C1810] font-medium">Загрузка...</p>
      </div>
    </div>
  )
}
