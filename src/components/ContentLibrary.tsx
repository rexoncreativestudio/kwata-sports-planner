// src/components/ContentLibrary.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import TaskCard from './TaskCard'; // Import the reusable component
import type { Task } from './TaskCard'; // Correctly import Task as a type
import EventDetailModal from './EventDetailModal'; // Import modal for editing
import styles from './ContentLibrary.module.css';

export default function ContentLibrary() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchAllTasks = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('content_tasks')
      .select('*, platforms(id, name)')
      .order('scheduled_date', { ascending: false });

    if (error) {
      console.error("Error fetching library tasks:", error);
    } else if (data) {
      setTasks(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const taskDate = new Date(task.scheduled_date.replace(/-/g, '/'));
      taskDate.setHours(0, 0, 0, 0);
      let startDateMatch = true;
      if (startDate) {
        const filterStartDate = new Date(startDate);
        filterStartDate.setHours(0, 0, 0, 0);
        startDateMatch = taskDate >= filterStartDate;
      }
      let endDateMatch = true;
      if (endDate) {
        const filterEndDate = new Date(endDate);
        filterEndDate.setHours(0, 0, 0, 0);
        endDateMatch = taskDate <= filterEndDate;
      }
      return titleMatch && startDateMatch && endDateMatch;
    });
  }, [tasks, searchTerm, startDate, endDate]);

  const handleUpdate = async (status: string) => {
    if (!editingTask) return;
    await supabase.from('content_tasks').update({ status }).eq('id', editingTask.id);
    setEditingTask(null);
    fetchAllTasks();
  };

  const handleDelete = async (task: Task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
        await supabase.from('content_tasks').delete().eq('id', task.id);
        if (editingTask && editingTask.id === task.id) {
            setEditingTask(null);
        }
        fetchAllTasks();
    }
  };

  return (
    <div className={styles.libraryContainer}>
        {editingTask && (
            <EventDetailModal
                event={{ resource: editingTask, start: new Date(editingTask.scheduled_date), end: new Date(editingTask.scheduled_date), title: editingTask.title }}
                onClose={() => setEditingTask(null)}
                onUpdate={handleUpdate}
                onDelete={() => handleDelete(editingTask)}
            />
        )}

      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search tasks by title..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className={styles.dateFilterGroup}>
          <input
            type="date"
            className={styles.dateInput}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span>to</span>
          <input
            type="date"
            className={styles.dateInput}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {isLoading && <p>Loading content...</p>}
      
      {!isLoading && filteredTasks.length === 0 && (
        <p className={styles.noResults}>No tasks match your filters.</p>
      )}

      <div className={styles.taskGrid}>
        {filteredTasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onEdit={setEditingTask} 
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
