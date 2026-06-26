import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { extractAndStripExif } from '../../services/exif';
import { X, Camera, PaperPlaneRight, MapPin, Microphone } from '@phosphor-icons/react';

interface ReportFormProps {
  onClose: () => void;
  userLatitude: number;
  userLongitude: number;
  userAddress: string;
  onReportSuccess: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  onClose,
  userLatitude,
  userLongitude,
  userAddress,
  onReportSuccess
}) => {
  const { user } = useAuth();
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Tracks the live object URL so it can be revoked on replace/unmount.
  const previewUrlRef = useRef<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      // Revoke the previous preview URL before creating a new one to avoid leaks.
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setImagePreview(url);
    }
  };

  // Revoke any outstanding object URL when the form unmounts.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description && !image) {
      setErrorMessage('Please provide an image or a description of the issue.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setStatusMessage('Processing image EXIF metadata...');

    try {
      let finalMediaUrl = '';
      let mimeType = 'image/jpeg';
      let imageBase64: string | undefined;

      // 1. Process Image and strip EXIF
      if (image) {
        mimeType = image.type;
        const cleaned = await extractAndStripExif(image);
        
        // Convert to base64 to send directly in request body (extremely robust fallback)
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            // extract raw base64 string
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(cleaned.cleanBlob);
        });
        imageBase64 = await base64Promise;

        // Try uploading to Firebase Storage if active
        try {
          if (storage && typeof storage.app !== 'undefined' && user) {
            setStatusMessage('Uploading image securely to Cloud Storage...');
            const filename = `${Date.now()}_${image.name}`;
            const storagePath = `issues/${user.uid}/images/${filename}`;
            const storageRef = ref(storage, storagePath);
            
            await uploadBytes(storageRef, cleaned.cleanBlob);
            finalMediaUrl = await getDownloadURL(storageRef);
          } else {
            throw new Error('Firebase Storage not initialized');
          }
        } catch (storageErr) {
          console.warn('Firebase Storage upload failed, utilizing direct base64 pass:', storageErr);
          finalMediaUrl = `https://mockstorage.com/issues/local_${Date.now()}.jpg`;
        }
      } else {
        // Text-only report fallback
        finalMediaUrl = '';
        mimeType = 'image/jpeg';
      }

      setStatusMessage('AI Agents analyzing infrastructure issue...');

      // 2. Submit to backend API
      const payload = {
        mediaUrl: finalMediaUrl,
        mediaType: mimeType,
        description,
        latitude: userLatitude,
        longitude: userLongitude,
        imageBase64: imageBase64,
      };

      const response = await api.post('/issues/create', payload);

      if (response.data.status === 'Rejected') {
        setErrorMessage(`Report Rejected: ${response.data.rejectionReason}`);
      } else {
        setStatusMessage('Issue reported successfully!');
        setTimeout(() => {
          onReportSuccess();
        }, 1500);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to submit report. Please check API connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: 'var(--space-4)',
      boxSizing: 'border-box',
      background: 'var(--canvas-ink)'
    }}>
      {/* Form Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--whisper-line)',
        paddingBottom: 'var(--space-2)'
      }}>
        <h2 style={{ fontSize: '18px', color: 'var(--text-high)' }}>Report Local Issue</h2>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Form Details */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1, overflowY: 'auto' }}>
        
        {/* Camera Selector Box */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            height: '180px',
            border: '2px dashed var(--whisper-line)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            background: 'var(--surface-gray)',
            position: 'relative',
            transition: 'border-color var(--duration-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--civic-emerald)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--whisper-line)'}
        >
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <Camera size={40} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Upload Issue Photo</div>
              <span style={{ fontSize: '11px' }}>JPEG, PNG, WebP up to 5MB</span>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        {/* GPS location display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          background: 'var(--surface-gray)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          border: '1px solid var(--whisper-line)'
        }}>
          <MapPin size={18} color="var(--civic-emerald)" />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GPS Verified Coordinates</div>
            <div style={{ fontSize: '12px', color: 'var(--text-high)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {userAddress || `Lat: ${userLatitude.toFixed(4)}, Lng: ${userLongitude.toFixed(4)}`}
            </div>
          </div>
        </div>

        {/* Text description input */}
        <div className="input-group">
          <label className="input-label">Describe the issue</label>
          <div style={{ position: 'relative' }}>
            <textarea
              rows={4}
              placeholder="Explain the problem (e.g. 'Large pothole on the right lane of MG road, causing vehicles to swerve...')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              style={{ paddingRight: '40px', resize: 'none' }}
            />
            {/* Mock Voice Input button for innovative UX! */}
            <button
              type="button"
              onClick={() => setDescription('Severe asphalt pothole blocking lane.')}
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Quick Voice Fill (Demo)"
            >
              <Microphone size={18} />
            </button>
          </div>
        </div>

        {/* Error/Status output */}
        {errorMessage && (
          <div style={{ fontSize: '13px', color: 'var(--status-critical)', fontWeight: 500 }}>
            {errorMessage}
          </div>
        )}
        {statusMessage && (
          <div style={{ fontSize: '13px', color: 'var(--civic-emerald)', fontWeight: 500 }}>
            {statusMessage}
          </div>
        )}

        {/* Submit action */}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary spring-hover spring-active"
          style={{ width: '100%', marginTop: 'auto' }}
        >
          {submitting ? (
            <span>Processing...</span>
          ) : (
            <>
              <PaperPlaneRight size={16} weight="fill" />
              <span>Submit Report to AI Pipeline</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
export default ReportForm;
