// src/components/TaskCard.tsx
import styles from './ContentLibrary.module.css';

export type Task = {
  id: number;
  title: string;
  notes: string | null;
  status: string;
  scheduled_date: string;
  media_url: string | null;
  platforms: { id: number; name: string }[];
};

type TaskCardProps = {
  task: Task;
  // The 'index' prop has been removed from here.
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

// 'index' has also been removed from the function parameters.
export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const formattedDate = new Date(task.scheduled_date.replace(/-/g, '/')).toLocaleDateString('en-GB');

  return (
    <div className={styles.taskCard}>
      {task.media_url && (
        <img src={task.media_url} alt={task.title} className={styles.cardImage} />
      )}
      <div className={styles.cardContent}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span className={`${styles.statusBadge} ${styles[task.status.toLowerCase()]}`}>
                {task.status}
            </span>
            <span className={styles.cardDate}>{formattedDate}</span>
        </div>

        <h4 className={styles.cardTitle}>{task.title}</h4>
        
        {task.notes && (
          <p className={styles.cardNotes}>{task.notes}</p>
        )}
        
        <div className={styles.platformPills}>
          {task.platforms.map(p => (
              <span key={p.id} className={styles.platformPill}>{p.name}</span>
          ))}
        </div>
        
        <div className={styles.cardActions}>
            <button onClick={() => onEdit(task)} className={styles.actionButton}>Update</button>
            <button onClick={() => onDelete(task)} className={`${styles.actionButton} ${styles.deleteButton}`}>Delete</button>
        </div>
      </div>
    </div>
  );
}
