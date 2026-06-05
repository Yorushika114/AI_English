import { useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { useProfileStore } from '../store/profileStore'

const COLORS = ['#2563EB', '#64748B', '#DC2626', '#16A34A', '#D97706']

export default function ProfilePage() {
  const { stats, isLoading, loadStats } = useProfileStore()

  useEffect(() => { loadStats() }, [loadStats])

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-subtle">加载中…</div>
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-subtle p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="font-semibold text-lg text-text">完成练习后查看进度</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-text">我的进度</h2>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '练习次数', value: stats.totalSessions },
          { label: '对话条数', value: stats.totalMessages },
          { label: '平均评分', value: stats.avgScore }
        ].map(item => (
          <div key={item.label} className="bg-white rounded-card p-4 border border-border text-center">
            <div className="text-2xl font-bold text-primary">
              {item.value}
            </div>
            <div className="text-xs text-subtle mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {stats.scoreHistory.length > 1 && (
        <div className="bg-white rounded-card p-4 border border-border">
          <h3 className="font-semibold text-text mb-3 text-sm">评分趋势</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={stats.scoreHistory}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.sceneDistribution.length > 0 && (
        <div className="bg-white rounded-card p-4 border border-border">
          <h3 className="font-semibold text-text mb-3 text-sm">场景分布</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={stats.sceneDistribution}
                  dataKey="count"
                  nameKey="sceneName"
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
                >
                  {stats.sceneDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5">
              {stats.sceneDistribution.map((item, i) => (
                <div key={item.sceneName} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-text">{item.sceneName}</span>
                  <span className="text-subtle">({item.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats.topErrors.length > 0 && (
        <div className="bg-white rounded-card p-4 border border-border">
          <h3 className="font-semibold text-text mb-3 text-sm">常见纠错 Top 5</h3>
          {stats.topErrors.map((err, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
            >
              <span className="text-xs text-subtle w-4">{i + 1}.</span>
              <span className="text-sm text-secondary font-medium flex-1">{err.type}</span>
              <span className="text-xs text-subtle">×{err.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
