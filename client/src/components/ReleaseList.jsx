import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { GET_RELEASES } from '../graphql/queries';
import { DELETE_RELEASE } from '../graphql/mutations';
import StatusBadge from './StatusBadge';
import Breadcrumb from './Breadcrumb';
import './ReleaseList.css';

export default function ReleaseList() {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_RELEASES);
  const [deleteRelease] = useMutation(DELETE_RELEASE, {
    refetchQueries: [{ query: GET_RELEASES }],
  });

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteRelease({ variables: { id } });
      } catch (err) {
        console.error('Delete failed:', err);
        alert('Failed to delete release. Please try again.');
      }
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading releases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-state">
          <p>⚠️ Failed to load releases</p>
          <p className="error-detail">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="release-list-card">
        <div className="release-list-header">
          <Breadcrumb items={[{ label: 'All releases' }]} />
          <button
            id="new-release-btn"
            className="btn btn-primary"
            onClick={() => navigate('/release/new')}
          >
            New release <span className="btn-icon">+</span>
          </button>
        </div>

        {data.releases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No releases yet</h3>
            <p>Create your first release to get started with tracking your release process.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/release/new')}
            >
              Create first release
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="release-table">
              <thead>
                <tr>
                  <th>Release</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.releases.map((release) => (
                  <tr key={release.id} className="release-row">
                    <td className="release-name">{release.name}</td>
                    <td className="release-date">{formatDate(release.date)}</td>
                    <td>
                      <StatusBadge status={release.status} />
                    </td>
                    <td>
                      <button
                        className="btn-action btn-view"
                        onClick={() => navigate(`/release/${release.id}`)}
                        title="View release"
                      >
                        View <span className="action-icon">👁</span>
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(release.id, release.name)}
                        title="Delete release"
                      >
                        Delete <span className="action-icon">🗑</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
