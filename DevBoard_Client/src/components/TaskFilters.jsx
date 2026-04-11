const TaskFilters = ({ search, setSearch, priority, setPriority, status, setStatus, label, setLabel }) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6">

      {/* Search */}
      <div className="flex-1 min-w-48">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Priority filter */}
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
      >
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>

      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
      >
        <option value="">All statuses</option>
        <option value="todo">Todo</option>
        <option value="in-progress">In Progress</option>
        <option value="in-review">In Review</option>
        <option value="done">Done</option>
      </select>

      {/* Label filter */}
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Filter by label..."
        className="bg-gray-800 border border-gray-700 text-gray-300 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition w-36"
      />

      {/* Clear */}
      {(search || priority || status || label) && (
        <button
          onClick={() => { setSearch(''); setPriority(''); setStatus(''); setLabel('') }}
          className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg px-3 py-2 text-sm transition"
        >
          Clear
        </button>
      )}
    </div>
  )
}

export default TaskFilters