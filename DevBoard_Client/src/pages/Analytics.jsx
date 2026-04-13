import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { exportAnalyticsToCSV } from '../utils/exportUtils'
import { showSuccess } from '../utils/toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import {
  getOverview, getTasksByStatus, getTasksByPriority,
  getTasksOverTime, getProjectProgress,
} from '../api/analytics'

const STATUS_COLORS = {
  'todo':        '#6366f1',
  'in-progress': '#3b82f6',
  'in-review':   '#f59e0b',
  'done':        '#22c55e',
}

const PRIORITY_COLORS = {
  low:      '#6b7280',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
}

const StatCard = ({ label, value, sub, color }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <p className="text-gray-400 text-sm mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color || 'text-white'}`}>{value}</p>
    {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
  </div>
)

const Analytics = () => {
  const navigate = useNavigate()

  const { data: overview }    = useQuery({ queryKey: ['analytics-overview'],    queryFn: getOverview })
  const { data: byStatus }    = useQuery({ queryKey: ['analytics-status'],      queryFn: getTasksByStatus })
  const { data: byPriority }  = useQuery({ queryKey: ['analytics-priority'],    queryFn: getTasksByPriority })
  const { data: overTime }    = useQuery({ queryKey: ['analytics-time'],        queryFn: getTasksOverTime })
  const { data: projectProg } = useQuery({ queryKey: ['analytics-projects'],    queryFn: getProjectProgress })
  const handleExportAnalytics = () => {
    exportAnalyticsToCSV(overview, byStatus, byPriority)
    showSuccess('Analytics exported to CSV!')
  }
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAnalytics}
            disabled={!overview}
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            ← Dashboard
          </button>
        </div>

        {/* Stat cards */}
        {overview && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total projects"
              value={overview.totalProjects}
              sub={`${overview.activeProjects} active`}
            />
            <StatCard
              label="Total tasks"
              value={overview.totalTasks}
              sub={`${overview.inProgressTasks} in progress`}
            />
            <StatCard
              label="Completion rate"
              value={`${overview.completionRate}%`}
              sub={`${overview.doneTasks} tasks done`}
              color="text-green-400"
            />
            <StatCard
              label="Overdue tasks"
              value={overview.overdueTasks}
              sub="Need attention"
              color={overview.overdueTasks > 0 ? 'text-red-400' : 'text-white'}
            />
          </div>
        )}

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Tasks over time */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Tasks — last 7 days</h3>
            {overTime && (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={overTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#f9fafb' }}
                  />
                  <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                  <Line
                    type="monotone" dataKey="created"
                    stroke="#6366f1" strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 3 }}
                    name="Created"
                  />
                  <Line
                    type="monotone" dataKey="completed"
                    stroke="#22c55e" strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 3 }}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tasks by status pie */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Tasks by status</h3>
            {byStatus && byStatus.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={220}>
                  <PieChart>
                    <Pie
                      data={byStatus}
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {byStatus.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || '#6b7280'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                      labelStyle={{ color: '#f9fafb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {byStatus.map((entry) => (
                    <div key={entry.status} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: STATUS_COLORS[entry.status] || '#6b7280' }}
                      />
                      <span className="text-gray-300 text-xs capitalize">{entry.name}</span>
                      <span className="text-gray-500 text-xs ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-10">No tasks yet</p>
            )}
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Project progress bars */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Project progress</h3>
            {projectProg && projectProg.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={projectProg} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false}/>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} unit="%"/>
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80}/>
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#f9fafb' }}
                    formatter={(v) => [`${v}%`, 'Progress']}
                  />
                  <Bar dataKey="progress" fill="#6366f1" radius={[0, 4, 4, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm text-center py-10">No projects yet</p>
            )}
          </div>

          {/* Tasks by priority */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Tasks by priority</h3>
            {byPriority && byPriority.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byPriority}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }}/>
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }}/>
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#f9fafb' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Tasks">
                    {byPriority.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={PRIORITY_COLORS[entry.name] || '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm text-center py-10">No tasks yet</p>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}

export default Analytics