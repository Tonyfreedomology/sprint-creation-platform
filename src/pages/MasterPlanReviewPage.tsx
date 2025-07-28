import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MasterPlanReview from './MasterPlanReview';

export default function MasterPlanReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const masterPlanData = searchParams.get('masterPlan');
  const formDataString = searchParams.get('formData');
  const sprintId = searchParams.get('sprintId') || '';
  const channelName = searchParams.get('channelName') || '';

  if (!masterPlanData || !formDataString) {
    navigate('/');
    return null;
  }

  const masterPlan = JSON.parse(decodeURIComponent(masterPlanData));
  const formData = JSON.parse(decodeURIComponent(formDataString));

  const handleBack = () => {
    navigate('/');
  };

  return (
    <MasterPlanReview
      masterPlan={masterPlan}
      formData={formData}
      sprintId={sprintId}
      channelName={channelName}
      onBack={handleBack}
    />
  );
}