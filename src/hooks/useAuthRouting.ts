import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const useAuthRouting = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleGetStarted = () => {
    if (loading) return; // Don't navigate while loading
    
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleConnect = () => {
    if (loading) return;
    
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handlePass = () => {
    if (loading) return;
    
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleStartMatching = () => {
    if (loading) return;
    
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleStartFindingPartners = () => {
    if (loading) return;
    
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return {
    handleGetStarted,
    handleConnect,
    handlePass,
    handleStartMatching,
    handleStartFindingPartners,
    isAuthenticated: !!user,
    isLoading: loading
  };
};