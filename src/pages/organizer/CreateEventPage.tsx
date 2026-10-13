import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { categoryService, eventService } from '../../services/api';
import { Category } from '../../types';
import { Alert } from '../../components/common/Alert';
import { ImageUploadDropzone } from '../../components/common/ImageUploadDropzone';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  ExternalLink,
} from 'lucide-react';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [venue, setVenue] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('60');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [image, setImage] = useState('');
  const [googleFormUrl, setGoogleFormUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await categoryService.getAll();
        if (res.success && res.categories.length > 0) {
          setCategories(res.categories);
          setCategoryId(String(res.categories[0].id));
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !venue.trim() || !date || !registrationDeadline) {
      setAlertInfo({ type: 'error', message: 'Please complete all required fields.' });
      return;
    }

    const participantsNum = Number(maxParticipants);
    if (isNaN(participantsNum) || participantsNum <= 0) {
      setAlertInfo({ type: 'error', message: 'Maximum participants must be a positive integer.' });
      return;
    }

    if (new Date(registrationDeadline) > new Date(date)) {
      setAlertInfo({ type: 'error', message: 'Registration deadline cannot be after the event date.' });
      return;
    }

    if (googleFormUrl.trim()) {
      try {
        const parsed = new URL(googleFormUrl.trim());
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          setAlertInfo({ type: 'error', message: 'Google Form link must start with http:// or https://' });
          return;
        }
      } catch {
        setAlertInfo({
          type: 'error',
          message: 'Please provide a valid URL for the Google Form link (e.g., https://forms.gle/... or https://docs.google.com/forms/...)',
        });
        return;
      }
    }

    try {
      setLoading(true);
      setAlertInfo(null);

      const res = await eventService.create({
        title: title.trim(),
        description: description.trim(),
        category_id: Number(categoryId),
        date,
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        venue: venue.trim(),
        max_participants: participantsNum,
        registration_deadline: registrationDeadline,
        image: image.trim() || '',
        google_form_url: googleFormUrl.trim() || null,
        status: 'approved',
      });

      if (res.success) {
        if (image.trim() && res.event?.id) {
          eventService.uploadMedia(res.event.id, {
            media_type: 'banner',
            image_url: image.trim(),
            caption: `${title.trim()} Hero Banner`,
            aspect_ratio: '16:9',
            set_as_banner: true,
          }).catch((e) => console.warn('[Banner Media Save Error]:', e));
        }

        setAlertInfo({ type: 'success', message: 'Event successfully created and published.' });
        setTimeout(() => {
          navigate('/organizer/events');
        }, 1000);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Failed to create event.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header with back button */}
      <div>
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B9BB4] hover:text-[#3B82F6] transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Events</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
          Create Event
        </h1>
        <p className="text-xs sm:text-sm text-[#8B9BB4] mt-1">
          Set up basic info, schedule, venue capacity, banner image, and optional Google Form details.
        </p>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Single-Column Form Card */}
      <div className="academic-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-7">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <div className="pb-2 border-b border-[#1F2D4A] flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-[11px] font-bold">1</span>
                Basic Information
              </h2>
              <span className="text-xs text-[#8B9BB4]">Required</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Annual Hackathon 2026 or Spring Career Fair"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-base w-full"
              />
              <p className="text-xs text-[#8B9BB4] mt-1">A descriptive and clear title for attendees</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-base w-full cursor-pointer bg-[#0F1829] text-[#F8FAFC]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#111A2E] text-[#F8FAFC]">
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#8B9BB4] mt-1">Helps students discover this event in category filters</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Description & Agenda *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Provide event overview, schedule highlights, eligibility, and what participants should bring..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[10px] border border-[#1F2D4A] bg-[#0F1829] p-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] focus:ring-[3px] focus:ring-[#3B82F6]/25 transition-all placeholder:text-[#64748B]"
              />
            </div>
          </div>

          {/* Section 2: Date & Time */}
          <div className="space-y-4 pt-2 border-t border-[#1F2D4A]">
            <div className="pb-2 border-b border-[#1F2D4A] flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-[11px] font-bold">2</span>
                Date & Time
              </h2>
              <span className="text-xs text-[#8B9BB4]">Schedule</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (!registrationDeadline) setRegistrationDeadline(e.target.value);
                  }}
                  className="input-base w-full text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Start Time *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#8B9BB4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="09:30 AM"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-base w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  End Time *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#8B9BB4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="04:30 PM"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-base w-full pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Venue & Seats */}
          <div className="space-y-4 pt-2 border-t border-[#1F2D4A]">
            <div className="pb-2 border-b border-[#1F2D4A] flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-[11px] font-bold">3</span>
                Venue & Seats
              </h2>
              <span className="text-xs text-[#8B9BB4]">Logistics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Location / Venue *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B9BB4] pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., Auditorium Hall B or Tech Lab 3"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="input-base w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Total Seats / Max Capacity *
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B9BB4] pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    required
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    className="input-base w-full pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Registration Deadline *
              </label>
              <div className="relative max-w-sm">
                <Calendar className="w-4 h-4 text-[#8B9BB4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="input-base w-full pl-10 text-xs sm:text-sm"
                />
              </div>
              <p className="text-xs text-[#8B9BB4] mt-1">Registrations will automatically close after this date</p>
            </div>
          </div>

          {/* Section 4: Image */}
          <div className="space-y-4 pt-2 border-t border-[#1F2D4A]">
            <div className="pb-2 border-b border-[#1F2D4A] flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-[11px] font-bold">4</span>
                Image
              </h2>
              <span className="text-xs text-[#8B9BB4]">Banner Art</span>
            </div>

            <ImageUploadDropzone
              value={image}
              targetRatio="16:9"
              label="Event Banner Image (Optional 16:9)"
              helperText="Upload event hero art. Client-side compressed for optimal delivery."
              onChange={(dataUrl) => setImage(dataUrl)}
            />
          </div>

          {/* Section 5: Event Form Link */}
          <div className="space-y-4 pt-2 border-t border-[#1F2D4A]">
            <div className="pb-2 border-b border-[#1F2D4A] flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-[11px] font-bold">5</span>
                Event Form Link
              </h2>
              <span className="text-xs text-[#8B9BB4]">Optional</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#CBD5E1] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Event Form Link (Optional)</span>
                </label>
                {googleFormUrl.trim() && (
                  <a
                    href={googleFormUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3B82F6] hover:text-[#60A5FA] underline"
                  >
                    <span>Test Form Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                value={googleFormUrl}
                onChange={(e) => setGoogleFormUrl(e.target.value)}
                className="input-base w-full font-mono text-xs placeholder:font-sans"
              />
              <p className="text-xs text-[#8B9BB4] mt-1.5 leading-relaxed">
                Add a Google Form link with more details about this event, such as the event form or an info sheet. Students will see it on the event page.
              </p>
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-4 border-t border-[#1F2D4A] flex items-center justify-end gap-3">
            <Link
              to="/organizer/events"
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

