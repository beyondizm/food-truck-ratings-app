import React, { useEffect, useMemo, useState } from 'react';
import SchedulePlanner from './SchedulePlanner';
import './App.css';

const initialForm = {
  truck: '',
  rating: '10',
  comment: '',
  photo: null
};

function formatStars(count) {
  const full = '★'.repeat(count);
  const empty = '☆'.repeat(5 - count);
  return `${full}${empty}`;
}

export default function App() {
  const [reviews, setReviews] = useState([]);
  const [truckStats, setTruckStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [activeView, setActiveView] = useState('schedule');

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => b.id - a.id);
  }, [reviews]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/reviews');
      if (!response.ok) {
        throw new Error('Failed to load reviews');
      }
      const data = await response.json();
      setReviews(data.reviews || []);
      setTruckStats(data.trucks || {});
    } catch (err) {
      setError(err.message || 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'photo' ? (files && files[0] ? files[0] : null) : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.photo) {
      setSubmitError('Please attach a photo of the food truck.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const payload = new FormData();
      payload.append('truck', form.truck.trim());
      payload.append('rating', form.rating);
      payload.append('comment', form.comment.trim());
      payload.append('photo', form.photo);

      const response = await fetch('/api/reviews', {
        method: 'POST',
        body: payload
      });

      if (!response.ok) {
        const info = await response.json().catch(() => ({}));
        throw new Error(info.error || 'Unable to save review.');
      }

      await loadReviews();
      setForm(initialForm);
      setSubmitSuccess('Review submitted successfully!');
    } catch (err) {
      setSubmitError(err.message || 'Unable to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const truckEntries = Object.entries(truckStats);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Food Truck Operations Hub</h1>
        <p>Plan shifts that respect legal rest rules and training needs while collecting guest feedback.</p>
        <nav className="app__nav" aria-label="Primary">
          <button
            type="button"
            className={activeView === 'schedule' ? 'app__nav-button app__nav-button--active' : 'app__nav-button'}
            onClick={() => setActiveView('schedule')}
          >
            Weekly staffing planner
          </button>
          <button
            type="button"
            className={activeView === 'reviews' ? 'app__nav-button app__nav-button--active' : 'app__nav-button'}
            onClick={() => setActiveView('reviews')}
          >
            Customer reviews
          </button>
        </nav>
      </header>

      {activeView === 'schedule' ? (
        <SchedulePlanner />
      ) : (
        <>
          <main className="app__layout">
            <section className="panel">
              <h2>Submit a Review</h2>
              <form className="review-form" onSubmit={handleSubmit}>
            <label className="review-form__field">
              <span>Truck name</span>
              <input
                type="text"
                name="truck"
                value={form.truck}
                onChange={handleChange}
                placeholder="e.g. Tasty Tacos"
                required
              />
            </label>

            <label className="review-form__field">
              <span>Rating (1-10)</span>
              <input
                type="number"
                name="rating"
                value={form.rating}
                min="1"
                max="10"
                onChange={handleChange}
                required
              />
            </label>

            <label className="review-form__field">
              <span>Comment</span>
              <textarea
                name="comment"
                value={form.comment}
                onChange={handleChange}
                placeholder="What made it memorable?"
                rows={4}
                required
              />
            </label>

            <label className="review-form__field">
              <span>Upload a photo</span>
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleChange}
                required
              />
            </label>

            {submitError && <p className="message message--error">{submitError}</p>}
            {submitSuccess && <p className="message message--success">{submitSuccess}</p>}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Truck Progress</h2>
          {truckEntries.length === 0 ? (
            <p className="empty">No progress yet. Submit a perfect review to get started!</p>
          ) : (
            <ul className="truck-list">
              {truckEntries.map(([name, stats]) => (
                <li key={name} className="truck-list__item">
                  <div className="truck-list__header">
                    <h3>{name}</h3>
                    <span className="truck-list__stars" aria-label={`${stats.stars} out of 5 stars`}>
                      {formatStars(stats.stars)}
                    </span>
                  </div>
                  <div className="truck-list__progress">
                    <div className="truck-list__progress-bar">
                      <div
                        className="truck-list__progress-value"
                        style={{ width: `${Math.round((stats.progress || 0) * 100)}%` }}
                      />
                    </div>
                    <span>{Math.round((stats.progress || 0) * 100)}% toward the next star</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
            </section>
          </main>

          <section className="panel panel--wide">
            <h2>Recent Reviews</h2>
            {loading ? (
              <p className="empty">Loading reviews…</p>
            ) : error ? (
              <p className="message message--error">{error}</p>
            ) : sortedReviews.length === 0 ? (
              <p className="empty">No reviews yet. Be the first to share your thoughts!</p>
            ) : (
              <ul className="review-list">
                {sortedReviews.map((review) => (
                  <li key={review.id} className="review-card">
                    <div className="review-card__image">
                      <img src={`/uploads/${review.photo}`} alt={`${review.truck} food truck`} />
                    </div>
                    <div className="review-card__content">
                      <header>
                        <h3>{review.truck}</h3>
                        <span className="review-card__rating">Rating: {review.rating}/10</span>
                      </header>
                      <p>{review.comment}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
