// src/components/AddTaskModal.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import styles from './EventDetailModal.module.css';

type AddTaskModalProps = {
  slotInfo: { start: Date; end: Date };
  onClose: () => void;
  onTaskAdd: () => void;
};

// Timezone-safe helper function to format a date as YYYY-MM-DD
const toLocalISOString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddTaskModal({ slotInfo, onClose, onTaskAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<number>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchPlatforms = async () => {
      const { data } = await supabase.from('platforms').select('id, name');
      if (data) setPlatforms(data);
    };
    fetchPlatforms();
  }, []);

  const handlePlatformChange = (platformId: number) => {
    setSelectedPlatforms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(platformId)) newSet.delete(platformId);
      else newSet.add(platformId);
      return newSet;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title || selectedPlatforms.size === 0) {
      alert('Please provide a title and select at least one platform.');
      return;
    }
    setUploading(true);
    let mediaUrl: string | null = null;
    let filePath: string | null = null;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-media')
        .upload(uniqueFileName, file);

      if (uploadError) {
        alert(`Error uploading file: ${uploadError.message}`);
        setUploading(false);
        return;
      }
      filePath = uploadData.path;
    }

    if (filePath) {
      const { data: urlData } = supabase.storage
        .from('task-media')
        .getPublicUrl(filePath);
      mediaUrl = urlData.publicUrl;
    }

    const { error: rpcError } = await supabase.rpc('create_task_with_platforms', {
        title: title,
        notes: notes,
        // THE FIX: Use the timezone-safe helper function
        scheduled_date: toLocalISOString(slotInfo.start),
        platform_ids: Array.from(selectedPlatforms),
        media_url: mediaUrl
    });

    if (rpcError) {
      alert(`Error adding task: ${rpcError.message}`);
    } else {
      onTaskAdd();
      onClose();
    }
    setUploading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h3>Add New Task for {slotInfo.start.toLocaleDateString('en-GB')}</h3>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </header>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Title</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Platforms</label>
            <div className={styles.checkboxGroup}>
              {platforms.map(p => (
                <div key={p.id} className={styles.checkboxWrapper}>
                  <input
                    type="checkbox"
                    id={`platform-${p.id}`}
                    checked={selectedPlatforms.has(p.id)}
                    onChange={() => handlePlatformChange(p.id)}
                  />
                  <label htmlFor={`platform-${p.id}`}>{p.name}</label>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}></textarea>
          </div>
          <div className={styles.formGroup}>
              <label htmlFor="media">Attach Media (Image or Video)</label>
              <input id="media" type="file" onChange={handleFileChange} accept="image/*,video/*" />
          </div>
        </div>
        <footer className={styles.modalFooter}>
          <button
            className={`${styles.button} ${styles.updateButton}`}
            onClick={handleSubmit}
            disabled={uploading}
          >
            {uploading ? 'Saving...' : 'Save Task'}
          </button>
        </footer>
      </div>
    </div>
  );
}
