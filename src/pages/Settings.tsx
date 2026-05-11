export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gerencie suas conexões com as redes sociais.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Contas Conectadas</h3>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">YT</div>
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">YouTube</span>
              </div>
              <button className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                Conectar
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white font-bold">TK</div>
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">TikTok</span>
              </div>
              <button className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                Conectar
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">IG</div>
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Instagram</span>
              </div>
              <button className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                Conectar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}