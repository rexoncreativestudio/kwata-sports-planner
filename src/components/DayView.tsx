// src/components/DayView.tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import TaskCard from './TaskCard';
import type { Task } from './TaskCard'; // Correctly import Task as a type
import styles from './DayView.module.css';
import AddTaskModal from './AddTaskModal';
import EventDetailModal from './EventDetailModal';

type DayViewProps = {
  date: Date;
  onBack: () => void;
  onTaskUpdate: () => void;
};

export default function DayView({ date, onBack, onTaskUpdate }: DayViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const toLocalISOString = (d: Date) => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchTasksForDay = useCallback(async () => {
    setIsLoading(true);
    const dateString = toLocalISOString(date);
    const { data, error } = await supabase
      .from('content_tasks')
      .select('*, platforms(id, name)')
      .eq('scheduled_date', dateString)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching tasks for day:", error);
    } else if (data) {
      setTasks(data);
    }
    setIsLoading(false);
  }, [date]);

  useEffect(() => {
    fetchTasksForDay();
  }, [fetchTasksForDay]);

  const handleTaskDelete = async (task: Task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      await supabase.from('content_tasks').delete().eq('id', task.id);
      onTaskUpdate(); // Tell dashboard to refetch
      fetchTasksForDay(); // Refetch for this view
    }
  };

  const handleUpdate = async (status: string) => {
      if(!editingTask) return;
      await supabase.from('content_tasks').update({ status }).eq('id', editingTask.id);
      setEditingTask(null);
      onTaskUpdate();
      fetchTasksForDay();
  };

  return (
    <div className={styles.dayViewContainer}>
      {/* Modals for adding/editing */}
      {showAddTask && (
        <AddTaskModal 
          slotInfo={{ start: date, end: date }} 
          onClose={() => setShowAddTask(false)} 
          onTaskAdd={() => {
            setShowAddTask(false);
            onTaskUpdate();
            fetchTasksForDay();
          }} 
        />
      )}
      {editingTask && (
        <EventDetailModal
            event={{ resource: editingTask, start: date, end: date, title: editingTask.title }}
            onClose={() => setEditingTask(null)}
            onUpdate={handleUpdate}
            onDelete={async () => {
                await handleTaskDelete(editingTask);
                setEditingTask(null);
            }}
        />
      )}

      {/* Header */}
      <header className={styles.header}>
        <div>
          <button onClick={onBack} className={styles.backButton}>&larr; Back to Calendar</button>
          <h2 className={styles.title}>{formattedDate}</h2>
        </div>
        <button onClick={() => setShowAddTask(true)} className={styles.addTaskButton}>
          + Add New Task
        </button>
      </header>

      {/* Task Grid */}
      <div className={styles.taskGrid}>
        {isLoading && <p>Loading tasks...</p>}
        {!isLoading && tasks.length === 0 && <p>No tasks scheduled for this day.</p>}
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onEdit={setEditingTask} 
            onDelete={handleTaskDelete}
          />
        ))}
      </div>
    </div>
  );
}
