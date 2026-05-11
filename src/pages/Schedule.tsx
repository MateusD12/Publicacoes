export default function Schedule() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agendamentos</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gerencie os vídeos programados para publicação.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6 text-center text-gray-500 dark:text-gray-400">
          Nenhum vídeo agendado no momento.
        </div>
      </div>
    </div>
  );
}