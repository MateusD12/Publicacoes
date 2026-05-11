export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Visão geral das suas publicações e estatísticas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder cards */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow p-6">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Vídeos Publicados</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">0</dd>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow p-6">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Agendamentos Pendentes</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">0</dd>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow p-6">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Contas Conectadas</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">0</dd>
        </div>
      </div>
    </div>
  );
}