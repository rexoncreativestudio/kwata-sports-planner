// src/components/AnalyticsDashboard.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Legend as PieLegend } from 'recharts';
import styles from './AnalyticsDashboard.module.css';

type PlatformStat = {
  name: string;
  count: number;
};

type StatusStat = {
  status: string;
  count: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsDashboard() {
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStat[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch platform stats
      const { data: platformData, error: platformError } = await supabase.rpc('get_tasks_per_platform_stats');
      if (platformError) console.error('Error fetching platform stats:', platformError);
      else setPlatformStats(platformData);

      // Fetch status stats
      const { data: statusData, error: statusError } = await supabase.rpc('get_tasks_by_status_stats');
      if (statusError) console.error('Error fetching status stats:', statusError);
      else setStatusStats(statusData);
    };

    fetchData();
  }, []);

  return (
    <div className={styles.grid}>
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Tasks per Platform</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={platformStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3498db" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Tasks by Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={statusStats} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
              {/* This is the corrected line: */}
              {statusStats.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <PieLegend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}