// src/components/EventDetailModal.tsx
import { useState } from 'react';
import type { Event } from 'react-big-calendar';
import styles from './EventDetailModal.module.css';

type EventDetailModalProps = {
  event: Event;
  onClose: () => void;
  onUpdate: (newStatus: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

export default function EventDetailModal({ event, onClose, onUpdate, onDelete }: EventDetailModalProps) {
  const [newStatus, setNewStatus] = useState(event.resource.status);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    await onUpdate(newStatus);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    // A simple browser confirm dialog. In a real app, you might build a custom modal for this.
    if (window.confirm("Are you sure you want to delete this task?")) {
        setIsLoading(true);
        await onDelete();
        setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h3>Task Details</h3>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </header>

        <div className={styles.modalBody}>
          <h4>{event.title}</h4>
          <p><strong>Scheduled for:</strong> {event.start?.toLocaleDateString()}</p>
         

{event.resource.media_url && (
  <div className={styles.mediaPreview}>
    <img src={event.resource.media_url} alt="Task media" />
  </div>
)}
          
          {/* Section to display the list of platforms as pills */}
          <div>
            <strong>Platforms:</strong>
            <div className={styles.platformPills}>
              {event.resource.platforms && event.resource.platforms.length > 0 ? (
                event.resource.platforms.map((platform: any) => (
                  <span key={platform.id} className={styles.platformPill}>
                    {platform.name}
                  </span>
                ))
              ) : (
                <em>No platforms assigned.</em>
              )}
            </div>
          </div>

          <p className={styles.notes}>
            <strong>Notes:</strong> {event.resource.notes || <em>No notes provided.</em>}
          </p>
          
          <div className={styles.statusUpdateSection}>
            <label htmlFor="status">Update Status:</label>
            <select
              id="status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className={styles.statusSelect}
            >
              <option value="Pending">Pending</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>
        
        <footer className={styles.modalFooter}>
          <button
            className={`${styles.button} ${styles.deleteButton}`}
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Task'}
          </button>
          <button
            className={`${styles.button} ${styles.updateButton}`}
            onClick={handleUpdate}
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Status'}
          </button>
        </footer>
      </div>
    </div>
  );
}