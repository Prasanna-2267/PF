import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { SecureViewer } from '../components/SecureViewer';

/** Full-screen secure viewer reachable by URL (used by "Resume" / continue-studying). */
export function LessonViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (!id) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <SecureViewer
      key={id}
      lessonId={id}
      onClose={() => {
        void qc.invalidateQueries({ queryKey: ['tracker'] });
        void qc.invalidateQueries({ queryKey: ['lessons'] });
        void qc.invalidateQueries({ queryKey: ['pub'] });
        navigate(-1);
      }}
    />
  );
}
