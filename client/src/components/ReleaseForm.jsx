import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_RELEASE, GET_RELEASES } from '../graphql/queries';
import { CREATE_RELEASE, UPDATE_RELEASE, DELETE_RELEASE, TOGGLE_STEP } from '../graphql/mutations';
import { RELEASE_STEPS } from '../constants/steps';
import Breadcrumb from './Breadcrumb';
import './ReleaseForm.css';

export default function ReleaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [newCompletedSteps, setNewCompletedSteps] = useState([]);
  const [saving, setSaving] = useState(false);

  // Fetch release data if editing
  const { loading, error, data } = useQuery(GET_RELEASE, {
    variables: { id },
    skip: isNew,
    fetchPolicy: 'network-only',
  });

  // Mutations
  const [createRelease] = useMutation(CREATE_RELEASE, {
    refetchQueries: [{ query: GET_RELEASES }],
  });

  const [updateRelease] = useMutation(UPDATE_RELEASE, {
    refetchQueries: [{ query: GET_RELEASES }],
  });

  const [deleteRelease] = useMutation(DELETE_RELEASE, {
    refetchQueries: [{ query: GET_RELEASES }],
  });

  const [toggleStep] = useMutation(TOGGLE_STEP);

  // Populate form when data loads
  useEffect(() => {
    if (data?.release) {
      setName(data.release.name);
      // Convert ISO string to YYYY-MM-DD for date input
      const d = new Date(data.release.date);
      setDate(d.toISOString().split('T')[0]);
      setAdditionalInfo(data.release.additionalInfo || '');
    }
  }, [data]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Release name is required');
      return;
    }
    if (!date) {
      alert('Release date is required');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const result = await createRelease({
          variables: {
            input: {
              name: name.trim(),
              date,
              additionalInfo: additionalInfo || null,
              completedSteps: newCompletedSteps,
            },
          },
        });
        // Navigate to the newly created release
        navigate(`/release/${result.data.createRelease.id}`, { replace: true });
      } else {
        await updateRelease({
          variables: {
            id,
            input: {
              name: name.trim(),
              date,
              additionalInfo: additionalInfo || null,
            },
          },
        });
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save release. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const releaseName = data?.release?.name || 'this release';
    if (window.confirm(`Are you sure you want to delete "${releaseName}"?`)) {
      try {
        await deleteRelease({ variables: { id } });
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Delete failed:', err);
        alert('Failed to delete release. Please try again.');
      }
    }
  };

  const handleToggleStep = async (stepIndex) => {
    if (isNew) {
      setNewCompletedSteps((prev) =>
        prev.includes(stepIndex)
          ? prev.filter((s) => s !== stepIndex)
          : [...prev, stepIndex]
      );
    } else {
      try {
        await toggleStep({ variables: { id, stepIndex } });
      } catch (err) {
        console.error('Toggle failed:', err);
      }
    }
  };

  const isStepCompleted = (stepIndex) => {
    if (isNew) {
      return newCompletedSteps.includes(stepIndex);
    }
    return data?.release?.completedSteps?.includes(stepIndex) || false;
  };

  if (!isNew && loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading release...</p>
        </div>
      </div>
    );
  }

  if (!isNew && error) {
    return (
      <div className="container">
        <div className="error-state">
          <p>⚠️ Failed to load release</p>
          <p className="error-detail">{error.message}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to releases
          </button>
        </div>
      </div>
    );
  }

  if (!isNew && !data?.release) {
    return (
      <div className="container">
        <div className="error-state">
          <p>Release not found</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to releases
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'All releases', to: '/' },
    { label: isNew ? 'New release' : name || data?.release?.name },
  ];

  return (
    <div className="container">
      <div className="release-form-card">
        <div className="release-form-header">
          <Breadcrumb items={breadcrumbItems} />
          {!isNew && (
            <button
              id="delete-release-btn"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              Delete <span className="btn-icon">🗑</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="release-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="release-name" className="form-label">Release</label>
              <input
                id="release-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Version 1.0.0"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="release-date" className="form-label">Date</label>
              <input
                id="release-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Checklist steps */}
          <div className="steps-section">
            {RELEASE_STEPS.map((step, index) => (
              <label
                key={index}
                className={`step-checkbox ${isStepCompleted(index) ? 'step-completed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isStepCompleted(index)}
                  onChange={() => handleToggleStep(index)}
                  id={`step-${index}`}
                />
                <span className="step-checkmark"></span>
                <span className="step-label">{step}</span>
              </label>
            ))}
          </div>

          {/* Additional info */}
          <div className="form-group">
            <label htmlFor="additional-info" className="form-label">
              Additional remarks / tasks
            </label>
            <textarea
              id="additional-info"
              className="form-textarea"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Please enter any other important notes for the release"
              rows={5}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-save"
              disabled={saving}
              id="save-release-btn"
            >
              {saving ? 'Saving...' : 'Save'} {!saving && <span className="btn-icon">✓</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
