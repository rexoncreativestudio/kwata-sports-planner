// src/components/BulkScheduler.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import styles from './BulkScheduler.module.css'; // Import the corresponding CSS module

type BulkSchedulerProps = {
  onClose: () => void;
  onScheduleComplete: () => void;
};

export default function BulkScheduler({ onClose, onScheduleComplete }: BulkSchedulerProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformsMap, setPlatformsMap] = useState<Map<string, number>>(new Map());
  const [isCopied, setIsCopied] = useState(false);

  // Fetch all platforms on component load to map their names to database IDs
  useEffect(() => {
    const fetchPlatforms = async () => {
      const { data, error } = await supabase.from('platforms').select('id, name');
      if (error) {
        console.error("Could not fetch platforms:", error);
      } else if (data) {
        const newMap = new Map(data.map(p => [p.name.toLowerCase(), p.id]));
        setPlatformsMap(newMap);
      }
    };
    fetchPlatforms();
  }, []);

  // Define the sample format as a constant for easy reference
  const sampleFormat = `First Awesome Video
Platforms: YouTube, Instagram
Notes: Remember to add the end screen.
Date: 2025-07-15

Second Post
Platforms: Facebook
Date: 2025-07-16`;

  // Function to copy the sample format to the user's clipboard
  const handleCopySample = () => {
    const textArea = document.createElement('textarea');
    textArea.value = sampleFormat;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset button text after 2 seconds
    } catch (err) {
      alert('Failed to copy text. Please copy it manually.');
    }
    document.body.removeChild(textArea);
  };

  const handleSchedule = async () => {
    setIsLoading(true);
    setError(null);

    // 1. Split the text into blocks for each task (separated by blank lines)
    const taskBlocks = text.trim().split(/\n\s*\n/);
    const tasksToCreate = [];

    // 2. Parse each block to extract task details
    for (const block of taskBlocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue; // Skip invalid blocks

      const title = lines[0].trim();
      let platformNames: string[] = [];
      let notes = '';
      let scheduled_date = '';

      lines.slice(1).forEach(line => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('platforms:')) {
          platformNames = line.substring(10).split(',').map(p => p.trim());
        } else if (lowerLine.startsWith('notes:')) {
          notes = line.substring(6).trim();
        } else if (lowerLine.startsWith('date:')) {
          scheduled_date = line.substring(5).trim();
        }
      });

      // 3. Validate the parsed data
      if (!title || platformNames.length === 0 || !scheduled_date) {
        setError(`Skipping an invalid task block. Ensure Title, Platforms, and Date are provided. Block: "${title}"`);
        continue;
      }

      const platform_ids = platformNames
        .map(name => platformsMap.get(name.toLowerCase()))
        .filter((id): id is number => id !== undefined);
      
      if (platform_ids.length !== platformNames.length) {
          setError(`One or more platform names in block "${title}" are invalid. Please check spelling.`);
          continue;
      }
      
      tasksToCreate.push({ title, notes, scheduled_date, platform_ids });
    }

    if (tasksToCreate.length === 0) {
      setError("No valid tasks could be parsed from the text.");
      setIsLoading(false);
      return;
    }

    // 4. Call the RPC function for each valid task
    for (const task of tasksToCreate) {
      const { error: rpcError } = await supabase.rpc('create_task_with_platforms', {
        title: task.title,
        notes: task.notes,
        scheduled_date: task.scheduled_date,
        platform_ids: task.platform_ids,
        media_url: null,
      });

      if (rpcError) {
        setError(`An error occurred while scheduling "${task.title}": ${rpcError.message}`);
        setIsLoading(false);
        return;
      }
    }

    alert(`${tasksToCreate.length} task(s) have been successfully scheduled!`);
    onScheduleComplete();
    onClose();
    setIsLoading(false);
  };

  return (
    <div className={styles.overlay}>
        <div className={styles.modalContainer}>
            <h3 className={styles.header}>Bulk Content Scheduler</h3>
            <p className={styles.infoText}>
              Enter each task in a block, separated by a blank line. Each task must have a Title, Platforms, and Date.
            </p>

            <div className={styles.sampleContainer}>
                <div className={styles.sampleHeader}>
                    <h4>Example Format</h4>
                    <button onClick={handleCopySample} className={styles.copyButton}>
                        {isCopied ? 'Copied!' : 'Copy Sample'}
                    </button>
                </div>
                <pre className={styles.sampleCode}>
                    {sampleFormat}
                </pre>
            </div>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your content ideas here..."
                className={styles.textArea}
                disabled={isLoading}
            />
            {error && <p className={styles.errorText}>Error: {error}</p>}
            <div className={styles.footer}>
                <button onClick={onClose} disabled={isLoading} className={`${styles.button} ${styles.secondaryButton}`}>
                  Cancel
                </button>
                <button onClick={handleSchedule} disabled={isLoading} className={`${styles.button} ${styles.primaryButton}`}>
                    {isLoading ? 'Scheduling...' : 'Generate & Schedule'}
                </button>
            </div>
        </div>
    </div>
  );
}
